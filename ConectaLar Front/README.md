# ConectaLar Front

Frontend React com Vite e TypeScript.

## Organização

- `src/components`: elementos reutilizáveis de interface, como cabeçalho, rodapé e cartão de imóvel.
- `src/components/PropertyCompareDialog.tsx`: comparação acessível de até três imóveis.
- `src/data`: dados mockados, isolados da camada de apresentação.
- `src/types`: contratos TypeScript compartilhados.
- `src/utils`: funções puras de apoio, como formatação de moeda.
- `src/pages`: páginas de busca, detalhes, anúncio, autenticação e gestão.
- `src/experience.css`: estilos da experiência visual atualizada.
- `src/comparison.css`: estilos da comparação e dos modos da listagem.
- `src/config.ts`: opções públicas do ambiente, incluindo a prévia local.
- `src/main.tsx`: composição da aplicação e rotas carregadas sob demanda.

## Executar

```bash
npm install
npm run dev
```

Use `npm run dev` durante o desenvolvimento. O Vite recarrega a página quando os
arquivos mudam. Configure `.env` a partir de `.env.example` antes de iniciar.
Para uma prévia sem acesso ao Supabase, use `VITE_DEMO_MODE=true`.
