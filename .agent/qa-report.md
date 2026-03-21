# QA Report — Lista de Mercado v2

## Bugs abertos
_Nenhum bug crítico registrado._

### Menores (não bloqueiam)
1. **Import duplicado de `ReceiptItem`** em `App.tsx` (linhas 21 e 31) — remover a linha 31 e adicionar ao import existente da linha 21.
2. **`handleReceiptConfirm` sem try/catch** — se `saveReceipt` falhar, o modal já foi fechado e o alerta de sucesso não aparece. Envolver em try/catch com Alert de erro.
3. **`useEffect` com `pending` fora de posição** — `App.tsx:333-335` está entre constantes derivadas e JSX, deveria estar agrupado com os outros hooks/effects no topo do componente.

## Aprovações
- **Fase 2: Scan de Nota Fiscal + Banco de Preços** — aprovado com ressalvas em 2026-03-20
- **Compartilhar Lista via WhatsApp / Share Sheet** — aprovado em 2026-03-19
- **Categorização por Setores do Mercado** — aprovado com ressalvas em 2026-03-19, bugs corrigidos

## Histórico de revisões

### 2026-03-20 — Fase 2: Scan de Nota Fiscal + Banco de Preços
**Veredito:** ⚠️ APROVADO COM RESSALVAS
**Arquivos revisados:** `constants/types.ts`, `hooks/useReceiptScanner.ts`, `hooks/usePriceHistory.ts`, `components/ReceiptReviewModal.tsx`, `App.tsx`
**Critérios de aceite:** 10/10 atendidos
**Regressões:** 0

**Bugs encontrados:**
1. **(Cosmético) Import duplicado** — `ReceiptItem` importado duas vezes em `App.tsx` (linhas 21 e 31). Funciona mas é código morto.
2. **(Baixo) `handleReceiptConfirm` sem try/catch** — se `saveReceipt` falhar, modal já fechou e o Alert de sucesso não aparece. Recomendado envolver em try/catch.
3. **(Cosmético) `useEffect` fora de posição** — `useEffect(() => { if (pending > 0) setNudgeDismissed(false); }, [pending])` em `App.tsx:333` está entre constantes e JSX, deveria estar com os outros hooks no topo.

**Observação:** Nenhum bug é bloqueante. Feature completa e funcional.

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
