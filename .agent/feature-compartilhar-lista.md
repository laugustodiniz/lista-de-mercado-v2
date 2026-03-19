# Plano Técnico: Compartilhar Lista via WhatsApp / Share Sheet

## Análise de impacto

### Tipos (`constants/types.ts`)
**Nenhuma mudança.** O tipo `Item` já tem `category: Category` — tudo que precisamos para formatar o texto.

### Hooks
**Nenhum hook novo.** A feature não envolve chamada de API, estado assíncrono ou lógica reutilizável. É uma função síncrona que:
1. Formata `items[]` em string
2. Chama `Share.share()`

Uma função direta em `App.tsx` é suficiente (seguindo o padrão de `addItem`, `deleteItem`, etc.).

### Componentes
**Nenhum componente novo.** O botão de compartilhar vai direto no header do `App.tsx`.

### App.tsx
**Modificação pequena:**
- Adicionar `Share` ao import de `react-native`
- Adicionar botão no header (ícone `share-outline` no canto superior direito)
- Adicionar função `handleShareList()`

### Dependências
**Nenhuma.** `Share` é API nativa do React Native — já disponível, sem instalação.

### Dados / AsyncStorage
**Nenhuma mudança.**

---

## Plano de implementação

### Ordem: 3 passos, todos no mesmo arquivo

---

### Passo 1: Adicionar emoji às categorias (`constants/categories.ts`)

**O que fazer:** Adicionar campo `emoji` ao `CATEGORY_CONFIG` para usar na formatação do texto compartilhado.

**Interface atualizada:**
```typescript
export const CATEGORY_CONFIG: Record<Category, { icon: string; color: string; emoji: string }> = {
  'Hortifruti':         { icon: 'leaf-outline',                color: '#5DBB63', emoji: '🥬' },
  'Carnes e Aves':      { icon: 'flame-outline',               color: '#E07B54', emoji: '🥩' },
  'Laticínios e Frios': { icon: 'snow-outline',                color: '#5B9BD5', emoji: '🥛' },
  'Padaria':            { icon: 'storefront-outline',          color: '#D4A017', emoji: '🍞' },
  'Mercearia':          { icon: 'basket-outline',              color: '#9B59B6', emoji: '🛒' },
  'Bebidas':            { icon: 'wine-outline',                color: '#3498DB', emoji: '🥤' },
  'Congelados':         { icon: 'cube-outline',                color: '#1ABC9C', emoji: '🧊' },
  'Higiene Pessoal':    { icon: 'heart-outline',               color: '#E91E63', emoji: '🧴' },
  'Limpeza':            { icon: 'sparkles-outline',            color: '#FF9800', emoji: '🧹' },
  'Outros':             { icon: 'ellipsis-horizontal-outline', color: '#B2BEC3', emoji: '📦' },
};
```

**Por quê aqui e não inline?** Mantém toda a metadata de categorias centralizada. Se no futuro precisar do emoji em outro lugar (ex: notificação, widget), já está disponível.

---

### Passo 2: Função `formatListForSharing` (`App.tsx`)

**O que fazer:** Criar função que transforma `Item[]` em texto formatado.

**Lógica:**
```typescript
function formatListForSharing(items: Item[]): string {
  // Agrupar por categoria (usando CATEGORY_ORDER para manter ordem consistente)
  // Para cada categoria que tem itens:
  //   emoji + nome da categoria
  //   Para cada item: ⬚ ou ✅ + nome
  // Footer: "Enviado pelo app Lista de Mercado"
}
```

**Regras de formatação:**
- Categorias sem itens são omitidas
- Itens comprados: `✅ Nome`
- Itens pendentes: `⬚ Nome`
- Separação entre categorias: linha em branco
- Header: `🛒 Lista de Mercado`
- Footer: `Enviado pelo app Lista de Mercado`

**Exemplo de output:**
```
🛒 Lista de Mercado

🥬 Hortifruti
⬚ Banana
✅ Alface

🥛 Laticínios e Frios
⬚ Leite
⬚ Queijo

Enviado pelo app Lista de Mercado
```

---

### Passo 3: Botão de compartilhar e `handleShareList` (`App.tsx`)

**O que fazer:**
1. Adicionar `Share` ao import de `react-native`
2. Adicionar `CATEGORY_CONFIG` e `CATEGORY_ORDER` ao import de `constants/categories`
3. Criar função `handleShareList`:

```typescript
async function handleShareList() {
  if (items.length === 0) {
    Alert.alert('Lista vazia', 'Adicione itens antes de compartilhar.');
    return;
  }
  const message = formatListForSharing(items);
  await Share.share({ message });
}
```

4. Adicionar botão no header (dentro do `LinearGradient`, ao lado do título):

```tsx
<View style={styles.headerContent}>
  <View style={styles.headerTitleRow}>
    <Text style={styles.title}>Lista de Mercado</Text>
    <Pressable onPress={handleShareList} hitSlop={8}>
      <Ionicons name="share-outline" size={24} color="#fff" />
    </Pressable>
  </View>
  <View style={styles.badgeRow}>
    {/* badge existente */}
  </View>
</View>
```

5. Adicionar style `headerTitleRow`:
```typescript
headerTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
```

---

## Decisões técnicas

### Por que não um hook?
A API `Share.share()` é uma chamada fire-and-forget. Não tem estado de loading, não tem resultado para processar, não tem retry. Um hook seria over-engineering — violaria ADR-002 que reserva hooks para "lógica de API complexa e reutilizável".

### Por que botão no header e não na inputRow?
- A inputRow já tem 4 botões (add, câmera, mic) — mais um ficaria apertado
- Compartilhar é uma ação sobre a lista toda, não sobre adicionar itens — pertence ao header semanticamente
- Padrão de apps: ação de share fica no topo (WhatsApp, Notes, etc.)

### Por que texto puro e não imagem/screenshot?
- Texto puro é copiável, editável e acessível
- Funciona em qualquer app de mensagem (WhatsApp, Telegram, SMS, email)
- Não precisa de permissão de storage para gerar screenshot
- O destinatário pode pesquisar/copiar itens individuais

---

## Riscos e dívida técnica

**Nenhum risco significativo.** A feature é isolada, usa API nativa, não toca no modelo de dados nem na persistência.

**Nota futura:** Se um dia quisermos "importar lista compartilhada" (receber texto e parsear), aí sim precisaríamos de um hook + deep link. Mas isso é feature separada e não deve influenciar o MVP.
