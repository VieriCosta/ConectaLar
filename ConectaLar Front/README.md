# ConectaLar Front

Frontend React com Vite e TypeScript.

## Organização

- `src/components`: elementos reutilizáveis de interface, como cabeçalho, rodapé e cartão de imóvel.
- `src/data`: dados mockados, isolados da camada de apresentação.
- `src/types`: contratos TypeScript compartilhados.
- `src/utils`: funções puras de apoio, como formatação de moeda.
- `src/main.tsx`: composição da aplicação e rotas.

## Executar

```bash
npm install
npm run dev
```

Use `npm run dev` durante o desenvolvimento: ele mantém o Hot Module Replacement
(HMR) ativo. Após mudar arquivos, o navegador deve atualizar automaticamente. Caso
o servidor já estivesse aberto, pare-o com `Ctrl + C` e execute `npm run dev` de novo.
