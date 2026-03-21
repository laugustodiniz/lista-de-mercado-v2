# Plano Técnico — Fase 1: Quantidade e Unidade por Item

## Resumo
Adicionar campos opcionais `quantity` e `unit` ao tipo `Item`, com edição inline no card e integração com o compartilhamento.

## Análise de impacto

### Tipos (`constants/types.ts`)
- Adicionar `quantity?: number` e `unit?: Unit` ao tipo `Item`
- Criar union type `Unit = 'un' | 'kg' | 'g' | 'L' | 'ml'`
- **Sem migração de dados:** campos opcionais, itens existentes no AsyncStorage continuam funcionando (undefined = sem quantidade/unidade definida)

### Hooks
- **Nenhum hook novo.** A lógica é simples o suficiente para ficar no `App.tsx` (editar campos do item = mesmo padrão de `changeItemCategory`)

### Componentes
- **Nenhum componente novo.** A edição de quantidade/unidade será inline no card do item, ativada por interação direta. Não justifica um modal separado (diferente de categorias que têm 10 opções).

### App.tsx
- Nova função `updateItemQuantity(id, quantity, unit)` — mesmo padrão de `changeItemCategory`
- Modificar o `renderItem` para:
  - Exibir quantidade/unidade ao lado do nome (ex: "Arroz · 2kg")
  - Área de tap para editar quantidade/unidade (inline, sem modal)
- Modificar `formatListForSharing` para incluir quantidade/unidade no texto
- Modificar `addItem` e `addMultipleItems` para incluir defaults (sem quantity/unit = undefined)

### Dependências
- **Nenhuma nova.** Tudo com componentes nativos do React Native.

### Dados (AsyncStorage)
- **Sem migração.** Campos opcionais — `loadItems` já usa spread com defaults parciais (padrão da migração de `category`). Extender o mesmo padrão para `quantity` e `unit`.

---

## Plano de implementação

### Passo 1: Atualizar tipos (`constants/types.ts`)

```typescript
export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml';

export type Item = {
  id: string;
  name: string;
  bought: boolean;
  category: Category;
  quantity?: number;
  unit?: Unit;
};
```

**Por que optional?** Retrocompatibilidade — itens existentes no AsyncStorage não têm esses campos. Undefined = "sem quantidade definida", que é diferente de `quantity: 1`.

### Passo 2: Atualizar `App.tsx` — função de update

Adicionar função seguindo o padrão de `changeItemCategory`:

```typescript
function updateItemDetails(id: string, quantity: number | undefined, unit: Unit | undefined) {
  const newItems = items.map(item =>
    item.id === id ? { ...item, quantity, unit } : item
  );
  setItems(newItems);
  saveItems(newItems);
}
```

### Passo 3: Atualizar `App.tsx` — UI do card (renderItem)

Modificar o `renderItem` da `SectionList` para exibir e permitir edição de quantidade/unidade.

**Exibição:** Abaixo do nome do item, ao lado do badge de categoria, mostrar a quantidade/unidade quando definida.

```
┌──────────────────────────────────────┐
│ ○ Arroz                         🗑  │
│   🛒 Mercearia    [2 kg ▾]          │
└──────────────────────────────────────┘
```

**Interação de edição:**
- Tap no badge de quantidade abre edição inline:
  - Input numérico para quantidade (teclado numérico)
  - Picker/selector horizontal para unidade (un/kg/g/L/ml)
- Se não tem quantidade definida, exibir botão discreto "+ qtd" para adicionar
- Confirma ao fechar teclado ou tap fora

**Estado local de edição:**
```typescript
const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
```

Quando `editingQuantityId === item.id`, renderizar os inputs inline no lugar do badge de quantidade.

### Passo 4: Atualizar `App.tsx` — compartilhamento

Modificar `formatListForSharing` para incluir quantidade/unidade:

```typescript
// Antes:
`${check} ${item.name}`

// Depois:
const qtyStr = item.quantity && item.unit
  ? ` (${item.quantity}${item.unit})`
  : '';
`${check} ${item.name}${qtyStr}`
```

Resultado: `⬚ Arroz (2kg)` ou `✅ Leite (1L)`

### Passo 5: Estilos

Adicionar estilos para:
- `quantityBadge` — badge clicável ao lado do badge de categoria
- `quantityEditRow` — row inline com input numérico + selector de unidade
- `unitSelector` — botões horizontais un/kg/g/L/ml
- `unitBtn` / `unitBtnActive` — estado ativo/inativo dos botões de unidade
- `addQuantityBtn` — botão discreto "+ qtd"

---

## Ordem de implementação

1. `constants/types.ts` — adicionar `Unit` e campos ao `Item`
2. `App.tsx` — `updateItemDetails` + estado `editingQuantityId`
3. `App.tsx` — renderItem com exibição de quantidade
4. `App.tsx` — renderItem com edição inline
5. `App.tsx` — `formatListForSharing` com quantidade
6. `App.tsx` — estilos novos
7. Testar retrocompatibilidade (abrir app com dados existentes sem quantity/unit)

---

## Decisões de design

### Por que edição inline e não modal?
- Modal para 2 campos simples (número + 5 opções) seria over-engineering
- Categoria usa modal porque são 10 opções com ícones — faz sentido
- Quantidade/unidade são rápidos de editar inline
- Menos friction = mais pessoas preenchendo

### Por que `quantity` é optional (undefined) em vez de default 1?
- Há diferença semântica entre "o usuário definiu 1 unidade" e "o usuário não definiu quantidade"
- Itens sem quantidade definida não devem mostrar "1un" — poluição visual
- Na Fase 3 (estimativa de custo), `undefined` significa "não sei a quantidade" vs. `1` significa "quero 1"

### Alerta sobre dívida técnica
- **App.tsx está crescendo.** Com essa feature, vai ficar com ~700+ linhas. Ainda é gerenciável, mas a próxima feature que adicionar UI significativa (Fase 2 — scan de nota fiscal) deve considerar extrair componentes do renderItem para um `ItemCard.tsx` separado.
