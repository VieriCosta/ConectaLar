import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  Check,
  Home,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestPasswordReset, signIn, signUp } from '../services/auth';

type AuthMode = 'login' | 'register' | 'recover';

const copyByMode = {
  login: {
    title: 'Que bom ter você de volta.',
    text: 'Entre para continuar sua jornada no ConectaLar.',
  },
  register: {
    title: 'Seu próximo lar começa aqui.',
    text: 'Crie sua conta gratuita em poucos instantes.',
  },
  recover: {
    title: 'Vamos recuperar seu acesso.',
    text: 'Enviaremos um link seguro para seu e-mail.',
  },
};

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const copy = copyByMode[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email'));
    try {
      if (mode === 'login') {
        const result = await signIn(email, String(data.get('password')));
        if (result.error) throw result.error;
        const destination =
          result.data.user?.app_metadata?.role === 'admin'
            ? '/perfil'
            : result.data.user?.user_metadata?.role === 'owner'
              ? '/anunciar'
              : '/alugar';
        setMessage('Login realizado. Redirecionando...');
        window.setTimeout(() => window.location.assign(destination), 500);
        return;
      }
      if (mode === 'register') {
        const result = await signUp(
          email,
          String(data.get('password')),
          String(data.get('fullName')),
          String(data.get('role')) as 'renter' | 'owner',
        );
        if (result.error) throw result.error;
      }
      if (mode === 'recover') {
        const result = await requestPasswordReset(email);
        if (result.error) throw result.error;
      }
      setMessage(
        mode === 'recover'
          ? 'Instruções enviadas para seu e-mail.'
          : mode === 'register'
            ? 'Conta criada. Confirme seu e-mail para entrar.'
            : 'Login realizado com sucesso.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a solicitação.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Link className="brand brand-light" to="/">
          <span>
            <Home size={20} />
          </span>
          ConectaLar
        </Link>
        <div className="auth-showcase-content">
          <p className="auth-kicker">
            <ShieldCheck size={16} /> CONFIANÇA EM CADA ETAPA
          </p>
          <h1>Onde boas conexões encontram um lar.</h1>
          <p>
            Uma experiência simples, segura e humana para alugar ou anunciar seu
            imóvel.
          </p>
          <ul>
            <li>
              <Check /> Converse diretamente com anunciantes
            </li>
            <li>
              <Check /> Encontre imóveis no seu ritmo
            </li>
            <li>
              <Check /> Seus dados sempre protegidos
            </li>
          </ul>
        </div>
        <div className="auth-quote">
          “Encontrar meu apartamento foi leve do começo ao fim.”
          <span>Mariana, Fortaleza</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <Link className="auth-mobile-brand brand" to="/">
            <span>
              <Home size={20} />
            </span>
            ConectaLar
          </Link>
          <div className="auth-icon">
            {mode === 'recover' ? <KeyRound /> : <LockKeyhole />}
          </div>
          <p className="section-tag">ACESSO SEGURO</p>
          <h2>{copy.title}</h2>
          <p className="auth-description">{copy.text}</p>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label>
                  Nome completo
                  <input
                    name="fullName"
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="Como podemos chamar você?"
                  />
                </label>
                <label>
                  Como você vai usar o ConectaLar?
                  <select name="role">
                    <option value="renter">Quero alugar um imóvel</option>
                    <option value="owner">Quero anunciar um imóvel</option>
                  </select>
                </label>
              </>
            )}
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </label>
            {mode !== 'recover' && (
              <label>
                Senha
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={72}
                  placeholder="Mínimo de 12 caracteres"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                />
              </label>
            )}
            {mode === 'login' && (
              <button
                className="auth-link"
                type="button"
                onClick={() => setMode('recover')}
              >
                Esqueci minha senha
              </button>
            )}
            <button className="auth-submit" disabled={loading}>
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                  ? 'Entrar na minha conta'
                  : mode === 'register'
                    ? 'Criar minha conta'
                    : 'Enviar link de recuperação'}{' '}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          {message && <p className="auth-message">{message}</p>}
          <p className="auth-switch">
            {mode === 'login' ? (
              <>
                Ainda não tem conta?{' '}
                <button type="button" onClick={() => setMode('register')}>
                  Criar cadastro
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('login')}>
                Voltar para entrar
              </button>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
