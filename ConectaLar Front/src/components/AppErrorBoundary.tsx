import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    this.setState({ message: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error wrap">
          <AlertTriangle />
          <p className="section-tag">PÁGINA INDISPONÍVEL</p>
          <h1>Não foi possível carregar esta página.</h1>
          <p>
            Tente voltar ao início. Se o problema continuar, atualize a página.
          </p>
          {import.meta.env.DEV && this.state.message && (
            <code className="app-error-detail">{this.state.message}</code>
          )}
          <Link
            className="primary-link"
            to="/"
            onClick={() => this.setState({ hasError: false })}
          >
            Voltar ao início
          </Link>
        </main>
      );
    }
    return this.props.children;
  }
}
