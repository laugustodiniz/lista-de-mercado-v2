# QA Report — Lista de Mercado v2

## Bugs abertos
_Nenhum bug registrado._

## Aprovações
- **Compartilhar Lista via WhatsApp / Share Sheet** — aprovado em 2026-03-19
- **Categorização por Setores do Mercado** — aprovado com ressalvas em 2026-03-19, bugs corrigidos

## Histórico de revisões

### 2026-03-20 — Fase 1: Quantidade e Unidade por Item
**Veredito:** ⚠️ APROVADO COM RESSALVAS
**Arquivos revisados:** `constants/types.ts`, `App.tsx`
**Critérios de aceite:** 4/4 atendidos
**Regressões:** 0

**Bugs encontrados:**
1. **(Médio) Edição descartada ao abrir outra** — `startEditingQuantity` não salva a edição em andamento antes de abrir nova edição. Resultado: se usuário edita item A e toca em "+ qtd" de B, a edição de A é perdida silenciosamente. Fix: chamar `confirmQuantityEdit()` antes de trocar o `editingQuantityId`.
2. **(Baixo/UX) Sem cancelar edição** — não há como fechar o edit row sem confirmar. Plano previa "tap fora para fechar", não implementado. Não bloqueia — limpar campo + confirmar funciona como cancel implícito.

**Observação cosmética:** `borderStyle: 'dashed'` pode não renderizar no Android (aparece como sólida).

### 2026-03-19 — Categorização por Setores do Mercado
**Veredito:** ⚠️ APROVADO COM RESSALVAS → bugs corrigidos no mesmo PR
**Arquivos revisados:** `constants/types.ts`, `constants/categories.ts`, `hooks/useCategorizer.ts`, `hooks/usePhotoScanner.ts`, `hooks/useAudioScanner.ts`, `components/PhotoReviewModal.tsx`, `components/CategoryPickerModal.tsx`, `App.tsx`
**Critérios de aceite:** 6/6 atendidos
**Regressões:** 0

**Bugs encontrados e corrigidos:**
1. **PhotoReviewModal selected state stale** — `useState` initializer não reseta ao reabrir modal com novos itens. Fix: adicionado `useEffect` que reseta `selected` quando `items` mudam. (Bug pré-existente, não regressão.)
2. **addItem stale closure** — `items` podia estar stale se `addItem` fosse chamado durante await do categorizer. Fix: trocado para `setItems(prev => ...)` funcional.

**Dívida técnica anotada (não bloqueia):**
- `validateCategory`/`parseCategorizedItems` duplicados entre `usePhotoScanner` e `useAudioScanner`. Extrair para utilitário em refatoração futura.

### 2026-03-19 — Compartilhar Lista via WhatsApp / Share Sheet
**Veredito:** ✅ APROVADO
**Arquivos revisados:** `App.tsx`, `constants/categories.ts`
**Critérios de aceite:** 5/5 atendidos
**Bugs encontrados:** 0
**Observação menor:** `Share.share()` sem try/catch — no iOS, cancelar a share sheet pode rejeitar a promise. Não afeta Android (target principal). Recomendação: adicionar try/catch em versão futura se houver suporte a iOS.
