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

## Funcionalidades atuais (v1.0.0)
1. **Lista de compras** — adicionar item por texto, marcar como comprado (toggle), deletar
2. **Importação por foto** — câmera ou galeria → Claude Vision → extrai itens → modal de revisão
3. **Importação por áudio** — grava até 2min → Whisper transcreve → Claude extrai itens → modal de revisão
4. **Persistência local** — itens salvos no dispositivo via AsyncStorage
5. **Design Soft & Colorful** — gradiente teal no header, cards arredondados, empty state ilustrativo

## Estrutura de arquivos
```
App.tsx                          # Componente raiz (toda a UI e estado)
index.ts                         # Entry point Expo
constants/types.ts               # Tipo Item { id, name, bought }
hooks/usePhotoScanner.ts         # Hook: foto → Claude Vision → string[]
hooks/useAudioScanner.ts         # Hook: áudio → Whisper → Claude → string[]
components/PhotoReviewModal.tsx  # Modal de revisão com checkboxes
app.json                         # Config Expo (com.laugustodiniz.listademercadoapp)
eas.json                         # Config EAS Build (dev, preview, production)
.env                             # Chaves de API (não commitado)
```

## Modelo de dados
```typescript
type Item = {
  id: string;      // Date.now().toString()
  name: string;    // Nome do item
  bought: boolean; // Se já foi comprado
}
```

## Convenções de código
- Componentes: PascalCase (`PhotoReviewModal.tsx`)
- Hooks: camelCase com prefixo `use` (`usePhotoScanner.ts`)
- Commits: conventional commits (`feat:`, `fix:`, `chore:`)
- TypeScript estrito — sem `any`

## Público-alvo
Pessoas que fazem compras de mercado e querem uma forma rápida de criar listas — incluindo mandar foto de uma lista escrita à mão ou ditar os itens.
