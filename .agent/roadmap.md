# Roadmap — Lista de Mercado v2

## Em desenvolvimento

(vazio)

## Backlog

### [ALTA] Backend proxy para chaves de API (pré-requisito de loja)
**Dor:** As chamadas a Claude e Whisper usam `EXPO_PUBLIC_ANTHROPIC_KEY` embutida no bundle do app. Qualquer pessoa pode extrair a chave de um APK/IPA publicado e gastar a cota do dono do app. Bloqueia distribuição pública na loja.

**Abordagem sugerida:** função serverless mínima (Cloudflare Workers / Vercel) que recebe a requisição do app, injeta a chave do lado do servidor e repassa para a API. Opcional: rate limiting por dispositivo.

**Esforço:** M (1-2 sessões)
**Dependências:** Nenhuma. Deve ser concluído **antes** do submit às lojas.

### [ALTA] Publicação nas lojas (App Store + Play Store)
**Dor:** App só roda via Expo Go hoje. O objetivo é distribuição fácil para iOS e Android — pode ser pago.

**Checklist de preparação:**
- [x] `bundleIdentifier` iOS e `package` Android configurados no `app.json`
- [x] Strings de permissão iOS (câmera, galeria, microfone) via config plugins
- [ ] Backend proxy de API no ar (item acima — bloqueador)
- [ ] Contas de desenvolvedor (Apple US$ 99/ano, Google US$ 25 única)
- [ ] `eas build --platform all --profile production`
- [ ] `eas submit` configurado em `eas.json` (ascAppId / serviceAccountKeyPath)
- [ ] Screenshots, descrição da loja, política de privacidade (obrigatória — app usa câmera/microfone)

**Esforço:** M (1-2 sessões + tempo de revisão das lojas)
**Dependências:** Backend proxy de API.

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
**Prioridade:** Média — valor real mas esforço alto.
**Dependências:** Introdução de React Navigation como pré-requisito técnico.

### [BAIXA] Evoluções do banco de preços (fora do MVP da estimativa)
Comparação entre supermercados, gráfico de evolução de preço, alerta de preço acima da média, leitura do QR code da NFC-e (em vez de foto), atualização automática dos preços da lista atual ao registrar uma nota.

## Concluído
- [2026-06] **Fase 3 — Estimativa Automática de Custo:** preço estimado do histórico ao adicionar item (texto, foto e áudio), total estimado no header, match fuzzy de nomes ("Banana" ↔ "Banana Prata"), edição manual de preço com indicador de confiança ("baseado em N compras"), total estimado no texto compartilhado
- [2026-06] Configuração iOS para distribuição (bundleIdentifier + permissões de câmera/galeria/microfone em português)
- [2026-05] Fase 2 — Scan de Nota Fiscal + Banco de Preços pessoal (`@historico_precos`)
- [2026-05] Fase 1 — Quantidade e Unidade por item
- [2026-04] Categorização por Setores do Mercado (10 categorias, auto-categorização via Claude, SectionList)
- [2026-04] Compartilhar Lista via WhatsApp / Share Sheet
- [v1.0.0] Lista de compras com adicionar/marcar/deletar
- [v1.0.0] Importação por foto (Claude Vision)
- [v1.0.0] Importação por áudio (Whisper + Claude)
- [v1.0.0] Persistência local (AsyncStorage)
- [v1.0.0] Design Soft & Colorful
