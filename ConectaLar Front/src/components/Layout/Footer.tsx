import { Home } from 'lucide-react';

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <a className="brand" href="/">
            <span>
              <Home size={20} />
            </span>
            ConectaLar
          </a>
          <p>Conexões que viram lar.</p>
        </div>
        <div>
          <b>Encontre</b>
          <a href="/alugar">Quero alugar</a>
          <a href="/anunciar">Quero anunciar</a>
        </div>
        <div>
          <b>Contato</b>
          <a href="mailto:ola@conectalar.com.br">ola@conectalar.com.br</a>
          <span>(85) 99999-0000</span>
          <a href="/diretrizes">Diretrizes e regras</a>
          <a href="/privacidade">Política de privacidade</a>
        </div>
      </div>
      <p className="copyright">
        © 2026 ConectaLar. Todos os direitos reservados.
      </p>
    </footer>
  );
}
