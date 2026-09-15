import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { updateProfile } from '../services/auth';

export function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.app_metadata?.role === 'admin';

  useEffect(() => {
    setName(String(user?.user_metadata?.full_name ?? ''));
  }, [user]);

  if (loading)
    return <main className="profile-page wrap">Carregando perfil...</main>;
  if (!user) return <Navigate to="/login" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const result = await updateProfile(name, newPassword);
      if (result.error) throw result.error;
      setNewPassword('');
      setMessage('Dados atualizados com sucesso.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o perfil.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-page wrap">
      <p className="section-tag">MINHA CONTA</p>
      <div className="profile-heading">
        <div>
          <h1>Olá, {name || 'usuário'}.</h1>
          <p>Gerencie as informações de acesso da sua conta.</p>
        </div>
        {isAdmin && (
          <span className="admin-badge">
            <ShieldCheck size={16} /> Administrador
          </span>
        )}
      </div>
      <form className="profile-card" onSubmit={submit}>
        <div className="profile-section-title">
          <UserRound />
          <div>
            <h2>Dados pessoais</h2>
            <p>
              Seu e-mail é o identificador da conta e não pode ser alterado.
            </p>
          </div>
        </div>
        <label>
          Nome completo
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={3}
            maxLength={120}
          />
        </label>
        <label>
          E-mail
          <input
            value={user.email ?? ''}
            disabled
            aria-describedby="email-help"
          />
          <small id="email-help">O e-mail não pode ser alterado.</small>
        </label>
        <div className="profile-section-title password-title">
          <KeyRound />
          <div>
            <h2>Alterar senha</h2>
            <p>Deixe este campo vazio para manter sua senha atual.</p>
          </div>
        </div>
        <label>
          Nova senha
          <input
            name="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Mínimo de 12 caracteres"
          />
        </label>
        <div className="profile-actions">
          <button className="primary-link" disabled={saving}>
            <Save size={17} /> {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            className="sign-out"
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            <LogOut size={17} /> Sair da conta
          </button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </main>
  );
}
