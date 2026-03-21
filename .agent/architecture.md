# Decisões Arquiteturais — Lista de Mercado

## ADR-001: App monolítico em App.tsx
**Status:** Atual
**Contexto:** O app é simples o suficiente para ter toda a UI e estado em um único componente.
**Decisão:** Manter tudo em `App.tsx` até que a complexidade justifique navegação (React Navigation).
**Consequência:** Quando adicionarmos múltiplas telas, precisaremos migrar para React Navigation e separar os componentes.

## ADR-002: Hooks para lógica de API
**Status:** Atual
**Contexto:** A lógica de chamar APIs externas (Anthropic, OpenAI) é complexa e reutilizável.
**Decisão:** Cada integração de API vive em um hook separado (`usePhotoScanner`, `useAudioScanner`).
**Consequência:** Novos inputs (ex: importar de URL, importar de nota fiscal) devem seguir o mesmo padrão: um hook que retorna `{ ação, isLoading }`.

## ADR-003: AsyncStorage com chave única
**Status:** Atual
**Contexto:** O app tem uma única lista de compras, sem autenticação.
**Decisão:** Usar uma chave `@lista_mercado` para armazenar o array de itens como JSON.
**Consequência:** Se adicionarmos listas múltiplas, precisaremos de um schema mais complexo (ex: `@listas` com array de listas, cada uma com seus itens). Migração de dados do v1 será necessária.

## ADR-004: Chamadas diretas à API (sem SDK no client)
**Status:** Atual, mas com ressalva
**Contexto:** O app usa `fetch()` direto para as APIs Anthropic e OpenAI.
**Decisão:** Manter `fetch()` direto para simplicidade durante o aprendizado.
**Risco:** As chaves de API ficam no bundle do app (`EXPO_PUBLIC_*`). Para produção real, seria necessário um backend intermediário.

## ADR-005: Tipo Item mínimo
**Status:** Atual
**Contexto:** O modelo de dados tem apenas `{ id, name, bought }`.
**Decisão:** Manter o tipo mínimo até que uma feature exija campos adicionais (ex: categoria, quantidade, lista_id).
**Consequência:** Toda feature que toque no modelo de dados deve atualizar `constants/types.ts` e verificar a compatibilidade com os dados existentes no AsyncStorage.

## ADR-006: Categorias como union type fixo (não configurável pelo usuário)
**Status:** Atual (decisão da feature de categorização)
**Contexto:** Apps concorrentes permitem customização de categorias por loja. Isso adiciona complexidade de persistência e UI significativa.
**Decisão:** Usar 10 categorias fixas como union type TypeScript. Usuário pode mover itens entre categorias, mas não criar novas.
**Consequência:** Se no futuro quisermos categorias customizáveis, precisaremos migrar `Category` de union type para `string` e adicionar uma tela de configuração de categorias.

## ADR-007: SectionList substituindo FlatList na tela principal
**Status:** Atual (decisão da feature de categorização)
**Contexto:** Com categorias, os itens precisam ser agrupados visualmente por setor.
**Decisão:** Usar `SectionList` (nativo do React Native) em vez de `FlatList`. Seções derivadas de `items` na renderização, sem estado extra.
**Consequência:** `ListEmptyComponent` da `SectionList` não renderiza com `sections=[]`. O empty state passa a ser controlado por condicional antes da SectionList.

## ADR-008: Campos opcionais para extensão incremental do tipo Item
**Status:** Atual (decisão da feature de quantidade/unidade — Fase 1 estimativa de custo)
**Contexto:** O tipo `Item` precisa de novos campos (`quantity`, `unit`, e futuramente `price`) sem quebrar dados existentes no AsyncStorage.
**Decisão:** Novos campos são opcionais (`quantity?: number`, `unit?: Unit`). `undefined` significa "não definido pelo usuário" — distinto de um valor default. O `loadItems` usa spread com fallback parcial (mesmo padrão da migração de `category`).
**Consequência:** Toda a UI deve tratar graciosamente campos undefined (não exibir, não incluir em cálculos). Na Fase 3, `price` seguirá o mesmo padrão.

---

## Padrões a seguir em novas features

1. **Nova integração de API** → criar hook em `hooks/use<Nome>.ts`
2. **Novo componente visual reutilizável** → criar em `components/<Nome>.tsx`
3. **Novo tipo ou extensão do modelo** → editar `constants/types.ts`
4. **Nova tela** → ainda não temos navegação; se precisar de tela nova, primeiro ADR sobre React Navigation
