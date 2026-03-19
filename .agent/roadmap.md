# Roadmap — Lista de Mercado v2

## Em desenvolvimento

### [ALTA] Categorização por Setores do Mercado
**Plano técnico:** `.agent/feature-categorizacao.md`

## Backlog

### ~~[ALTA] Categorização por Setores do Mercado~~
**Dor:** Lista linear força o usuário a ir e voltar no mercado. Falta organização por setor (hortifruti, carnes, laticínios, etc.).

**Análise de mercado:** Todos os concorrentes (AnyList, Bring!, OurGroceries, Listonic) têm esta feature. Todos usam dicionário ou regras fixas para auto-categorização. Nosso diferencial: Claude auto-categoriza com IA real, mais precisa para itens em português e itens incomuns.

**Público impactado:** Todos os usuários que compram em mercado físico.

**Critérios de aceite (MVP):**
- [ ] Campo `category: string` opcional adicionado ao tipo `Item` (retrocompatível — itens antigos ficam em "Outros")
- [ ] 10 categorias padrão de mercado brasileiro: Hortifruti, Carnes e Aves, Laticínios e Frios, Padaria, Mercearia, Bebidas, Congelados, Higiene Pessoal, Limpeza, Outros
- [ ] Ao adicionar item por texto, Claude auto-categoriza o item
- [ ] Ao importar por foto ou áudio, Claude categoriza cada item durante a extração
- [ ] Lista agrupa itens visualmente por categoria (seções com header)
- [ ] Usuário pode alterar manualmente a categoria (tap no card → picker)

**Fora do MVP:** customização por loja, reordenação de categorias, memória de categoria por nome de item.

**Esforço:** M (1-2 sessões)
**Dependências:** Nenhuma

### [ALTA] Compartilhar Lista via WhatsApp / Share Sheet
**Plano técnico:** `.agent/feature-compartilhar-lista.md`
**Dor:** Quem compra para a casa precisa enviar a lista para outra pessoa (cônjuge, colega). Hoje teria que copiar item por item ou tirar print. WhatsApp é canal universal no Brasil (99% dos smartphones).

**Análise de mercado:** AnyList envia texto puro via share sheet. Bring! e Listonic enviam links (exigem app instalado). OurGroceries só compartilha via convite por email. Nosso approach: texto formatado legível direto no WhatsApp, sem exigir app do destinatário.

**Público impactado:** Todos os usuários — compras de mercado são inerentemente compartilhadas.

**Critérios de aceite (MVP):**
- [ ] Botão "Compartilhar" visível na tela principal (header ou FAB)
- [ ] Gera texto formatado da lista agrupado por categoria (se disponível) ou lista simples
- [ ] Itens comprados com ✅, não comprados com ⬚
- [ ] Abre share sheet nativa do Android (`Share` API do React Native)
- [ ] Lista vazia → feedback (toast/alert), não abre share sheet

**Formato do texto:**
```
🛒 Lista de Mercado

🥬 Hortifruti
⬚ Banana
✅ Alface

🥛 Laticínios
⬚ Leite

Enviado pelo app Lista de Mercado
```

**Esforço:** P (pequeno — <1 sessão). `Share.share()` nativo + formatação de string.
**Prioridade:** Alta — razão valor/esforço excepcional (valor alto + esforço mínimo + alcance amplo)
**Dependências:** Idealmente após Categorização por Setores (para agrupar por categoria no texto), mas pode ser implementada sem.

### [MÉDIA] Salvar Listas e Histórico de Compras
**Dor:** Lista única e efêmera — ao terminar as compras, tudo desaparece. ~70% dos itens de mercado são recorrentes, mas o usuário recria a lista toda semana. Não consegue consultar compras passadas nem reutilizar listas temáticas (churrasco, festa, compras do mês).

**Análise de mercado:** Todos os concorrentes (AnyList, Bring!, OurGroceries, Listonic) suportam múltiplas listas. Listonic permite reutilizar listas passadas com um tap e sugere itens frequentes. AnyList mantém histórico de itens recentes. Feature é table stakes no mercado.

**Público impactado:** Todos os usuários que fazem compras mais de uma vez por mês. Especialmente útil para quem tem listas temáticas.

**Critérios de aceite (MVP):**
- [ ] Botão "Salvar Lista" que salva a lista atual com nome (sugerido: data automática, editável)
- [ ] Tela de "Histórico de Listas" acessível do header
- [ ] Cada lista salva mostra: nome, data, quantidade de itens
- [ ] Tap numa lista salva abre visualização dos itens
- [ ] Opção "Reusar lista" que carrega os itens da lista salva na lista ativa (sem duplicar itens já presentes)
- [ ] Opção de deletar lista salva
- [ ] Persistência das listas salvas via AsyncStorage (chave separada, ex: `@listas_salvas`)

**Fora do MVP:** múltiplas listas ativas simultâneas, templates, sugestão automática de itens frequentes, busca no histórico.

**Esforço:** G (grande — 3+ sessões). Requer React Navigation (app é single-screen hoje), novo modelo de dados, migração de AsyncStorage, nova tela completa.
**Prioridade:** Média — valor real mas esforço alto. Melhor razão valor/esforço implementando após Compartilhar Lista e quando navegação multi-tela já existir.
**Dependências:** Categorização por Setores (listas salvas devem preservar categorias). Introdução de React Navigation como pré-requisito técnico.

## Concluído
- [v1.0.0] Lista de compras com adicionar/marcar/deletar
- [v1.0.0] Importação por foto (Claude Vision)
- [v1.0.0] Importação por áudio (Whisper + Claude)
- [v1.0.0] Persistência local (AsyncStorage)
- [v1.0.0] Design Soft & Colorful
