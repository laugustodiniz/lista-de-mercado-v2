# Plano Técnico — Categorização por Setores do Mercado

## Visão geral
Adicionar categorias (Hortifruti, Carnes, Laticínios, etc.) aos itens da lista. A lista passa a ser agrupada visualmente por setor. Claude auto-categoriza itens ao serem adicionados. Usuário pode trocar categoria manualmente.

---

## Ordem de implementação

### Passo 1 — `constants/types.ts` (modificar)
Adicionar `Category` union type, atualizar `Item`, criar `CategorizedItem`.

```typescript
export type Category =
  | 'Hortifruti'
  | 'Carnes e Aves'
  | 'Laticínios e Frios'
  | 'Padaria'
  | 'Mercearia'
  | 'Bebidas'
  | 'Congelados'
  | 'Higiene Pessoal'
  | 'Limpeza'
  | 'Outros';

export type Item = {
  id: string;
  name: string;
  bought: boolean;
  category: Category;
};

// Usado pelos hooks de scanner ao retornar itens extraídos
export type CategorizedItem = {
  name: string;
  category: Category;
};
```

---

### Passo 2 — `constants/categories.ts` (criar)
Configuração visual de cada categoria (ícone Ionicons + cor).

```typescript
import { Category } from './types';

export const CATEGORY_ORDER: Category[] = [
  'Hortifruti',
  'Carnes e Aves',
  'Laticínios e Frios',
  'Padaria',
  'Mercearia',
  'Bebidas',
  'Congelados',
  'Higiene Pessoal',
  'Limpeza',
  'Outros',
];

export const CATEGORY_CONFIG: Record<Category, { icon: string; color: string }> = {
  'Hortifruti':      { icon: 'leaf-outline',                 color: '#5DBB63' },
  'Carnes e Aves':   { icon: 'flame-outline',                color: '#E07B54' },
  'Laticínios e Frios': { icon: 'snow-outline',              color: '#5B9BD5' },
  'Padaria':         { icon: 'storefront-outline',           color: '#D4A017' },
  'Mercearia':       { icon: 'basket-outline',               color: '#9B59B6' },
  'Bebidas':         { icon: 'wine-outline',                 color: '#3498DB' },
  'Congelados':      { icon: 'cube-outline',                 color: '#1ABC9C' },
  'Higiene Pessoal': { icon: 'heart-outline',                color: '#E91E63' },
  'Limpeza':         { icon: 'sparkles-outline',             color: '#FF9800' },
  'Outros':          { icon: 'ellipsis-horizontal-outline',  color: '#B2BEC3' },
};
```

---

### Passo 3 — `hooks/useCategorizer.ts` (criar)
Hook para categorizar um único item por nome, via Claude. Usado ao adicionar item por texto.

**Interface:**
```typescript
export function useCategorizer(): {
  categorize: (itemName: string) => Promise<Category>;
  isLoading: boolean;
}
```

**Lógica:**
- Chama Claude Haiku com prompt que recebe o nome do item e retorna apenas uma string JSON com a categoria
- Prompt deve listar as 10 categorias válidas e pedir que Claude escolha a mais adequada
- Em caso de erro (API offline, resposta inválida): retornar `'Outros'` silenciosamente — nunca bloquear o usuário de adicionar um item

**Prompt sugerido:**
```
You are a Brazilian supermarket item categorizer.
Given an item name, return ONLY one of these exact category strings (in Portuguese):
"Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
"Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"

Item: "{itemName}"

Return ONLY the category string. No explanation, no quotes, no markdown.
```

---

### Passo 4 — `hooks/usePhotoScanner.ts` (modificar)
Mudar o prompt e o tipo de retorno de `string[]` para `CategorizedItem[]`.

**Tipo de retorno:** `CategorizedItem[] | null` (em vez de `string[] | null`)

**Novo prompt:**
```
You are a shopping list extractor for a Brazilian supermarket app.
Analyze the image and extract items that someone would buy at a supermarket.

Rules:
- If it's a handwritten or printed list: extract each item exactly as written.
- If it's a receipt: extract only product names. Ignore prices, totals, taxes, store info.
  Shorten names to 2-4 words (e.g. "ARROZ PARBORIZADO TIO JOAO 5KG" → "Arroz Parborizado").
- For each item, assign exactly one category from this list:
  "Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
  "Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"
- Use Title Case in Portuguese for item names.
- Output ONLY a valid JSON array. No explanation, no markdown, no code block.
- Format: [{ "name": "Item Name", "category": "Category" }, ...]
- If no items found, return: []

Example: [{"name": "Arroz Parborizado", "category": "Mercearia"}, {"name": "Leite Integral", "category": "Laticínios e Frios"}]
```

**Parsing:** Ajustar o parse para `CategorizedItem[]`. Validar que cada objeto tem `name` (string) e `category` (valor válido de `Category`); se `category` for inválida, usar `'Outros'`.

---

### Passo 5 — `hooks/useAudioScanner.ts` (modificar)
Mesmo padrão do usePhotoScanner. Tipo de retorno muda de `string[]` para `CategorizedItem[]`.

**Novo prompt de extração de texto:**
```
You are a shopping list extractor. The user dictated shopping items in Portuguese.
Extract each item and assign a category.

Categories (use exactly one of these):
"Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
"Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"

Rules:
- Ignore filler words, greetings, quantities, prices
- Use Title Case in Portuguese for item names
- Output ONLY a valid JSON array. No explanation, no markdown, no code block.
- Format: [{ "name": "Item Name", "category": "Category" }, ...]
- If no items found, return: []

Transcribed text: "{transcription}"
```

---

### Passo 6 — `components/PhotoReviewModal.tsx` (modificar)
Atualizar para receber `CategorizedItem[]` em vez de `string[]`.

**Nova interface de Props:**
```typescript
type Props = {
  visible: boolean;
  items: CategorizedItem[];          // era string[]
  onConfirm: (selected: CategorizedItem[]) => void;  // era string[]
  onCancel: () => void;
};
```

**Visual:** Cada linha do modal exibe o nome do item + um badge colorido com o ícone e nome da categoria. Usar `CATEGORY_CONFIG` de `constants/categories.ts`.

**Lógica interna:** `selected` continua como `Set<number>` (por índice). `handleConfirm` filtra `items` pelos índices selecionados e passa o array de `CategorizedItem` para `onConfirm`.

---

### Passo 7 — `components/CategoryPickerModal.tsx` (criar)
Bottom sheet modal para o usuário trocar a categoria de um item existente.

**Interface:**
```typescript
type Props = {
  visible: boolean;
  current: Category;
  onSelect: (category: Category) => void;
  onCancel: () => void;
};
```

**Visual:** Lista as 10 categorias. Cada linha: ícone colorido (da CATEGORY_CONFIG) + nome. Categoria atual marcada com checkmark. Tap seleciona e fecha o modal.

---

### Passo 8 — `App.tsx` (modificar)

#### 8a. Novos imports
```typescript
import { SectionList } from 'react-native';   // substituir FlatList
import { useCategorizer } from './hooks/useCategorizer';
import CategoryPickerModal from './components/CategoryPickerModal';
import { CATEGORY_ORDER, CATEGORY_CONFIG } from './constants/categories';
import { CategorizedItem, Category } from './constants/types';
```

#### 8b. Novos estados
```typescript
const [editCategoryItem, setEditCategoryItem] = useState<Item | null>(null);
```
Mudar:
```typescript
const [reviewItems, setReviewItems] = useState<CategorizedItem[]>([]);  // era string[]
```

#### 8c. Novo hook
```typescript
const { categorize, isLoading: categorizerLoading } = useCategorizer();
```

#### 8d. `loadItems` — migração de dados v1
```typescript
async function loadItems() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const raw = JSON.parse(json) as Item[];
      // Migração: itens v1 não têm category
      const migrated = raw.map(item => ({
        ...item,
        category: item.category ?? 'Outros' as Category,
      }));
      setItems(migrated);
    }
  } catch {}
}
```

#### 8e. `addItem` — vira async, chama categorizer
```typescript
async function addItem() {
  const name = input.trim();
  if (!name) return;
  Keyboard.dismiss();
  setInput('');
  const category = await categorize(name);  // Claude categoriza
  const newItems = [
    ...items,
    { id: Date.now().toString(), name, bought: false, category },
  ];
  setItems(newItems);
  saveItems(newItems);
}
```

#### 8f. `addMultipleItems` — recebe `CategorizedItem[]`
```typescript
function addMultipleItems(categorizedItems: CategorizedItem[]) {
  if (categorizedItems.length === 0) return;
  const now = Date.now();
  const newItems = [
    ...items,
    ...categorizedItems.map((ci, i) => ({
      id: (now + i).toString(),
      name: ci.name,
      bought: false,
      category: ci.category,
    })),
  ];
  setItems(newItems);
  saveItems(newItems);
}
```

#### 8g. `handleReviewConfirm`
```typescript
function handleReviewConfirm(selected: CategorizedItem[]) {
  setReviewVisible(false);
  addMultipleItems(selected);
}
```

#### 8h. `changeItemCategory`
```typescript
function changeItemCategory(id: string, category: Category) {
  const newItems = items.map(item =>
    item.id === id ? { ...item, category } : item
  );
  setItems(newItems);
  saveItems(newItems);
  setEditCategoryItem(null);
}
```

#### 8i. Cálculo de seções para SectionList
```typescript
// Derivado dos items (não precisa de estado próprio)
const sections = CATEGORY_ORDER
  .map(category => ({
    title: category,
    data: items.filter(item => item.category === category),
  }))
  .filter(section => section.data.length > 0);
```

#### 8j. `showLoading` — adicionar categorizerLoading
```typescript
const showLoading = photoLoading || audioLoading || categorizerLoading;
const loadingMessage = audioLoading
  ? 'Processando áudio...'
  : categorizerLoading
  ? 'Categorizando item...'
  : 'Analisando imagem...';
```

#### 8k. Substituir `FlatList` por `SectionList`
- `data={items}` → `sections={sections}`
- `renderItem` permanece igual (mesmo JSX do card)
- Adicionar `renderSectionHeader` com o header de categoria (ícone + nome + cor)
- `ListEmptyComponent` sai da SectionList; controlar via `{items.length === 0 && <EmptyState />}` renderizado antes da SectionList

#### 8l. Long press no card → abre CategoryPickerModal
```typescript
<Pressable
  onPress={() => toggleItem(item.id)}
  onLongPress={() => setEditCategoryItem(item)}
  ...
>
```

#### 8m. Render do CategoryPickerModal
```tsx
<CategoryPickerModal
  visible={editCategoryItem !== null}
  current={editCategoryItem?.category ?? 'Outros'}
  onSelect={category => changeItemCategory(editCategoryItem!.id, category)}
  onCancel={() => setEditCategoryItem(null)}
/>
```

---

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `constants/types.ts` | Modificar — adicionar `Category`, `CategorizedItem`, atualizar `Item` |
| `constants/categories.ts` | Criar — `CATEGORY_ORDER` e `CATEGORY_CONFIG` |
| `hooks/useCategorizer.ts` | Criar — categoriza item por texto via Claude |
| `hooks/usePhotoScanner.ts` | Modificar — prompt + tipo de retorno |
| `hooks/useAudioScanner.ts` | Modificar — prompt + tipo de retorno |
| `components/PhotoReviewModal.tsx` | Modificar — recebe `CategorizedItem[]`, mostra badge |
| `components/CategoryPickerModal.tsx` | Criar — bottom sheet para trocar categoria |
| `App.tsx` | Modificar — migração, SectionList, useCategorizer, CategoryPickerModal |

---

## Dívidas técnicas registradas

1. **App.tsx crescendo**: Após esta feature, App.tsx estará em ~680 linhas. A próxima feature de tamanho M ou maior deve ser acompanhada de uma extração do estado para um hook customizado `useShoppingList`.

2. **Custo por item digitado**: Cada item adicionado por texto gera 1 chamada Claude. Para minimizar: a chamada só ocorre ao pressionar "Adicionar" (não em tempo real). Monitorar se o custo se torna um problema.

3. **Latência visível no texto**: Usuário verá loading de ~1s ao adicionar por texto. Mitigação futura: optimistic add (item entra como 'Outros' instantaneamente, depois atualiza com a categoria real).
