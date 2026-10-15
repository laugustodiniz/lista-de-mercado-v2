# Lista de Mercado — Contexto do Projeto

## O que é este projeto
App mobile de lista de compras construído com React Native + Expo. Projeto de aprendizado do Claude Code por Luis Diniz, PM em Platform Engineering.

**Objetivo principal:** Aprender Claude Code usando o desenvolvimento do app como veículo de aprendizado.

## Stack técnica
- **Framework:** React Native 0.81 com Expo 54
- **Linguagem:** TypeScript
- **Teste no dispositivo:** Expo Go (Android e iOS)
- **Controle de versão:** Git + GitHub

## Comandos essenciais
```bash
# Rodar o app (gera QR code para Expo Go)
npm start

# Instalar nova dependência
npm install <pacote>

# Ver status do git
git status

# Criar PR no GitHub
gh pr create
```

## Estrutura de arquivos
```
App.tsx              # Componente raiz
components/          # Componentes reutilizáveis
hooks/               # Lógica de estado (hooks customizados)
constants/           # Tipos TypeScript e constantes
assets/              # Imagens e ícones
```

## Funcionalidades
- [x] Lista de compras (adicionar, marcar como comprado, deletar) com AsyncStorage
- [x] Importação por foto e por áudio (Claude Vision + Whisper)
- [x] Categorização por setores do mercado (auto via Claude)
- [x] Compartilhar lista via share sheet
- [x] Quantidade/unidade por item e scan de nota fiscal (banco de preços pessoal)
- [x] Estimativa automática de custo (preço do histórico + total estimado no header)

Backlog priorizado e documentação viva em `.agent/` (roadmap, changelog, contexto).

## Convenções de código
- Componentes: PascalCase (ex: `ItemCard.tsx`)
- Hooks: camelCase com prefixo `use` (ex: `useShoppingList.ts`)
- Commits: formato conventional commits (`feat:`, `fix:`, `chore:`)
- Sempre TypeScript — sem `any`

## Contexto do usuário
Luis é PM em Platform Engineering. Prefere:
- Explicações em português
- Quando modificar código, explicar o "por quê" além do "o quê"
- Destacar conceitos do Claude Code ao longo do desenvolvimento
- Respostas concisas, sem enrolação

## GitHub workflow
```
master → branch de feature → PR → merge
```
Sempre criar branch antes de desenvolver uma nova feature.
