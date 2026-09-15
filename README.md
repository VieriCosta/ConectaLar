# ConectaLar

Plataforma de anúncios de aluguel de imóveis. O projeto reúne uma interface React, uma API Express e Supabase para autenticação, banco de dados, políticas de acesso e armazenamento de fotos.

## Funcionalidades

- Busca e filtros de imóveis cadastrados no banco.
- Cadastro de anúncios com fotos, máscara de telefone e validação dos campos.
- Autenticação, perfil e favoritos.
- Painel do anunciante para pausar, excluir e gerenciar anúncios.
- Fluxo de interesse, aprovação de locação, conclusão de contrato e avaliações verificadas.
- Avaliações com nota em estrelas e comentários visíveis na página do imóvel.
- Denúncias de anúncios e área administrativa.

## Estrutura

```text
ConectaLar Front/   # React + Vite + TypeScript
ConectaLar Back/    # Express + Supabase Admin
supabase/migrations # Schema, RLS, storage e dados de demonstração
```

## Requisitos

- Node.js 20 ou superior
- Um projeto no Supabase

## Configuração local

Instale as dependências em cada aplicação:

```bash
cd "ConectaLar Front"
npm install

cd "../ConectaLar Back"
npm install
```

Crie os arquivos locais de ambiente a partir dos exemplos:

```bash
copy "ConectaLar Front\\.env.example" "ConectaLar Front\\.env"
copy "ConectaLar Back\\.env.example" "ConectaLar Back\\.env"
```

Preencha as variáveis conforme os exemplos. A chave `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do backend e nunca deve ser usada no frontend.

No painel do Supabase, execute as migrations de `supabase/migrations` em ordem cronológica. Para o fluxo de contratos e avaliações, execute também `20260919_interest_contract_flow.sql`.

## Executar

Em dois terminais:

```bash
cd "ConectaLar Back"
npm run dev
```

```bash
cd "ConectaLar Front"
npm run dev
```

O frontend abre em `http://localhost:5173` e a API usa a porta configurada no `.env` do backend.

## Verificações

```bash
cd "ConectaLar Front"
npm run build

cd "../ConectaLar Back"
node --check src/server.js
```

## Segurança de credenciais

- Arquivos `.env` são ignorados pelo Git; somente `.env.example` é versionado.
- Não coloque chaves secretas, senhas, tokens ou URLs privadas em migrations, código ou documentação.
- `VITE_*` é público por definição: use apenas a URL do projeto e a chave publicável do Supabase.
- A `SUPABASE_SERVICE_ROLE_KEY` deve existir somente em `ConectaLar Back/.env` e em variáveis secretas da hospedagem.
- Se uma chave secreta for exposta, revogue-a/rotacione-a no Supabase imediatamente.

Para detalhes da configuração do Supabase, consulte [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
