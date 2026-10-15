# Contexto do App — Lista de Mercado

## O que é
App mobile de lista de compras para Android, construído com React Native + Expo. Permite criar, marcar e deletar itens da lista, com 3 formas de input: texto manual, foto (câmera/galeria) e áudio.

## Stack técnica
- **Framework:** React Native 0.81.5 + Expo 54
- **Linguagem:** TypeScript 5.9
- **APIs externas:**
  - Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) — extração de itens de fotos e texto
  - OpenAI Whisper (`whisper-1`) — transcrição de áudio em português
- **Persistência:** AsyncStorage (chave `@lista_mercado`)
- **UI:** expo-linear-gradient, Ionicons, tema Soft & Colorful

## Funcionalidades atuais
1. **Lista de compras** — adicionar item por texto, marcar como comprado (toggle), deletar
2. **Importação por foto** — câmera ou galeria → Claude Vision → extrai itens → modal de revisão
3. **Importação por áudio** — grava até 2min → Whisper transcreve → Claude extrai itens → modal de revisão
4. **Categorização por setores** — 10 categorias de mercado BR, auto-categorização via Claude, SectionList agrupada, troca manual via long press
5. **Compartilhar lista** — texto formatado por categoria via share sheet nativa
6. **Quantidade e unidade** — edição inline por item (un/kg/g/L/ml)
7. **Scan de nota fiscal** — foto da NFC-e → Claude Vision → banco de preços pessoal (`@historico_precos`), com nudge contextual ao concluir as compras
8. **Estimativa de custo** — preço preenchido automaticamente do histórico (match fuzzy de nomes), total estimado no header, edição manual com indicador de confiança
9. **Persistência local** — itens salvos no dispositivo via AsyncStorage
10. **Design Soft & Colorful** — gradiente teal no header, cards arredondados, empty state ilustrativo

## Estrutura de arquivos
```
App.tsx                            # Componente raiz (toda a UI e estado)
index.ts                           # Entry point Expo
constants/types.ts                 # Item, Category, Unit, ReceiptItem, PriceRecord, PriceEstimate
constants/categories.ts            # Config visual das categorias (ícone, cor, emoji)
hooks/usePhotoScanner.ts           # Foto → Claude Vision → CategorizedItem[]
hooks/useAudioScanner.ts           # Áudio → Whisper → Claude → CategorizedItem[]
hooks/useCategorizer.ts            # Texto → Claude → Category
hooks/useReceiptScanner.ts         # Foto de NFC-e → Claude Vision → ReceiptItem[]
hooks/usePriceHistory.ts           # Banco de preços pessoal + estimativa com match fuzzy
components/PhotoReviewModal.tsx    # Modal de revisão com checkboxes
components/CategoryPickerModal.tsx # Bottom sheet para trocar categoria
components/ReceiptReviewModal.tsx  # Revisão dos itens da nota fiscal
app.json                           # Config Expo (bundle iOS/Android + permissões)
eas.json                           # Config EAS Build (dev, preview, production)
.env                               # Chaves de API (não commitado)
```

## Modelo de dados
```typescript
type Item = {
  id: string;         // Date.now().toString()
  name: string;       // Nome do item
  bought: boolean;    // Se já foi comprado
  category: Category; // Setor do mercado (10 categorias)
  quantity?: number;  // Quantidade opcional
  unit?: Unit;        // un | kg | g | L | ml
  price?: number;     // Preço unitário em R$ (estimado ou manual)
}
```

## Convenções de código
- Componentes: PascalCase (`PhotoReviewModal.tsx`)
- Hooks: camelCase com prefixo `use` (`usePhotoScanner.ts`)
- Commits: conventional commits (`feat:`, `fix:`, `chore:`)
- TypeScript estrito — sem `any`

## Público-alvo
Pessoas que fazem compras de mercado e querem uma forma rápida de criar listas — incluindo mandar foto de uma lista escrita à mão ou ditar os itens.
