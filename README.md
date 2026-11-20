# ClinicFlow

ClinicFlow é um projeto de portfólio para centralizar a operação administrativa de clínicas. A versão atual reúne autenticação, painel de indicadores, cadastros e agenda conectados ao PostgreSQL. A demonstração usa exclusivamente registros fictícios da **Clínica Vida Plena**.

## Fase 3

- **Pacientes** com busca, filtros, paginação, edição, arquivamento reversível e histórico de agendamentos.
- **Profissionais, especialidades e serviços** com cadastro, edição e ativação. Cada profissional tem uma especialidade, duração padrão, agenda individual e faixas semanais de atendimento.
- **Agenda** com visões diária, semanal e mensal, filtros por profissional e especialidade, consulta de horários disponíveis, criação, confirmação, edição, reagendamento, cancelamento e marcação de comparecimento ou falta.
- **Controle de acesso** com cadastros e agenda na administração, pacientes e agenda na recepção e consulta restrita à agenda própria para o profissional.

O horário usa o fuso da clínica. Cada agendamento usa a duração do serviço, exige que ele corresponda à especialidade do profissional e precisa caber na disponibilidade cadastrada. Alterações de disponibilidade preservam as reservas já registradas. Reagendamentos voltam à situação **Agendado**, e comparecimento e falta ficam disponíveis a partir do início previsto. Mudanças de situação e reagendamentos ficam no histórico.

Quem já usa a Fase 2 pode atualizar o banco com `pnpm db:generate` e `pnpm db:migrate`. A migration preserva os registros existentes. Em seguida, reinicie a aplicação e use os atalhos de cadastro e agenda no painel.

### API de operações

| Rotas autenticadas                                              | Métodos e uso                                                                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/{pacientes,profissionais,especialidades,servicos}`     | `GET` lista com `q`, `status` e `pagina`. `POST` cria.                                                                                                            |
| `/api/v1/{pacientes,profissionais,especialidades,servicos}/:id` | `GET` lê os detalhes. `PUT` substitui os campos do cadastro. Envie `active: false` para arquivar ou desativar.                                                    |
| `/api/v1/agenda`                                                | `GET` aceita `data`, `visao`, `profissional` e `especialidade`. `POST` cria usando `patientId`, `professionalId`, `serviceId`, `day`, `time` e `requestKey` UUID. |
| `/api/v1/agenda/:id`                                            | `GET` lê detalhes e histórico. `PUT` edita ou reagenda. `PATCH` altera a situação. As escritas em registros existentes exigem a `revision` mais recente.          |
| `/api/v1/agenda/horarios`                                       | `GET` recebe `day`, `professionalId`, `serviceId` e, para edição, `appointmentId`.                                                                                |

O reenvio da mesma chave com os mesmos campos retorna o agendamento original. Conflitos de horários, revisão desatualizada ou reutilização da chave com campos diferentes retornam HTTP `409`. Os testes de operações criam registros fictícios. Use um banco descartável para executá-los.

## Fase 2

- Landing page em português com apresentação, prévia ilustrativa do painel, perguntas frequentes, login e entrada demonstrativa.
- Painel responsivo com navegação por seções, busca, notificações, menu de perfil e logout.
- Agenda do dia, próximos cinco atendimentos, consultas realizadas, cancelamentos e novos pacientes. Os gráficos mostram evolução diária, distribuição por status, especialidades e receita mensal.
- A administração vê a agenda da clínica e os dados financeiros. A recepção vê a agenda e os indicadores administrativos. Cada profissional vê apenas os próprios atendimentos e indicadores de agenda.

O filtro cobre o mês corrente ou os últimos 7, 30 ou 90 dias, incluindo hoje no fuso da clínica. Consultas são agregadas pela data de atendimento, receitas pela data do pagamento e valores pendentes pela data de vencimento. A agenda do dia, os próximos atendimentos e os alertas seguem o horário atual da clínica.

[Captura da landing page](docs/screenshots/landing.webp) · [Captura do painel demonstrativo](docs/screenshots/painel.webp)

<details>
<summary>Imagem da landing</summary>

A [imagem da recepção](public/media/recepcao-clinicflow.webp) foi criada com a ferramenta integrada ImageGen.

> Photorealistic editorial photograph for the ClinicFlow SaaS landing page. Horizontal composition for a landscape crop. A receptionist in navy scrubs and a clinic coordinator in a light blue shirt reviewing a schedule on a desktop monitor in a modern Brazilian clinic reception. Natural interaction, soft window light, pale stone and muted blue details. No legible screen contents, text, logos or watermark.

</details>

## Fase 1

- Login, logout, recuperação de senha por e-mail e área administrativa protegida.
- Três perfis com uma matriz de permissões no servidor. As rotas verificam a conta ativa, a versão da sessão e a organização.
- PostgreSQL com migrations, vínculos restritos à mesma organização e bloqueio de sobreposição de horários por profissional.
- Seed transacional e idempotente com 1 clínica, 1 administrador, 2 recepcionistas, 6 profissionais com conta, 7 especialidades, 12 serviços, 40 pacientes, horários, agendamentos e transações.
- Endpoint REST `GET /api/v1/session` com `200` para uma sessão válida e `401` quando a sessão está ausente ou revogada.

## Executar localmente

Use Node.js 22.18+ ou 24.11+ na respectiva linha, pnpm 11 e Docker Compose. Uma instância PostgreSQL com a extensão `btree_gist` e um servidor SMTP de captura também podem ser usados diretamente.

No PowerShell, copie o arquivo de exemplo e instale as dependências.

```powershell
Copy-Item .env.example .env
pnpm install --frozen-lockfile
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

No `.env`, defina `POSTGRES_PASSWORD` para o banco local e configure `DATABASE_URL` no formato `postgresql://clinicflow:SENHA@127.0.0.1:5432/clinicflow`. Se houver caracteres especiais na senha, codifique-os para uso na URL. Use o valor aleatório gerado para `AUTH_SECRET`. Configure uma senha fictícia própria de 12 a 128 caracteres para `DEMO_PASSWORD` e defina `ALLOW_DEMO_SEED=true` em um banco dedicado à demonstração. Execute os comandos abaixo.

```powershell
docker compose up -d --wait
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abra a [página inicial do ClinicFlow](http://localhost:3000). Em um ambiente dedicado à demonstração, configure `DEMO_ACCESS_ENABLED=true` e use **Experimentar demonstração** para acessar o painel da Clínica Vida Plena. Para testar outros perfis, clique em **Entrar** e use a senha configurada em `DEMO_PASSWORD` com uma das contas abaixo. Executar o seed novamente preserva os registros e as senhas existentes.

| Perfil        | E-mail fictício                                                         |
| ------------- | ----------------------------------------------------------------------- |
| Administrador | `admin@clinicflow.example`                                              |
| Recepção      | `recepcao1@clinicflow.example`, `recepcao2@clinicflow.example`          |
| Profissional  | `profissional1@clinicflow.example` a `profissional6@clinicflow.example` |

A recuperação de senha entrega os links na caixa local do [Mailpit](http://localhost:8025). Use o link em até 30 minutos. Ao concluir a redefinição, as sessões anteriores são revogadas.

## Configuração

| Variável                              | Uso                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `POSTGRES_PASSWORD`                   | Senha do PostgreSQL no Compose                                                 |
| `DATABASE_URL`                        | URL PostgreSQL usada pelo Prisma                                               |
| `AUTH_SECRET`                         | Segredo aleatório usado pelo Auth.js e pelo limitador de tentativas            |
| `AUTH_URL`                            | Origem pública canônica usada na autenticação e nos links de recuperação       |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM` | Servidor SMTP e remetente da recuperação                                       |
| `SMTP_SECURE`, `SMTP_REQUIRE_TLS`     | TLS implícito e exigência de STARTTLS para conexões SMTP                       |
| `SMTP_USER`, `SMTP_PASSWORD`          | Credenciais opcionais do SMTP                                                  |
| `ALLOW_DEMO_SEED`, `DEMO_PASSWORD`    | Habilitação e senha inicial para o seed fictício                               |
| `DEMO_ACCESS_ENABLED`                 | Entrada direta na conta demonstrativa de administração. O padrão é desativado. |

## Arquitetura

- `src/app` contém páginas do App Router, Server Actions dos formulários e Route Handlers.
- `src/auth.ts` configura o Auth.js v5 beta com Credentials e JWT para integrar a autenticação às Server Actions do App Router. A versão da sessão e o estado da conta são conferidos no banco.
- `src/server/auth` concentra autorização, validação Zod, scrypt com salt individual, limitação de tentativas compartilhada pelo PostgreSQL e recuperação com token de uso único armazenado como hash.
- `src/server/db.ts` conecta o Prisma ao PostgreSQL. Os vínculos de negócio usam chaves estrangeiras compostas com `organizationId`. Operações futuras devem usar o identificador da organização retornado pela autorização no servidor.
- `src/server/dashboard` calcula os intervalos e agrega os dados do painel no PostgreSQL com escopo por organização e, para profissionais, por vínculo ativo.
- `prisma/` reúne schema, migration inicial, restrições SQL e fixtures da demonstração. A organização possui usuários, pacientes, profissionais, especialidades, serviços, disponibilidade, agendamentos, histórico de status, categorias, transações, logs de auditoria e tokens de recuperação.
- `src/components` contém componentes React com Tailwind CSS e Lucide, além da configuração para ampliar o conjunto de componentes com shadcn/ui.

O cliente Prisma abre sessões PostgreSQL em UTC. Os horários de consulta são armazenados como instantes e exibidos no fuso da clínica. A disponibilidade usa o horário local e os valores financeiros são persistidos em centavos. Migrações novas devem usar `pnpm db:migrate:dev`; para aplicar migrations existentes, use `pnpm db:migrate`.

## Verificações

```powershell
pnpm db:generate
pnpm db:validate
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Com um **banco descartável** migrado e com seed, habilite os testes de integridade. Eles escrevem no banco e verificam isolamento, conflitos e limite de tentativas.

```powershell
$env:RUN_DB_TESTS = "true"
pnpm test
```

Com a aplicação em execução em outro terminal e o Mailpit local, instale o Chromium do Playwright e execute os fluxos de autenticação e navegação. A variável `E2E_MAILPIT_URL` habilita a verificação da entrega de e-mail e da redefinição. Defina `DEMO_ACCESS_ENABLED=true` também no processo da aplicação para testar a entrada direta na demonstração.

```powershell
pnpm exec playwright install chromium
$env:E2E_MAILPIT_URL = "http://localhost:8025"
pnpm test:e2e
```

`E2E_BASE_URL` ajusta a URL do teste e `E2E_BROWSER=chrome` usa o Chrome já instalado. Alinhe `AUTH_URL` à origem usada nos testes.

## Publicação e próximas fases

Para um deploy de demonstração, configure PostgreSQL com `btree_gist`, HTTPS, um segredo de sessão próprio e SMTP de captura em rede privada. Aplique `pnpm db:migrate` antes de iniciar a aplicação e use `pnpm build` e `pnpm start` em um ambiente compatível com Next.js. Restrinja o acesso à caixa de recuperação e mantenha os valores reais de configuração fora do Git.

A Fase 4 inclui finanças, relatórios, configurações e a interface de auditoria. A Fase 5 amplia a cobertura de testes, revisão de segurança e acessibilidade. O ambiente é voltado a dados fictícios, sem prontuários, prescrição ou processamento de pagamentos.
