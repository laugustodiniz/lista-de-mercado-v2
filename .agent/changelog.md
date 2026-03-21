# Changelog — Lista de Mercado

## Em andamento

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
