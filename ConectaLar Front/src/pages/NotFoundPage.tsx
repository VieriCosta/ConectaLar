import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="wrap empty not-found">
      <Home />
      <p className="section-tag">ERRO 404</p>
      <h1>Esta porta não existe.</h1>
      <p>O endereço pode ter mudado. Vamos levar você de volta para casa.</p>
      <Link className="primary-link" to="/">
        Ir para o início
      </Link>
    </section>
  );
}
