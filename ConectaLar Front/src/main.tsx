import { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './styles.css';
import './experience.css';
import { Header as ReusableHeader } from './components/Layout/Header';
import { Footer as ReusableFooter } from './components/Layout/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './services/AuthContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import type { Property } from './types/property';
import { HomePage } from './pages/HomePage';
import { initialProperties } from './data/properties';
import { demoMode } from './config';

const RentPage = lazy(() =>
  import('./pages/RentPage').then(({ RentPage }) => ({ default: RentPage })),
);
const DetailPage = lazy(() =>
  import('./pages/DetailPage').then(({ DetailPage }) => ({
    default: DetailPage,
  })),
);
const AdvertisePage = lazy(() =>
  import('./pages/AdvertisePage').then(({ AdvertisePage }) => ({
    default: AdvertisePage,
  })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then(({ ResetPasswordPage }) => ({
    default: ResetPasswordPage,
  })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(({ ProfilePage }) => ({
    default: ProfilePage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then(({ AdminDashboardPage }) => ({
    default: AdminDashboardPage,
  })),
);
const MyListingsPage = lazy(() =>
  import('./pages/MyListingsPage').then(({ MyListingsPage }) => ({
    default: MyListingsPage,
  })),
);
const GuidelinesPage = lazy(() =>
  import('./pages/GuidelinesPage').then(({ GuidelinesPage }) => ({
    default: GuidelinesPage,
  })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then(({ PrivacyPage }) => ({
    default: PrivacyPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then(({ NotFoundPage }) => ({
    default: NotFoundPage,
  })),
);

function AppContent() {
  const [properties, setProperties] = useState<Property[]>(
    demoMode ? initialProperties : [],
  );
  const [loadingProperties, setLoadingProperties] = useState(!demoMode);
  const [propertiesError, setPropertiesError] = useState(false);
  useEffect(() => {
    if (demoMode) return;
    fetch('/api/properties')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { properties?: Property[] }) => {
        setProperties(data.properties ?? []);
      })
      .catch(() => {
        setProperties([]);
        setPropertiesError(true);
      })
      .finally(() => setLoadingProperties(false));
  }, []);
  const { pathname } = useLocation();
  const isAuthenticationPage =
    pathname === '/login' || pathname === '/redefinir-senha';

  return (
    <>
      <ScrollToTop />
      {demoMode && (
        <div className="demo-notice">
          Prévia de demonstração · imóveis e informações ilustrativos
        </div>
      )}
      {!isAuthenticationPage && <ReusableHeader />}
      <main id="main-content">
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              Carregando página...
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  properties={properties}
                  propertiesError={propertiesError}
                />
              }
            />
            <Route
              path="/alugar"
              element={
                <RentPage
                  properties={properties}
                  propertiesError={propertiesError}
                />
              }
            />
            <Route
              path="/imovel/:id"
              element={
                <DetailPage
                  properties={properties}
                  loadingProperties={loadingProperties}
                />
              }
            />
            <Route path="/anunciar" element={<AdvertisePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/meus-anuncios" element={<MyListingsPage />} />
            <Route path="/diretrizes" element={<GuidelinesPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthenticationPage && <ReusableFooter />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
