import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <Link className="brand" to="/">
            <span>
              <Home size={20} />
            </span>
            ConectaLar
          </Link>
          <p>Conexões que viram lar.</p>
        </div>
        <div>
          <b>Encontre</b>
          <Link to="/alugar">Quero alugar</Link>
          <Link to="/anunciar">Quero anunciar</Link>
        </div>
        <div>
          <b>Informações</b>
          <Link to="/diretrizes">Diretrizes e regras</Link>
          <Link to="/privacidade">Política de privacidade</Link>
        </div>
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} ConectaLar. Todos os direitos reservados.
      </p>
    </footer>
  );
}
