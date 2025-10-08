# Plataforma de Triagem e Análise de Currículos - Singular Serviços

Plataforma inteligente para análise automatizada de currículos usando IA, desenvolvida para otimizar o processo de recrutamento e seleção.

## 🚀 Funcionalidades

### ✅ Implementadas

1. **Gestão de Vagas**
   - Criar, editar e visualizar vagas
   - Definir critérios personalizados de avaliação
   - Atribuir pesos aos critérios (1-5)
   - Status de vagas (ativa/inativa)

2. **Upload de Currículos**
   - Interface drag-and-drop
   - Suporte para PDF e imagens
   - Upload múltiplo com progresso individual
   - Limite de 10MB por arquivo
   - Armazenamento seguro no Supabase Storage

3. **Análise por IA (Groq)**
   - Extração automática de dados do currículo
   - Análise baseada nos critérios da vaga
   - Pontuação individual por critério (0-100)
   - Score geral do candidato
   - Recomendação: contratar/entrevistar/rejeitar
   - Análise em lote de múltiplos currículos

4. **Dashboard de Comparação**
   - Ranking de candidatos por pontuação
   - Tabela comparativa por critérios
   - Estatísticas gerais (média, melhor, pior)
   - Agrupamento por recomendação
   - Filtros e ordenação

5. **Relatórios e Exportação**
   - Exportação em CSV
   - Dados completos de candidatos e análises
   - Relatórios por vaga

6. **Autenticação e Segurança**
   - Login com Supabase Auth
   - Row Level Security (RLS)
   - Middleware de proteção de rotas
   - Políticas de acesso granulares

## 📋 Pré-requisitos

- Node.js 18+
- Conta Vercel (para deploy)
- Integração Supabase configurada
- Integração Groq configurada (para IA)

## 🔧 Configuração

### 1. Executar Scripts SQL

Execute os scripts na ordem:

1. **`scripts/01-create-tables.sql`** - Cria todas as tabelas do banco
2. **`scripts/02-add-rls-policies.sql`** - Adiciona políticas de segurança RLS
3. **`scripts/03-sync-auth-users.sql`** - Sincroniza usuários do Supabase Auth com tabela customizada

**Como executar:**
- Na sidebar do v0, vá em "Scripts"
- Clique em cada arquivo e selecione "Run"

### 2. Configurar Storage no Supabase

O script SQL já cria o bucket automaticamente, mas você pode verificar:

1. Acesse o painel do Supabase
2. Vá em **Storage**
3. Verifique se o bucket `resumes` existe e está público

### 3. Variáveis de Ambiente

As seguintes variáveis já estão configuradas automaticamente:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq (IA)
GROQ_API_KEY=

# Vercel Blob (opcional, se usar Blob ao invés de Supabase Storage)
BLOB_READ_WRITE_TOKEN=
\`\`\`

## 🎯 Como Usar

### 1. Criar uma Vaga

1. Acesse **Dashboard** → **Vagas** → **Nova Vaga**
2. Preencha:
   - Título da vaga
   - Descrição detalhada
   - Requisitos
3. Adicione critérios de avaliação:
   - Nome do critério (ex: "Experiência em React")
   - Tipo: técnico, comportamental, educacional, experiência
   - Peso (1-5): importância do critério
   - Descrição detalhada
4. Clique em **Criar Vaga**

### 2. Fazer Upload de Currículos

1. Acesse **Dashboard** → **Upload**
2. Selecione a vaga
3. Arraste arquivos ou clique para selecionar
4. Formatos aceitos: PDF, JPG, PNG
5. Clique em **Enviar**

### 3. Analisar Currículos

**Análise Individual:**
1. Acesse **Dashboard** → **Currículos**
2. Clique em **Analisar** no currículo desejado
3. Aguarde a IA processar (30-60 segundos)

**Análise em Lote:**
1. Acesse a página da vaga
2. Clique em **Analisar Todos Pendentes**
3. Aguarde o processamento de todos os currículos

### 4. Comparar Candidatos

1. Acesse a página da vaga
2. Clique em **Comparar Candidatos**
3. Visualize:
   - Ranking por pontuação
   - Tabela comparativa por critérios
   - Estatísticas gerais
   - Agrupamento por recomendação

### 5. Exportar Relatórios

1. Na página de comparação
2. Clique em **Exportar CSV**
3. O arquivo será baixado com todos os dados

## 🏗️ Arquitetura

### Estrutura de Pastas

\`\`\`
app/
├── api/
│   ├── analyze-resume/     # Análise individual
│   ├── batch-analyze/      # Análise em lote
│   └── export-csv/         # Exportação de dados
├── dashboard/
│   ├── jobs/               # Gestão de vagas
│   ├── resumes/            # Listagem de currículos
│   ├── candidates/         # Listagem de candidatos
│   └── upload/             # Upload de arquivos
├── login/                  # Autenticação
└── page.tsx                # Página inicial (redirect)

components/
├── ui/                     # Componentes shadcn/ui
├── app-sidebar.tsx         # Navegação lateral
├── job-form.tsx            # Formulário de vagas
├── resume-uploader.tsx     # Upload de currículos
├── analyze-resume-button.tsx
└── export-buttons.tsx

lib/
└── supabase/
    ├── client.ts           # Cliente browser
    └── server.ts           # Cliente server

scripts/
├── 01-create-tables.sql    # Schema do banco
├── 02-add-rls-policies.sql # Políticas RLS
└── 03-sync-auth-users.sql  # Sincroniza usuários do Supabase Auth com tabela customizada
\`\`\`

### Banco de Dados

**Tabelas:**
- `users` - Usuários do sistema
- `jobs` - Vagas cadastradas
- `job_criteria` - Critérios de avaliação
- `resumes` - Currículos enviados
- `candidates` - Dados extraídos dos currículos
- `analyses` - Análises e pontuações
- `activity_logs` - Logs de atividade

### Fluxo de Análise

1. **Upload** → Arquivo salvo no Supabase Storage
2. **Extração** → IA extrai dados estruturados (nome, email, experiência, etc.)
3. **Análise** → IA avalia candidato contra critérios da vaga
4. **Pontuação** → Score geral + scores individuais por critério
5. **Recomendação** → Contratar / Entrevistar / Rejeitar

## 🤖 Modelos de IA

A plataforma usa **Groq** com o modelo `llama-3.3-70b-versatile`:

- **Extração de Dados**: Converte PDF/imagem em dados estruturados
- **Análise de Candidatos**: Avalia fit com a vaga
- **Pontuação**: Gera scores objetivos (0-100)
- **Recomendações**: Sugere próximos passos

## 🔒 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- **Autenticação obrigatória** para todas as rotas
- **Políticas granulares** de acesso aos dados
- **Storage público** apenas para currículos (read-only)
- **Middleware** protege rotas do dashboard

## 📊 Métricas e Estatísticas

O dashboard exibe:
- Total de vagas ativas
- Total de currículos recebidos
- Total de candidatos processados
- Total de análises realizadas
- Vagas recentes com contagem de análises

## 🚀 Deploy

A plataforma está pronta para deploy no Vercel:

1. Clique em **Publish** no v0
2. Conecte seu repositório GitHub
3. As variáveis de ambiente serão configuradas automaticamente
4. O deploy será feito em minutos

## 📝 Próximos Passos

Sugestões de melhorias futuras:

1. **Notificações por Email** - Avisar quando análises forem concluídas
2. **Comentários e Notas** - Permitir anotações manuais nos candidatos
3. **Entrevistas** - Agendar e gerenciar entrevistas
4. **Feedback Loop** - Melhorar IA com feedback dos recrutadores
5. **Relatórios Avançados** - Gráficos e dashboards analíticos
6. **Integração com ATS** - Conectar com sistemas de RH existentes
7. **Busca Semântica** - Buscar candidatos por habilidades
8. **Multiidioma** - Suporte para currículos em outros idiomas

## 🐛 Troubleshooting

### Erro: "Supabase URL not found"
- Verifique se a integração Supabase está conectada na sidebar → Connect

### Erro: "Failed to upload resume"
- Verifique se o bucket `resumes` existe no Supabase Storage
- Execute o script `02-add-rls-policies.sql` para criar o bucket

### Erro: "Failed to analyze resume"
- Verifique se a integração Groq está configurada
- Verifique se há créditos disponíveis na conta Groq

### Erro: "insert or update on table jobs violates foreign key constraint"
- Execute o script `03-sync-auth-users.sql` para sincronizar usuários
- Faça logout e login novamente
- O sistema agora cria automaticamente o registro do usuário ao fazer login

### Análise muito lenta
- O modelo Groq é rápido, mas pode demorar 30-60s por currículo
- Use análise em lote para processar múltiplos currículos
- Considere usar um modelo mais rápido se necessário

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique este README
2. Revise os logs de erro no console
3. Abra um ticket em vercel.com/help

---

**Desenvolvido com v0 by Vercel** 🚀
