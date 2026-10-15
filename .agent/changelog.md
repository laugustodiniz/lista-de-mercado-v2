# Changelog — Lista de Mercado

## Em andamento

### Fase 3 — Estimativa Automática de Custo
- Campo opcional `price?: number` (preço unitário em R$) no tipo `Item`
- Tipo `PriceEstimate` (price, unit, date, store?, count) em `constants/types.ts`
- `usePriceHistory`: `getLastPrice` substituída por `getPriceEstimate` com match fuzzy de nomes — normalização de acentos/plural + match por tokens ("Banana" casa com "Banana Prata")
- Ao adicionar item (texto, foto ou áudio), busca preço no histórico pessoal e preenche automaticamente
- Total estimado no header (`≈ R$ X,XX`), com cobertura `(itens com preço/total)` quando parcial
- Badge de preço no card do item (tap abre editor inline); botão "+ R$" quando sem preço
- Editor inline de preço com indicador de confiança ("Baseado em N compras" / "Sem histórico")
- Preço editável manualmente (override da estimativa) e removível
- Texto compartilhado inclui linha "💰 Total estimado: R$ X,XX"

### Preparação para iOS e distribuição
- `bundleIdentifier` iOS adicionado ao `app.json` (com.laugustodiniz.listademercadoapp)
- Config plugins `expo-image-picker` e `expo-av` com strings de permissão em português (câmera, galeria, microfone) — exigência da App Store

### Fase 2 — Scan de Nota Fiscal + Banco de Preços (Estimativa de Custo)
- Tipo `ReceiptItem` (nome, originalName, quantity, unit, unitPrice, totalPrice, category) em `constants/types.ts`
- Tipo `PriceRecord` (id, itemName, price, unit, quantity, date, store?) em `constants/types.ts`
- Hook `useReceiptScanner` — foto de NFC-e → Claude Vision → `ReceiptItem[]`
- Hook `usePriceHistory` — CRUD do banco de preços pessoal em AsyncStorage (`@historico_precos`)
- Componente `ReceiptReviewModal` — bottom sheet para revisar itens da nota com preços, categorias, total e campo de loja
- Nudge banner contextual quando todos os itens estão comprados (sugere fotografar nota fiscal)
- Integração no `App.tsx` com handlers de scan, confirmação e estado do nudge
- Loading overlay com mensagem "Analisando nota fiscal..."

### Fase 1 — Quantidade e Unidade por Item (Estimativa de Custo)
- Tipo `Unit` (union: un/kg/g/L/ml) e constante `UNIT_OPTIONS` em `constants/types.ts`
- Campos opcionais `quantity?: number` e `unit?: Unit` no tipo `Item`
- Função `updateItemDetails` para atualizar quantidade/unidade de um item
- Edição inline de quantidade/unidade no card do item (input numérico + selector de unidade)
- Badge de quantidade ao lado do badge de categoria (ex: "2kg")
- Botão discreto "+ qtd" quando quantidade não definida
- Texto compartilhado (share) inclui quantidade/unidade (ex: "⬚ Arroz (2kg)")
- Retrocompatível — itens existentes sem quantity/unit funcionam normalmente

### Categorização por Setores do Mercado
- Tipo `Category` (union com 10 categorias de mercado brasileiro) em `constants/types.ts`
- Tipo `CategorizedItem` para retorno dos hooks de scanner
- Config visual (`CATEGORY_CONFIG`) com ícone, cor e emoji em `constants/categories.ts`
- Hook `useCategorizer` — auto-categoriza item por texto via Claude Haiku
- Hooks `usePhotoScanner` e `useAudioScanner` atualizados para retornar `CategorizedItem[]`
- `PhotoReviewModal` exibe badge de categoria em cada item
- Novo `CategoryPickerModal` — bottom sheet para trocar categoria manualmente (long press)
- `App.tsx`: FlatList → SectionList com headers por categoria
- Migração retrocompatível de dados v1 (itens sem category → 'Outros')
- Loading overlay com mensagem "Categorizando item..."

### Compartilhar Lista via WhatsApp / Share Sheet
- Botão de compartilhar (`share-outline`) no header da tela principal
- Função `formatListForSharing` que gera texto formatado agrupado por categoria com emojis
- Integração com `Share.share()` nativo do React Native (abre share sheet do Android)
- Campo `emoji` adicionado ao `CATEGORY_CONFIG` em `constants/categories.ts`
- Lista vazia mostra alerta em vez de abrir share sheet

## v1.0.0 (2026-03-17)
Versão inicial do app, migrada do repositório `lista-de-mercado-app`.

### Features
- Lista de compras com adicionar, marcar como comprado e deletar itens
- Importação de itens por **foto** (câmera ou galeria → Claude Haiku Vision → extrai itens)
- Importação de itens por **áudio** (grava até 2min → OpenAI Whisper → Claude extrai itens)
- Modal de revisão com checkboxes para confirmar itens extraídos
- Persistência local com AsyncStorage
- Design Soft & Colorful (gradiente teal, Ionicons, cards arredondados)

### Stack
- React Native 0.81.5, Expo 54, TypeScript 5.9
- Anthropic Claude Haiku, OpenAI Whisper
- AsyncStorage, expo-image-picker, expo-av
