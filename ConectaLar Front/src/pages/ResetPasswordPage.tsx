import { FormEvent, useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import { useAuth } from '../services/AuthContext';

export function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  if (loading) return <main className="auth-page" />;
  if (!user) return <Navigate to="/login" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password'));
    setSaving(true);
    setMessage('');
    try {
      const result = await resetPassword(password);
      if (result.error) throw result.error;
      setMessage('Senha atualizada. Você já pode continuar usando sua conta.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a senha.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="auth-page reset-page">
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-icon">
            <KeyRound />
          </div>
          <p className="section-tag">RECUPERAÇÃO DE ACESSO</p>
          <h2>Crie uma nova senha.</h2>
          <p className="auth-description">
            Use uma senha forte e que você ainda não tenha usado nesta conta.
          </p>
          <form onSubmit={submit}>
            <label>
              Nova senha
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                placeholder="Mínimo de 12 caracteres"
              />
            </label>
            <button className="auth-submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
          {message && (
            <p className="auth-message">
              <Check size={16} /> {message}
            </p>
          )}
          <p className="auth-switch">
            <Link to="/perfil">Voltar para minha conta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
