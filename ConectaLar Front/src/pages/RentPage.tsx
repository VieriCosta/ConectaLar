import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  GitCompareArrows,
  LayoutGrid,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyCompareDialog } from '../components/PropertyCompareDialog';
import { demoMode } from '../config';
import { getFavoriteIds, toggleFavorite } from '../services/favorites';
import type { Property } from '../types/property';
import { formatPhone } from '../utils/formatters';
import '../comparison.css';

function RentalInterestForm() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demoMode) {
      setMessage(
        'Esta é uma prévia. O envio de interesse está disponível com o Supabase conectado.',
      );
      return;
    }
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
export function RentPage({
  properties,
  propertiesError,
}: {
  properties: Property[];
  propertiesError: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get('q') ?? '');
  const [type, setType] = useState(searchParams.get('type') ?? '');
  const [beds, setBeds] = useState(searchParams.get('beds') ?? '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [petsOnly, setPetsOnly] = useState(false);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [sort, setSort] = useState('recent');
  const [fav, setFav] = useState<string[]>([]);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    [
      ...new Set(
        (searchParams.get('compare') ?? '').split(',').filter(Boolean),
      ),
    ].slice(0, 3),
  );
  const [compareOpen, setCompareOpen] = useState(() =>
    Boolean(searchParams.get('compare')),
  );
  useEffect(() => {
    setTerm(searchParams.get('q') ?? '');
    setType(searchParams.get('type') ?? '');
    setBeds(searchParams.get('beds') ?? '');
  }, [searchParams]);
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
  const selectedProperties = useMemo(
    () =>
      compareIds
        .map((id) => properties.find((property) => property.id === id))
        .filter((property): property is Property => Boolean(property)),
    [compareIds, properties],
  );

  function toggleCompare(propertyId: string) {
    setCompareIds((ids) =>
      ids.includes(propertyId)
        ? ids.filter((id) => id !== propertyId)
        : ids.length < 3
          ? [...ids, propertyId]
          : ids,
    );
  }

  return (
    <main
      className={
        compareIds.length ? 'listing wrap has-compare' : 'listing wrap'
      }
    >
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
        <div className="results-actions">
          <div
            className="view-switch"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              aria-label="Ver em grade"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              aria-label="Ver em lista"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <Rows3 size={18} />
            </button>
          </div>
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
              setSearchParams({});
            }}
          >
            Limpar filtros
          </button>
        </div>
      </div>
      {list.length ? (
        <div className={viewMode === 'list' ? 'grid list-view' : 'grid'}>
          {list.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorite={fav.includes(p.id)}
              isCompared={compareIds.includes(p.id)}
              compareDisabled={compareIds.length >= 3}
              onCompare={() => toggleCompare(p.id)}
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
          <h2>
            {propertiesError
              ? 'Não foi possível carregar os imóveis'
              : 'Nenhum imóvel encontrado'}
          </h2>
          <p>
            {propertiesError
              ? 'Verifique a conexão com a API e tente novamente.'
              : 'Tente ajustar a busca ou remover alguns filtros.'}
          </p>
        </div>
      )}
      {favoriteMessage && <p className="rental-message">{favoriteMessage}</p>}
      <RentalInterestForm />
      {selectedProperties.length > 0 && (
        <aside
          className="compare-tray"
          aria-label="Imóveis selecionados para comparação"
        >
          <div className="compare-tray-heading">
            <GitCompareArrows size={20} />
            <div>
              <strong>Compare imóveis</strong>
              <span>{selectedProperties.length} de 3 selecionados</span>
            </div>
          </div>
          <div className="compare-tray-items">
            {selectedProperties.map((property) => (
              <div key={property.id} className="compare-tray-item">
                <img src={property.images[0]} alt="" />
                <span>{property.title}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(property.id)}
                  aria-label={`Remover ${property.title} da comparação`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="compare-tray-action"
            type="button"
            disabled={selectedProperties.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            {selectedProperties.length < 2
              ? 'Selecione mais um imóvel'
              : 'Comparar agora'}
          </button>
        </aside>
      )}
      {compareOpen && selectedProperties.length >= 2 && (
        <PropertyCompareDialog
          properties={selectedProperties}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </main>
  );
}
