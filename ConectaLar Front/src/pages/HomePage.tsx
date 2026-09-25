import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Check,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { heroPhoto, propertyPhotos } from '../data/properties';
import { getFavoriteIds, toggleFavorite } from '../services/favorites';
import type { Property } from '../types/property';
import { formatCurrency } from '../utils/formatters';

const featuredTypes = ['Todos', 'Apartamento', 'Casa', 'Studio'] as const;

function SearchBox({ properties }: { properties: Property[] }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const locations = useMemo(
    () =>
      [
        ...new Set(
          properties.flatMap((property) => [
            property.neighborhood,
            property.city,
          ]),
        ),
      ].sort(),
    [properties],
  );

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (type) params.set('type', type);
    if (bedrooms) params.set('beds', bedrooms);
    navigate(`/alugar${params.size ? `?${params}` : ''}`);
  }

  return (
    <form className="searchbox" role="search" onSubmit={search}>
      <div className="search-location">
        <MapPin size={20} aria-hidden="true" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Cidade, bairro ou endereço"
          aria-label="Onde você quer morar?"
          list="home-location-suggestions"
        />
        <datalist id="home-location-suggestions">
          {locations.map((location) => (
            <option value={location} key={location} />
          ))}
        </datalist>
      </div>
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        aria-label="Tipo de imóvel"
      >
        <option value="">Tipo de imóvel</option>
        <option>Apartamento</option>
        <option>Casa</option>
        <option>Studio</option>
        <option>Loft</option>
      </select>
      <select
        value={bedrooms}
        onChange={(event) => setBedrooms(event.target.value)}
        aria-label="Quartos"
      >
        <option value="">Quartos</option>
        <option value="1">1+ quarto</option>
        <option value="2">2+ quartos</option>
        <option value="3">3+ quartos</option>
      </select>
      <button type="submit">
        <Search size={19} /> Buscar imóveis
      </button>
    </form>
  );
}

export function HomePage({
  properties,
  propertiesError,
}: {
  properties: Property[];
  propertiesError: boolean;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [selectedType, setSelectedType] =
    useState<(typeof featuredTypes)[number]>('Todos');
  const neighborhoods = useMemo(
    () =>
      [...new Set(properties.map((property) => property.neighborhood))].slice(
        0,
        3,
      ),
    [properties],
  );
  const cityCount = useMemo(
    () => new Set(properties.map((property) => property.city)).size,
    [properties],
  );
  const startingPrice = properties.length
    ? Math.min(...properties.map((property) => property.price))
    : null;

  useEffect(() => {
    getFavoriteIds()
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, []);

  const featured = useMemo(
    () =>
      properties
        .filter(
          (property) =>
            selectedType === 'Todos' || property.type === selectedType,
        )
        .slice(0, 3),
    [properties, selectedType],
  );

  async function handleFavorite(propertyId: string) {
    const isFavorite = favorites.includes(propertyId);
    setFavoriteMessage('');
    try {
      await toggleFavorite(propertyId, isFavorite);
      setFavorites((items) =>
        isFavorite
          ? items.filter((id) => id !== propertyId)
          : [...items, propertyId],
      );
    } catch {
      setFavoriteMessage(
        'Não foi possível salvar o favorito. Tente novamente.',
      );
    }
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} /> SUA PRÓXIMA HISTÓRIA COMEÇA AQUI
          </span>
          <h1>
            Um novo lar.
            <br />
            <em>Um novo jeito</em>
            <br />
            de viver.
          </h1>
          <p>
            Descubra espaços que combinam com você. Encontre, compare e escolha
            seu próximo endereço com mais clareza.
          </p>
          <div className="hero-actions">
            <Link className="hero-primary" to="/alugar">
              Explorar imóveis <ArrowUpRight size={19} />
            </Link>
            <Link className="hero-secondary" to="/anunciar">
              Tenho um imóvel <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={17} /> Anúncios analisados
            </span>
            <span>
              <Heart size={17} /> Favoritos salvos
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={heroPhoto}
            alt="Ambiente acolhedor de uma casa contemporânea"
          />
          <div className="hero-image-label">
            <span className="hero-image-dot" />
            <span>
              Seu próximo capítulo
              <br />
              <strong>pode começar aqui</strong>
            </span>
            <ArrowUpRight size={20} />
          </div>
          <div className="hero-orbit" aria-hidden="true">
            ✳
          </div>
        </div>
        <div className="hero-search">
          <div className="hero-search-heading">
            <span>Encontre o seu lugar</span>
            <span>
              <SlidersHorizontal size={16} /> Busca personalizada
            </span>
          </div>
          <SearchBox properties={properties} />
          {neighborhoods.length > 0 && (
            <div className="quick-search">
              <span>Explore:</span>
              {neighborhoods.map((name) => (
                <Link key={name} to={`/alugar?q=${encodeURIComponent(name)}`}>
                  {name} <ArrowUpRight size={13} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {properties.length > 0 && (
        <section
          className="discovery-metrics wrap"
          aria-label="Panorama dos imóveis disponíveis"
        >
          <div className="metrics-label">
            <Activity size={17} /> PANORAMA DA BUSCA{' '}
            <span className="metrics-pulse" />
          </div>
          <div className="metric">
            <strong>{String(properties.length).padStart(2, '0')}</strong>
            <span>imóveis para explorar</span>
          </div>
          <div className="metric">
            <strong>{String(cityCount).padStart(2, '0')}</strong>
            <span>cidades disponíveis</span>
          </div>
          <div className="metric">
            <strong>{formatCurrency(startingPrice!)}</strong>
            <span>aluguel a partir de</span>
          </div>
          <Link to="/alugar" aria-label="Explorar imóveis disponíveis">
            <ArrowUpRight size={20} />
          </Link>
        </section>
      )}

      <section id="como-funciona" className="steps wrap">
        <div className="section-head">
          <div>
            <p className="section-tag">A JORNADA É SIMPLES</p>
            <h2>Encontre seu lugar, no seu ritmo.</h2>
          </div>
          <p className="section-intro">
            Da primeira busca ao próximo passo, tudo em um só lugar.
          </p>
        </div>
        <div className="three">
          <div>
            <b>
              01 <Search size={23} />
            </b>
            <h3>Explore</h3>
            <p>
              Filtre por localização, espaço e detalhes que fazem diferença para
              você.
            </p>
          </div>
          <div>
            <b>
              02 <Heart size={23} />
            </b>
            <h3>Compare</h3>
            <p>Salve seus favoritos e conheça cada imóvel antes de decidir.</p>
          </div>
          <div>
            <b>
              03 <Check size={23} />
            </b>
            <h3>Conecte-se</h3>
            <p>
              Envie seu interesse e converse com o anunciante pelo próprio site.
            </p>
          </div>
        </div>
      </section>

      <section className="featured wrap">
        <div className="section-head">
          <div>
            <p className="section-tag">ESCOLHAS PARA EXPLORAR</p>
            <h2>Descubra novos endereços.</h2>
          </div>
          <Link to="/alugar">
            Ver todos os imóveis <ArrowUpRight size={18} />
          </Link>
        </div>
        <div
          className="featured-tabs"
          role="group"
          aria-label="Filtrar imóveis em destaque"
        >
          {featuredTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={selectedType === type ? 'active' : ''}
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {featured.length ? (
          <div className="grid">
            {featured.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={favorites.includes(property.id)}
                onFavorite={() => void handleFavorite(property.id)}
              />
            ))}
          </div>
        ) : (
          <div className="featured-empty">
            <p>
              {propertiesError
                ? 'Não foi possível carregar os imóveis. Verifique a conexão com a API.'
                : 'Ainda não há imóveis nesta categoria.'}
            </p>
            <Link to="/alugar">
              Explorar todos <ArrowRight size={17} />
            </Link>
          </div>
        )}
        {favoriteMessage && (
          <p className="rental-message" role="status">
            {favoriteMessage}
          </p>
        )}
      </section>

      <section className="owners">
        <div className="wrap owner-grid">
          <div>
            <p className="section-tag">PARA QUEM ANUNCIA</p>
            <h2>
              Seu imóvel tem uma história. Vamos encontrar quem faça parte dela.
            </h2>
            <p>
              Apresente cada detalhe, receba interessados e acompanhe seu
              anúncio em um espaço feito para você.
            </p>
            <Link className="primary-link" to="/anunciar">
              Anunciar meu imóvel <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="owner-art">
            <img
              src={propertyPhotos[1]}
              alt="Interior de imóvel anunciado"
              loading="lazy"
            />
            <div className="owner-note">
              <span>✦</span>
              <strong>
                Mais visibilidade
                <br />
                para o seu imóvel
              </strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
