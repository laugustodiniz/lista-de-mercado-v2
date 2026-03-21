# Plano Técnico — Fase 2: Scan de Nota Fiscal + Banco de Preços

## Resumo
Permitir ao usuário fotografar a nota fiscal (NFC-e), extrair itens com preços via Claude Vision, revisar os dados, e salvar num banco de preços pessoal persistido no AsyncStorage. Inclui nudge contextual quando todos os itens estão marcados como comprados.

---

## Análise de impacto

### Tipos (`constants/types.ts`)
- **Novo tipo `ReceiptItem`** — item extraído da nota fiscal (nome, quantidade, unidade, preço unitário, preço total)
- **Novo tipo `PriceRecord`** — registro persistido no banco de preços pessoal
- Tipo `Item` **não muda** nesta fase (campo `price` será adicionado na Fase 3)

### Hooks
- **Novo hook `useReceiptScanner`** — segue padrão ADR-002. Foto → Claude Vision → `ReceiptItem[]`. Reutiliza a mesma infra de câmera/galeria do `usePhotoScanner`.
- **Novo hook `usePriceHistory`** — CRUD do banco de preços pessoal em AsyncStorage. Interface: `{ saveReceipt, getHistory, getLastPrice, isLoading }`.

### Componentes
- **Novo componente `ReceiptReviewModal`** — similar ao `PhotoReviewModal`, mas exibe preço, quantidade e unidade de cada item. Diferente o suficiente para justificar componente separado (campos editáveis de preço, campo de nome da loja, total da nota).

### App.tsx
- **Nudge banner** quando `items.length > 0 && pending === 0` (todos comprados)
- **Botão/handler** para acionar o scan de nota fiscal (reutiliza Alert de câmera/galeria)
- **Handler de confirmação** do `ReceiptReviewModal` que salva no banco de preços
- Estado `nudgeDismissed` (boolean, reseta quando a lista muda)
- **App.tsx vai ultrapassar 900 linhas.** Conforme sinalizado na Fase 1, o `renderItem` deveria ser extraído para `ItemCard.tsx`, mas vamos manter o foco na feature e anotar como dívida técnica.

### Dependências
- **Nenhuma nova.** `expo-image-picker` já está instalado. Claude Vision já é usado.

### Dados (AsyncStorage)
- **Nova chave `@historico_precos`** — array de `PriceRecord[]`, separado da lista de itens.
- **Sem migração** — chave nova, não afeta dados existentes.

---

## Novos tipos

```typescript
// Item extraído da nota fiscal pelo Claude Vision
export type ReceiptItem = {
  name: string;           // Nome do produto (normalizado, Title Case, 2-4 palavras)
  originalName: string;   // Nome original da nota (ex: "BANANA PRATA KG")
  quantity: number;        // Quantidade comprada
  unit: string;            // Unidade (UN, KG, G, L, ML)
  unitPrice: number;       // Preço unitário (R$)
  totalPrice: number;      // Preço total (qtd × unitário)
  category: Category;      // Categoria auto-atribuída
};

// Registro persistido no banco de preços pessoal
export type PriceRecord = {
  id: string;              // Date.now().toString()
  itemName: string;        // Nome normalizado (ex: "Banana")
  price: number;           // Preço unitário (R$)
  unit: string;            // Unidade
  quantity: number;        // Quantidade comprada
  date: string;            // ISO date string
  store?: string;          // Nome do estabelecimento (opcional)
};
```

---

## Novo hook: `useReceiptScanner`

**Arquivo:** `hooks/useReceiptScanner.ts`
**Padrão:** mesmo do `usePhotoScanner` (ADR-002)

**Interface:**
```typescript
{
  scanReceiptFromGallery: () => Promise<ReceiptItem[] | null>;
  scanReceiptFromCamera: () => Promise<ReceiptItem[] | null>;
  isLoading: boolean;
}
```

**Prompt do Claude Vision para NFC-e:**
```
You are a Brazilian receipt (NFC-e / nota fiscal) data extractor.
Analyze the image of a receipt and extract ALL purchased items with their prices.

For each item, extract:
- name: Product name, simplified to 2-4 words in Title Case Portuguese
  (e.g., "ARROZ PARBOIL TIO JOAO 5KG" → "Arroz Parboilizado")
- originalName: The exact text from the receipt
- quantity: Number of units purchased
- unit: Unit of measurement (UN, KG, G, L, ML) — normalize to lowercase
- unitPrice: Price per unit in R$ (number, no currency symbol)
- totalPrice: Total price for this item (quantity × unitPrice)
- category: Exactly one of:
  "Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
  "Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"

Rules:
- Parse ALL items, including tax-exempt items
- Ignore lines that are totals, subtotals, payment method, change, store info, tax info
- If quantity is not explicit, assume 1 UN
- Output ONLY a valid JSON array. No explanation, no markdown, no code block.
- Format: [{"name":"...","originalName":"...","quantity":1,"unit":"un","unitPrice":5.99,"totalPrice":5.99,"category":"..."}, ...]
- If no items found, return: []
```

**Diferenças do prompt do `usePhotoScanner`:**
- `usePhotoScanner` extrai **nomes de itens** de uma lista escrita à mão
- `useReceiptScanner` extrai **itens com preços** de uma nota fiscal
- São prompts fundamentalmente diferentes, justificando hooks separados

**Implementação:** Reutilizar a mecânica de `usePhotoScanner` (ImagePicker → base64 → Claude API → parse JSON), mas com prompt diferente e tipo de retorno `ReceiptItem[]`.

---

## Novo hook: `usePriceHistory`

**Arquivo:** `hooks/usePriceHistory.ts`
**Padrão:** CRUD simples sobre AsyncStorage

**Interface:**
```typescript
{
  saveReceipt: (items: ReceiptItem[], store?: string) => Promise<void>;
  getLastPrice: (itemName: string) => Promise<PriceRecord | null>;
  getAllHistory: () => Promise<PriceRecord[]>;
  isLoading: boolean;
}
```

**Chave AsyncStorage:** `@historico_precos`

**Lógica de `saveReceipt`:**
1. Recebe array de `ReceiptItem[]` + nome da loja (opcional)
2. Converte cada `ReceiptItem` em `PriceRecord` com data atual e id único
3. Lê registros existentes do AsyncStorage
4. Concatena novos registros
5. Salva de volta

**Lógica de `getLastPrice`:**
1. Lê todos os registros
2. Filtra por `itemName` (case-insensitive, trim)
3. Retorna o mais recente (por `date`)

**Normalização de nomes:**
- Para o match funcionar na Fase 3, os nomes devem ser normalizados ao salvar
- Normalização simples: Title Case, trim, remover acentos para comparação
- Match exato primeiro, depois case-insensitive — match fuzzy avançado (Levenshtein) fica fora do MVP

---

## Novo componente: `ReceiptReviewModal`

**Arquivo:** `components/ReceiptReviewModal.tsx`
**Inspiração visual:** `PhotoReviewModal` (bottom sheet com checkboxes)

**Props:**
```typescript
type Props = {
  visible: boolean;
  items: ReceiptItem[];
  onConfirm: (selected: ReceiptItem[], store: string) => void;
  onCancel: () => void;
};
```

**Layout de cada item no modal:**
```
┌─────────────────────────────────────────┐
│ ✓ Arroz Parboilizado                   │
│   🛒 Mercearia   2kg   R$ 5,49/kg      │
│   Total: R$ 10,98                       │
│   "ARROZ PARBOIL TIO JOAO 5KG"  (orig) │
└─────────────────────────────────────────┘
```

**Elementos do modal:**
1. **Título:** "Itens da nota fiscal (N)"
2. **Subtítulo:** "Desmarque os que não quer registrar"
3. **Campo de nome da loja** (TextInput, opcional, placeholder "Nome do supermercado")
4. **Lista de itens** com checkbox, nome, categoria, qtd, unidade, preço unitário, total
5. **Nome original** da nota em texto menor (para conferência do usuário)
6. **Total da nota** exibido no footer (soma dos itens selecionados)
7. **Botões** Cancelar / Salvar (N itens)

**Por que não reutilizar `PhotoReviewModal`:**
- `PhotoReviewModal` trabalha com `CategorizedItem` (só nome + categoria)
- `ReceiptReviewModal` precisa exibir preço, quantidade, unidade, total, campo de loja
- Tentar generalizar o `PhotoReviewModal` adicionaria complexidade sem ganho real
- São usados em contextos diferentes (adicionar itens à lista vs. registrar preços)

---

## Mudanças no App.tsx

### 1. Novos imports e estado

```typescript
import { useReceiptScanner } from './hooks/useReceiptScanner';
import { usePriceHistory } from './hooks/usePriceHistory';
import ReceiptReviewModal from './components/ReceiptReviewModal';
import { ReceiptItem } from './constants/types';

// Novos estados:
const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
const [receiptReviewVisible, setReceiptReviewVisible] = useState(false);
const [nudgeDismissed, setNudgeDismissed] = useState(false);
```

### 2. Nudge contextual

**Condição de exibição:** `items.length > 0 && pending === 0 && !nudgeDismissed`

O `nudgeDismissed` reseta para `false` quando a lista muda (quando `pending` volta a ser > 0).

**UI:** Banner acima da `inputRow`, com ícone de câmera, texto, e botão de fechar.

```
┌──────────────────────────────────────────────┐
│ 📸 Compras feitas! Quer tirar foto da nota   │
│ fiscal? Assim estimamos o custo da próxima   │ ✕
│ lista.              [Fotografar nota]        │
└──────────────────────────────────────────────┘
```

### 3. Handler de scan de nota fiscal

```typescript
async function handleScanReceipt() {
  // Mesmo padrão do handleScanPhoto — Alert com opções galeria/câmera
  Alert.alert('Registrar nota fiscal', 'Escolha uma opção', [
    { text: 'Galeria de fotos', onPress: () => runReceiptScan('gallery') },
    { text: 'Tirar foto', onPress: () => runReceiptScan('camera') },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

async function runReceiptScan(source: 'gallery' | 'camera') {
  const extracted = source === 'gallery'
    ? await scanReceiptFromGallery()
    : await scanReceiptFromCamera();
  if (extracted === null) return;
  if (extracted.length > 0) {
    setReceiptItems(extracted);
    setReceiptReviewVisible(true);
  } else {
    Alert.alert('Nenhum item encontrado', 'Não foi possível identificar itens na nota fiscal.');
  }
}
```

### 4. Handler de confirmação do receipt

```typescript
async function handleReceiptConfirm(selected: ReceiptItem[], store: string) {
  setReceiptReviewVisible(false);
  await saveReceipt(selected, store || undefined);
  Alert.alert(
    'Preços registrados!',
    `${selected.length} ${selected.length === 1 ? 'item salvo' : 'itens salvos'} no seu histórico de preços.`
  );
}
```

### 5. Loading message

Adicionar ao `loadingMessage`:
```typescript
const loadingMessage = receiptLoading
  ? 'Analisando nota fiscal...'
  : audioLoading
  ? 'Processando áudio...'
  // ...
```

---

## Ordem de implementação

1. **`constants/types.ts`** — adicionar `ReceiptItem` e `PriceRecord`
2. **`hooks/useReceiptScanner.ts`** — criar hook (copiar estrutura de `usePhotoScanner`, mudar prompt e tipo de retorno)
3. **`hooks/usePriceHistory.ts`** — criar hook de CRUD do AsyncStorage
4. **`components/ReceiptReviewModal.tsx`** — criar modal de revisão (inspirado em `PhotoReviewModal`)
5. **`App.tsx`** — integrar hooks, handlers, nudge banner, e `ReceiptReviewModal`
6. Testar com foto real de NFC-e

---

## Decisões de design

### Por que hook separado `useReceiptScanner` (e não reutilizar `usePhotoScanner`)?
- Prompts completamente diferentes (lista de compras vs. nota fiscal)
- Tipos de retorno diferentes (`CategorizedItem[]` vs. `ReceiptItem[]`)
- Contextos de uso diferentes (adicionar itens vs. registrar preços)
- Seguindo ADR-002: cada integração de API em hook separado

### Por que `ReceiptReviewModal` separado?
- Dados e ações diferentes do `PhotoReviewModal`
- Precisa exibir campos adicionais (preço, qty, total, loja)
- Tentar generalizar geraria um componente complexo demais
- Custo de criar é baixo (bottom sheet com FlatList, padrão já estabelecido)

### Normalização de nomes — simples por agora
- Claude já normaliza os nomes (Title Case, 2-4 palavras) no prompt
- Match na Fase 3 será case-insensitive com trim
- Não implementar Levenshtein/fuzzy avançado no MVP — complexidade sem ganho comprovado
- Se necessário, pode ser adicionado depois com base em feedback real

### Nudge contextual — session-only
- `nudgeDismissed` é estado React (não persiste no AsyncStorage)
- Reseta ao reabrir o app ou quando a lista muda
- Não adicionar lógica de "não mostrar nunca mais" — se incomodar, usuário só fecha

---

## Alerta de dívida técnica
- **App.tsx ~950 linhas** após esta feature. Na próxima feature, extrair `ItemCard.tsx` e `NudgeBanner.tsx` como componentes separados.
- **`parseCategorizedItems` duplicado** entre `usePhotoScanner` e `useAudioScanner` (já anotado no QA report anterior). Agora `useReceiptScanner` terá seu próprio parser. Quando houver refatoração, extrair para `utils/parseClaudeResponse.ts`.
