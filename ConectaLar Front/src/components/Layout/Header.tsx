import { useEffect, useState } from 'react';
import { ChevronDown, Home, Menu, UserRound } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    setIsOpen(false);
    setProfileOpen(false);
  }, [pathname]);
  const firstName = String(
    user?.user_metadata?.full_name ?? user?.email ?? 'Conta',
  ).split(' ')[0];
  const isAdmin = user?.app_metadata?.role === 'admin';
  return (
    <header>
      <Link className="brand" to="/">
        <span>
          <Home size={20} />
        </span>
        ConectaLar
      </Link>
      <button
        className="menu"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
        aria-controls="site-navigation"
      >
        <Menu />
      </button>
      <nav
        id="site-navigation"
        className={isOpen ? 'show' : ''}
        aria-label="Navegação principal"
      >
        <NavLink to="/alugar">Quero alugar</NavLink>
        <NavLink to="/anunciar">Quero anunciar</NavLink>
        <a href="/#como-funciona">Como funciona</a>
        {!loading &&
          (user ? (
            <div className="account-menu">
              <button
                className="account-trigger"
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
              >
                <UserRound size={17} /> {firstName} <ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="account-dropdown">
                  <Link to="/perfil" onClick={() => setProfileOpen(false)}>
                    Meu perfil
                  </Link>
                  <Link
                    to="/meus-anuncios"
                    onClick={() => setProfileOpen(false)}
                  >
                    Meus anúncios
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setProfileOpen(false)}>
                      Dashboard admin
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link className="login" to="/login">
              Entrar
            </Link>
          ))}
      </nav>
    </header>
  );
}
