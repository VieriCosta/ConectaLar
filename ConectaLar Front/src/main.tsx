import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Menu,
  Search,
  SlidersHorizontal,
  Sparkles,
  Car,
  Star,
  X,
} from 'lucide-react';
import './styles.css';
import { Header as ReusableHeader } from './components/Layout/Header';
import { Footer as ReusableFooter } from './components/Layout/Footer';
import { PropertyCard as ReusablePropertyCard } from './components/PropertyCard';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './services/AuthContext';
import { useAuth } from './services/AuthContext';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { getFavoriteIds, toggleFavorite } from './services/favorites';
import { supabase } from './services/supabase';
import { getPropertyReviews, type PropertyReview } from './services/reviews';

import type { Property } from './types/property';
import { propertyPhotos as photos } from './data/properties';

const money = (n: number) =>
  n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const limitInteger = (value: string, maximum: number) => {
  const digits = onlyDigits(value);
  return digits && Number(digits) > maximum ? String(maximum) : digits;
};

const formatCurrencyInput = (value: string) => {
  const cents = onlyDigits(value);
  if (!cents) return '';
  return (Number(cents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

function Card({
  p,
  favorite,
  onFavorite,
}: {
  p: Property;
  favorite?: boolean;
  onFavorite?: () => void;
}) {
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  useEffect(() => {
    getPropertyReviews(p.id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [p.id]);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    : null;
  return (
    <article className="card">
      <div className="photo">
        <img src={p.images[0]} alt={p.title} />
        <button
          className={favorite ? 'fav on' : 'fav'}
          onClick={onFavorite}
          aria-label="Favoritar"
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-body">
        <p className="price">
          {money(p.price)} <small>/mês</small>
        </p>
        <h3>{p.title}</h3>
        <p className="location">
          <MapPin size={15} />
          {p.neighborhood}, {p.city}
        </p>
        <div className="facts">
          <span>
            <BedDouble /> {p.bedrooms}
          </span>
          <span>
            <Bath /> {p.bathrooms}
          </span>
          <span>
            <Car /> {p.parkingSpaces}
          </span>
          <span>{p.area} m²</span>
        </div>
        <p className="card-rating" aria-label="Avaliação do imóvel">
          <Star size={15} fill={average ? 'currentColor' : 'none'} />
          <strong>
            {average ? average.toFixed(1).replace('.', ',') : 'Sem avaliações'}
          </strong>
          {reviews.length > 0 && <span>({reviews.length})</span>}
        </p>
        <Link to={'/imovel/' + p.id} className="text-link">
          Ver detalhes <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}
function SearchBox({ compact = false }: { compact?: boolean }) {
  const nav = useNavigate();
  const [term, setTerm] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  return (
    <form
      className={'searchbox ' + (compact ? 'compact' : '')}
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (term) params.set('q', term);
        if (propertyType) params.set('type', propertyType);
        if (bedrooms) params.set('beds', bedrooms);
        nav('/alugar?' + params.toString());
      }}
    >
      <div className="search-location">
        <span className="search-icon">
          <MapPin size={20} />
        </span>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Cidade, bairro ou endereço"
          aria-label="Buscar localização"
        />
      </div>
      {!compact && (
        <>
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            aria-label="Tipo de imóvel"
          >
            <option value="">Tipo de imóvel</option>
            <option>Apartamento</option>
            <option>Casa</option>
            <option>Studio</option>
          </select>
          <select
            value={bedrooms}
            onChange={(event) => setBedrooms(event.target.value)}
            aria-label="Quantidade de quartos"
          >
            <option value="">Quartos</option>
            <option value="1">1+ quarto</option>
            <option value="2">2+ quartos</option>
            <option value="3">3+ quartos</option>
          </select>
        </>
      )}
      <button aria-label="Buscar imóveis">
        <Search size={19} /> <span>Buscar</span>
      </button>
    </form>
  );
}
function HomePage({ properties }: { properties: Property[] }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    getFavoriteIds()
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, []);

  const handleFavorite = async (propertyId: string) => {
    const isFavorite = favorites.includes(propertyId);
    await toggleFavorite(propertyId, isFavorite);
    setFavorites((items) =>
      isFavorite
        ? items.filter((id) => id !== propertyId)
        : [...items, propertyId],
    );
  };
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> Seu novo começo mora aqui
          </span>
          <h1>
            Encontre seu próximo lar com <em>leveza.</em>
          </h1>
          <p>
            Conectamos você aos melhores imóveis e a proprietários prontos para
            receber sua próxima história.
          </p>
          <SearchBox />
          <div className="hero-links">
            <Link to="/alugar">
              Quero alugar <ChevronRight />
            </Link>
            <Link to="/anunciar">
              Quero anunciar <ChevronRight />
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src={photos[0]} alt="Casa moderna" />
          <div className="floating">
            <span>
              <MapPin />
            </span>
            <div>
              <strong>Seu lugar favorito</strong>
              <small>começa por aqui</small>
            </div>
          </div>
        </div>
      </section>
      <section id="como-funciona" className="steps wrap">
        <p className="section-tag">SIMPLICIDADE QUE APROXIMA</p>
        <h2>Do jeito que deveria ser: simples.</h2>
        <div className="three">
          <div>
            <b>01</b>
            <h3>Encontre</h3>
            <p>Busque por região, preço e tudo que importa para você.</p>
          </div>
          <div>
            <b>02</b>
            <h3>Conheça</h3>
            <p>Veja detalhes reais e fale diretamente com o anunciante.</p>
          </div>
          <div>
            <b>03</b>
            <h3>Comece</h3>
            <p>Escolha seu novo lar e dê o próximo passo com confiança.</p>
          </div>
        </div>
      </section>
      <section className="featured wrap">
        <div className="section-head">
          <div>
            <p className="section-tag">ESCOLHIDOS PARA VOCÊ</p>
            <h2>Imóveis em destaque</h2>
          </div>
          <Link to="/alugar">
            Ver todos <ChevronRight />
          </Link>
        </div>
        <div className="grid">
          {properties.slice(0, 3).map((p) => (
            <ReusablePropertyCard
              property={p}
              isFavorite={favorites.includes(p.id)}
              onFavorite={() => void handleFavorite(p.id)}
              key={p.id}
            />
          ))}
        </div>
      </section>
      <section className="owners">
        <div className="wrap owner-grid">
          <div>
            <p className="section-tag">PARA QUEM ANUNCIA</p>
            <h2>Seu imóvel merece ser encontrado.</h2>
            <p>
              Publique em poucos minutos, receba contatos de pessoas
              interessadas e acompanhe tudo em um único lugar.
            </p>
            <Link className="primary-link" to="/anunciar">
              Anunciar meu imóvel <ChevronRight />
            </Link>
          </div>
          <div className="benefit-list">
            <p>
              <Check /> Cadastro simples e gratuito
            </p>
            <p>
              <Check /> Mais visibilidade para seu anúncio
            </p>
            <p>
              <Check /> Contatos organizados em um só lugar
            </p>
          </div>
        </div>
      </section>
      <section className="testimonials wrap">
        <p className="section-tag">HISTÓRIAS REAIS</p>
        <h2>Quem encontrou, recomenda.</h2>
        <div className="three">
          <blockquote>
            “A busca foi super intuitiva e encontrei meu apartamento em poucos
            dias.”
            <cite>— Ana, Fortaleza</cite>
          </blockquote>
          <blockquote>
            “Anunciar foi muito mais fácil do que eu imaginava.”
            <cite>— Pedro, Eusébio</cite>
          </blockquote>
          <blockquote>
            “Gostei de poder conversar direto com a proprietária.”
            <cite>— Camila, Caucaia</cite>
          </blockquote>
        </div>
      </section>
    </>
  );
}
function RentalInterestForm() {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage('');
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.get('fullName'),
          email: values.get('email'),
          phone: values.get('phone'),
          propertyType: values.get('propertyType'),
          location: values.get('location'),
          budget: Number(values.get('budget')),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      event.currentTarget.reset();
      setMessage(
        'Interesse enviado! Entraremos em contato quando houver uma opção compatível.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar seu interesse.',
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="rental-interest">
      <div>
        <p className="section-tag">NÃO ENCONTROU O IDEAL?</p>
        <h2>Conte o que você procura.</h2>
        <p>
          Deixe seus dados e avisaremos quando surgir um imóvel com o seu
          perfil.
        </p>
      </div>
      <form onSubmit={submit}>
        <label>
          Nome completo
          <input name="fullName" required minLength={3} maxLength={120} />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          Telefone
          <input
            name="phone"
            type="tel"
            required
            minLength={14}
            maxLength={15}
            placeholder="(85) 99999-9999"
            onChange={(event) => {
              event.currentTarget.value = formatPhone(
                event.currentTarget.value,
              );
            }}
          />
        </label>
        <label>
          Tipo de imóvel
          <select name="propertyType" defaultValue="Apartamento">
            <option>Apartamento</option>
            <option>Casa</option>
            <option>Studio</option>
            <option>Loft</option>
          </select>
        </label>
        <label>
          Região desejada
          <input
            name="location"
            required
            minLength={3}
            maxLength={160}
            placeholder="Ex.: Aldeota, Fortaleza"
          />
        </label>
        <label>
          Orçamento mensal
          <input
            name="budget"
            required
            type="number"
            min="1"
            max="1000000"
            placeholder="Ex.: 2500"
          />
        </label>
        <button disabled={sending}>
          {sending ? 'Enviando...' : 'Quero receber opções'}
        </button>
        {message && <p className="rental-message">{message}</p>}
      </form>
    </section>
  );
}
function RentPage({ properties }: { properties: Property[] }) {
  const [term, setTerm] = useState('');
  const [type, setType] = useState('');
  const [beds, setBeds] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [petsOnly, setPetsOnly] = useState(false);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [sort, setSort] = useState('recent');
  const [fav, setFav] = useState<string[]>([]);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  useEffect(() => {
    getFavoriteIds()
      .then(setFav)
      .catch(() => setFav([]));
  }, []);
  const list = useMemo(
    () =>
      properties
        .filter(
          (p) =>
            `${p.title} ${p.city} ${p.neighborhood} ${p.address}`
              .toLowerCase()
              .includes(term.toLowerCase()) &&
            (!type || p.type === type) &&
            (!beds || p.bedrooms >= Number(beds)) &&
            (!maxPrice || p.price <= Number(maxPrice)) &&
            (!minArea || p.area >= Number(minArea)) &&
            (!petsOnly || p.acceptsPets) &&
            (!furnishedOnly || p.furnished),
        )
        .sort((a, b) =>
          sort === 'low'
            ? a.price - b.price
            : sort === 'high'
              ? b.price - a.price
              : 0,
        ),
    [
      properties,
      term,
      type,
      beds,
      maxPrice,
      minArea,
      petsOnly,
      furnishedOnly,
      sort,
    ],
  );
  return (
    <main className="listing wrap">
      <p className="section-tag">BUSQUE COM CONFIANÇA</p>
      <h1>Encontre o imóvel ideal para você</h1>
      <div className="filterbar">
        <div>
          <Search />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Cidade, bairro ou endereço"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option>Apartamento</option>
          <option>Casa</option>
          <option>Studio</option>
          <option>Loft</option>
        </select>
        <select value={beds} onChange={(e) => setBeds(e.target.value)}>
          <option value="">Quartos</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Qualquer preço</option>
          <option value="1500">Até R$ 1.500</option>
          <option value="2500">Até R$ 2.500</option>
          <option value="4000">Até R$ 4.000</option>
        </select>
        <select value={minArea} onChange={(e) => setMinArea(e.target.value)}>
          <option value="">Qualquer área</option>
          <option value="50">A partir de 50 m²</option>
          <option value="80">A partir de 80 m²</option>
          <option value="120">A partir de 120 m²</option>
        </select>
        <button
          type="button"
          className={petsOnly ? 'filter-toggle is-active' : 'filter-toggle'}
          aria-pressed={petsOnly}
          onClick={() => setPetsOnly((value) => !value)}
        >
          <span>Aceita pets</span>
          <span className="filter-toggle-state">
            {petsOnly ? 'Sim' : 'Não'}
          </span>
        </button>
        <button
          type="button"
          className={
            furnishedOnly ? 'filter-toggle is-active' : 'filter-toggle'
          }
          aria-pressed={furnishedOnly}
          onClick={() => setFurnishedOnly((value) => !value)}
        >
          <span>Mobiliado</span>
          <span className="filter-toggle-state">
            {furnishedOnly ? 'Sim' : 'Não'}
          </span>
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Mais recentes</option>
          <option value="low">Menor preço</option>
          <option value="high">Maior preço</option>
        </select>
      </div>
      <div className="results">
        <p>
          <SlidersHorizontal /> {list.length} imóveis encontrados
        </p>
        <button
          className="clear"
          onClick={() => {
            setTerm('');
            setType('');
            setBeds('');
            setMaxPrice('');
            setMinArea('');
            setPetsOnly(false);
            setFurnishedOnly(false);
          }}
        >
          Limpar filtros
        </button>
      </div>
      {list.length ? (
        <div className="grid">
          {list.map((p) => (
            <Card
              key={p.id}
              p={p}
              favorite={fav.includes(p.id)}
              onFavorite={async () => {
                const wasFavorite = fav.includes(p.id);
                setFavoriteMessage('');
                try {
                  await toggleFavorite(p.id, wasFavorite);
                  setFav((items) =>
                    wasFavorite
                      ? items.filter((id) => id !== p.id)
                      : [...items, p.id],
                  );
                } catch (error) {
                  setFavoriteMessage(
                    error instanceof Error
                      ? error.message
                      : 'Não foi possível salvar o favorito.',
                  );
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Building2 />
          <h2>Nenhum imóvel encontrado</h2>
          <p>Tente ajustar a busca ou remover alguns filtros.</p>
        </div>
      )}
      {favoriteMessage && <p className="rental-message">{favoriteMessage}</p>}
      <RentalInterestForm />
    </main>
  );
}
function ReportProperty({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  if (!user)
    return (
      <Link className="report-link" to="/login">
        Denunciar anúncio
      </Link>
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data } = await supabase.auth.getSession();
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        propertyId,
        reason: form.get('reason'),
        details: form.get('details'),
      }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? 'Denúncia enviada para análise.'
        : (result.error ?? 'Não foi possível enviar a denúncia.'),
    );
    if (response.ok) setOpen(false);
  }
  return (
    <div className="report-box">
      <button
        type="button"
        className="report-link"
        onClick={() => setOpen((value) => !value)}
      >
        Denunciar anúncio
      </button>
      {open && (
        <form onSubmit={submit}>
          <select
            name="reason"
            defaultValue="inaccurate_information"
            aria-label="Motivo da denúncia"
          >
            <option value="inaccurate_information">Informação incorreta</option>
            <option value="fraud">Possível golpe</option>
            <option value="offensive_content">Conteúdo ofensivo</option>
            <option value="other">Outro motivo</option>
          </select>
          <textarea
            name="details"
            required
            minLength={10}
            maxLength={1500}
            placeholder="Descreva o problema"
          />
          <button>Enviar denúncia</button>
        </form>
      )}
      {message && <small>{message}</small>}
    </div>
  );
}
function DetailPage({ properties }: { properties: Property[] }) {
  const { id } = useParams();
  const { user } = useAuth();
  const p = properties.find((x) => x.id === id);
  const [sent, setSent] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [hasConfirmedRental, setHasConfirmedRental] = useState(false);
  const [rentalAgreementId, setRentalAgreementId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  useEffect(() => {
    if (!p) return;
    getPropertyReviews(p.id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [p?.id]);
  useEffect(() => {
    if (!p || !user) {
      setHasConfirmedRental(false);
      setRentalAgreementId(null);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const response = await fetch(`/api/properties/${p.id}/review-eligibility`, {
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      });
      if (!response.ok) return;
      const eligibility = (await response.json()) as { eligible: boolean; rentalAgreementId: string | null };
      setHasConfirmedRental(eligibility.eligible);
      setRentalAgreementId(eligibility.rentalAgreementId);
    }).catch(() => {
      setHasConfirmedRental(false);
      setRentalAgreementId(null);
    });
  }, [p?.id, user]);
  async function submitInterest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setContactMessage('Entre na sua conta para enviar interesse ao anunciante.');
      return;
    }
    setSendingInterest(true);
    setContactMessage('');
    const form = new FormData(event.currentTarget);
    const { data } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ propertyId: p?.id, message: form.get('message') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível enviar seu interesse.');
      setSent(true);
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : 'Não foi possível enviar seu interesse.');
    } finally {
      setSendingInterest(false);
    }
  }
  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rentalAgreementId) return;
    setReviewStatus('Enviando avaliação...');
    const { data } = await supabase.auth.getSession();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/property-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        propertyId: p?.id,
        rentalAgreementId,
        rating: reviewRating,
        comment: form.get('comment'),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setReviewStatus(result.error ?? 'Não foi possível enviar a avaliação.');
      return;
    }
    setReviewMessage('');
    setReviewStatus('Avaliação enviada. Obrigado por compartilhar sua experiência!');
    if (p) getPropertyReviews(p.id).then(setReviews).catch(() => undefined);
  }
  if (!p)
    return (
      <main className="wrap empty">
        <h1>Imóvel não encontrado</h1>
        <Link to="/alugar">Voltar à busca</Link>
      </main>
    );
  return (
    <main className="detail wrap">
      <Link className="back" to="/alugar">
        ← Voltar para imóveis
      </Link>
      <div className="gallery">
        <img src={p.images[0]} alt={p.title} />
        <img src={p.images[1]} alt="Interior do imóvel" />
      </div>
      <div className="detail-grid">
        <article>
          <p className="section-tag">
            {p.type.toUpperCase()} · {p.neighborhood.toUpperCase()}
          </p>
          <h1>{p.title}</h1>
          <p className="location">
            <MapPin size={18} />
            {p.address} — {p.city}
          </p>
          <div className="detail-facts">
            <span>
              <BedDouble /> {p.bedrooms} quartos
            </span>
            <span>
              <Bath /> {p.bathrooms} banheiros
            </span>
            <span>
              <Car /> {p.parkingSpaces} vagas
            </span>
            <span>{p.area} m²</span>
          </div>
          <h2>Sobre este imóvel</h2>
          <p>{p.description}</p>
          <h2>Características</h2>
          <div className="chips">
            <span>
              {p.acceptsPets ? 'Aceita animais' : 'Não aceita animais'}
            </span>
            <span>{p.furnished ? 'Mobiliado' : 'Não mobiliado'}</span>
            <span>Disponível agora</span>
          </div>
          <section className="reviews" aria-labelledby="reviews-title">
            <div className="reviews-heading">
              <div>
                <p className="section-tag">EXPERIÊNCIAS DE QUEM ALUGOU</p>
                <h2 id="reviews-title">Avaliações do imóvel</h2>
              </div>
              <div className="rating-summary" aria-label="Média das avaliações">
                <Star size={20} fill="currentColor" />
                <strong>
                  {reviews.length
                    ? (
                        reviews.reduce(
                          (total, review) => total + review.rating,
                          0,
                        ) / reviews.length
                      )
                        .toFixed(1)
                        .replace('.', ',')
                    : '—'}
                </strong>
                <span>
                  {reviews.length
                    ? `${reviews.length} ${reviews.length === 1 ? 'avaliação' : 'avaliações'}`
                    : 'Sem avaliações'}
                </span>
              </div>
            </div>
            {reviews.length > 0 && (
              <div className="review-list">
                {reviews.map((review) => (
                  <article className="review" key={review.id}>
                    <div>
                      <strong>{review.author}</strong>
                      <span
                        className="review-stars"
                        aria-label={`${review.rating} de 5 estrelas`}
                      >
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            size={15}
                            fill={
                              index < review.rating ? 'currentColor' : 'none'
                            }
                          />
                        ))}
                      </span>
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            )}
            {hasConfirmedRental ? (
              <form className="review-form" onSubmit={submitReview}>
                <h3>Como foi sua experiência?</h3>
                <p>
                  Seu aluguel foi confirmado. Você já pode avaliar o imóvel.
                </p>
                <div className="rating-picker" aria-label="Sua nota">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={rating <= reviewRating ? 'selected' : ''}
                      onClick={() => setReviewRating(rating)}
                      aria-label={`${rating} estrela${rating > 1 ? 's' : ''}`}
                    >
                      <Star size={22} fill={rating <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <textarea
                  name="comment"
                  required
                  minLength={10}
                  maxLength={800}
                  value={reviewMessage}
                  onChange={(event) => setReviewMessage(event.target.value)}
                  placeholder="Conte como foi sua experiência no imóvel."
                />
                <button type="submit">Enviar avaliação</button>
                {reviewStatus && <small className="form-message">{reviewStatus}</small>}
              </form>
            ) : (
              <p className="review-eligibility">
                As avaliações são liberadas somente após a confirmação do
                aluguel entre locatário e anunciante.
              </p>
            )}
          </section>
          <h2>Fale com o anunciante</h2>
          {sent ? (
            <div className="success">
              <Check /> Mensagem enviada! {p.ownerName} receberá seu interesse.
            </div>
          ) : (
            <form id="contact-form" className="contact" onSubmit={submitInterest}>
              <input required placeholder="Seu nome" defaultValue={user?.user_metadata?.full_name ?? ''} />
              <input required type="email" placeholder="Seu e-mail" defaultValue={user?.email ?? ''} />
              <textarea
                name="message"
                required
                minLength={10}
                placeholder="Olá! Tenho interesse neste imóvel."
              />
              <button disabled={sendingInterest}>
                {sendingInterest ? 'Enviando...' : 'Enviar mensagem'}
              </button>
              {contactMessage && <small className="form-message">{contactMessage}</small>}
            </form>
          )}
        </article>
        <aside className="price-box">
          <p>Aluguel mensal</p>
          <strong>{money(p.price)}</strong>
          {p.condominium && <small>Condomínio: {money(p.condominium)}</small>}
          <hr />
          <p>
            Anunciado por <b>{p.ownerName}</b>
          </p>
          <button type="button" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            Tenho interesse
          </button>
          <ReportProperty propertyId={p.id} />
          <a
            target="_blank"
            rel="noreferrer"
            href={
              'https://wa.me/5585999990000?text=Olá, tenho interesse em ' +
              encodeURIComponent(p.title)
            }
          >
            Falar pelo WhatsApp
          </a>
        </aside>
      </div>
    </main>
  );
}
function AdvertisePage({ onAdd }: { onAdd: (p: Property) => void }) {
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setMessage('');
    const title = String(d.get('title') ?? '').trim();
    const address = String(d.get('address') ?? '').trim();
    const city = String(d.get('city') ?? '').trim();
    const neighborhood = String(d.get('neighborhood') ?? '').trim();
    const description = String(d.get('description') ?? '').trim();
    const phone = String(d.get('phone') ?? '');
    const price = Number(onlyDigits(String(d.get('price'))) || 0) / 100;
    const numericFields = [
      ['Quartos', String(d.get('bedrooms') ?? '')],
      ['Banheiros', String(d.get('bathrooms') ?? '')],
      ['Vagas', String(d.get('parking') ?? '')],
    ] as const;
    if (title.length < 10)
      return setMessage('Informe um título com pelo menos 10 caracteres.');
    if (address.length < 4) return setMessage('Informe um endereço válido.');
    if (city.length < 2) return setMessage('Informe uma cidade válida.');
    if (neighborhood.length < 2) return setMessage('Informe um bairro válido.');
    if (!price) return setMessage('Informe o valor mensal do aluguel.');
    const invalidNumeric = numericFields.find(
      ([, rawValue]) => {
        const value = Number(rawValue);
        return !rawValue || !Number.isInteger(value) || value < 0 || value > 30;
      },
    );
    if (invalidNumeric)
      return setMessage(`${invalidNumeric[0]} deve ser um número entre 0 e 30.`);
    if (!Number(d.get('area')) || Number(d.get('area')) <= 0)
      return setMessage('Informe a área do imóvel em m².');
    if (description.length < 20)
      return setMessage('A descrição precisa ter pelo menos 20 caracteres.');
    if (!String(d.get('owner') ?? '').trim())
      return setMessage('Informe o nome do anunciante.');
    if (onlyDigits(phone).length < 10)
      return setMessage('Informe um telefone válido com DDD.');
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    const files = d.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
    if (!userId) return setMessage('Entre na sua conta para publicar um anúncio.');
    if (!files.length) return setMessage('Adicione pelo menos uma foto do imóvel.');
    if (files.length > 6 || files.some((file) => file.size > 5242880)) return setMessage('Envie até 6 fotos, com no máximo 5 MB cada.');
    if (files.some((file) => !['image/jpeg','image/png','image/webp'].includes(file.type))) return setMessage('Envie fotos JPG, PNG ou WEBP.');
    setUploading(true);
    const images: string[] = [];
    for (const file of files) {
      const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type });
      if (error) { setUploading(false); return setMessage('Não foi possível enviar uma das fotos.'); }
      images.push(supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl);
    }
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        title: String(d.get('title')),
        type: String(d.get('type')),
        city: String(d.get('city')),
        neighborhood: String(d.get('neighborhood')),
        address: String(d.get('address')),
        price,
        bedrooms: Number(d.get('bedrooms')),
        bathrooms: Number(d.get('bathrooms')),
        parkingSpaces: Number(d.get('parking')),
        area: Number(d.get('area')),
        description: String(d.get('description')),
        acceptsPets: d.get('pets') === 'on',
        furnished: d.get('furnished') === 'on',
        images,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setUploading(false);
      setMessage(result.error ?? 'Não foi possível publicar o anúncio.');
      return;
    }
    onAdd(result.property as Property);
    setUploading(false);
    setDone(true);
    e.currentTarget.reset();
  };
  if (done)
    return (
      <main className="wrap success-page">
        <Check size={42} />
        <h1>Anúncio criado com sucesso!</h1>
        <p>Seu imóvel foi salvo no banco e já está visível na busca.</p>
        <Link to="/alugar">Ver meus anúncios</Link>
      </main>
    );
  return (
    <main className="advertise">
      <section className="ad-hero">
        <div>
          <p className="section-tag">PARA PROPRIETÁRIOS</p>
          <h1>Anuncie seu imóvel no ConectaLar</h1>
          <p>
            Chegue às pessoas certas, organize seus contatos e mantenha o
            controle do seu anúncio.
          </p>
        </div>
        <div className="ad-benefits">
          <p>
            <Check /> Alcance mais pessoas
          </p>
          <p>
            <Check /> Cadastro rápido e simples
          </p>
          <p>
            <Check /> Gestão em um único lugar
          </p>
        </div>
      </section>
      <section className="form-wrap">
        <h2>Comece seu anúncio</h2>
        <p>
          Preencha os dados principais. Você poderá complementar as informações
          depois.
        </p>
        <form className="ad-form" noValidate onSubmit={submit}>
          <label>
            Título do anúncio
            <input
              name="title"
              required
              minLength={10}
              maxLength={140}
              placeholder="Ex.: Apartamento com varanda no Cocó"
            />
          </label>
          <label>
            Tipo de imóvel
            <select name="type" required>
              <option value="Apartamento">Apartamento</option>
              <option value="Casa">Casa</option>
              <option value="Studio">Studio</option>
            </select>
          </label>
          <label>
            Endereço
            <input name="address" required minLength={4} maxLength={240} />
          </label>
          <label>
            Cidade
            <input name="city" required minLength={2} maxLength={120} />
          </label>
          <label>
            Bairro
            <input name="neighborhood" required minLength={2} maxLength={120} />
          </label>
          <label>
            Valor do aluguel
            <input
              name="price"
              required
              inputMode="numeric"
              placeholder="R$ 0,00"
              onChange={(event) => {
                event.currentTarget.value = formatCurrencyInput(
                  event.currentTarget.value,
                );
              }}
            />
          </label>
          <label>
            Quartos
            <input
              name="bedrooms"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              onChange={(event) => {
                event.currentTarget.value = limitInteger(event.currentTarget.value, 30);
              }}
            />
          </label>
          <label>
            Banheiros
            <input
              name="bathrooms"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              onChange={(event) => {
                event.currentTarget.value = limitInteger(event.currentTarget.value, 30);
              }}
            />
          </label>
          <label>
            Vagas
            <input
              name="parking"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              onChange={(event) => {
                event.currentTarget.value = limitInteger(event.currentTarget.value, 30);
              }}
            />
          </label>
          <label>
            Área em m²
            <input
              name="area"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => {
                event.currentTarget.value = onlyDigits(event.currentTarget.value);
              }}
            />
          </label>
          <label className="wide">
            Descrição
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={5000}
              placeholder="Conte os principais diferenciais do imóvel."
            />
          </label>
          <label className="wide">Fotos do imóvel
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
            <small>Até 6 fotos em JPG, PNG ou WEBP; máximo de 5 MB por foto.</small>
          </label>
          <label>
            Nome do anunciante
            <input name="owner" required />
          </label>
          <label>
            Telefone
            <input
              name="phone"
              required
              type="tel"
              minLength={14}
              maxLength={15}
              inputMode="numeric"
              placeholder="(85) 99999-9999"
              onChange={(event) => {
                event.currentTarget.value = formatPhone(
                  event.currentTarget.value,
                );
              }}
            />
          </label>
          <label className="check">
            <input name="pets" type="checkbox" /> Aceita animais
          </label>
          <label className="check">
            <input name="furnished" type="checkbox" /> Imóvel mobiliado
          </label>
          <button className="wide" disabled={uploading}>
            {uploading ? 'Enviando fotos...' : 'Publicar anúncio'} <ChevronRight />
          </button>
          {message && <p className="rental-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}
function AppContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  useEffect(() => {
    fetch('/api/properties')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { properties?: Property[] }) => {
        if (data.properties?.length) setProperties(data.properties);
      })
      .catch(() => undefined);
  }, []);
  const { pathname } = useLocation();
  const isAuthenticationPage =
    pathname === '/login' || pathname === '/redefinir-senha';

  return (
    <>
      <ScrollToTop />
      {!isAuthenticationPage && <ReusableHeader />}
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage properties={properties} />} />
          <Route
            path="/alugar"
            element={<RentPage properties={properties} />}
          />
          <Route
            path="/imovel/:id"
            element={<DetailPage properties={properties} />}
          />
          <Route
            path="/anunciar"
            element={
              <AdvertisePage onAdd={(p) => setProperties((x) => [p, ...x])} />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/meus-anuncios" element={<MyListingsPage />} />
          <Route path="/diretrizes" element={<GuidelinesPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
