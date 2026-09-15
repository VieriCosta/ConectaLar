import { Check, Eye, Pause, Play, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';

type Listing = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  status: 'active' | 'paused';
  created_at: string;
};
type Interest = {
  id: string;
  propertyTitle: string;
  renterName: string;
  renterEmail: string;
  message: string;
  status: 'pending' | 'approved' | 'declined';
};
type Agreement = {
  id: string;
  propertyTitle: string;
  renterName: string;
  status: 'active' | 'completed';
};
const money = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

export function MyListingsPage() {
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!user) return;
    supabase
      .from('properties')
      .select('id,title,city,neighborhood,price,status,created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setMessage('Não foi possível carregar seus anúncios.');
        else setListings((data ?? []) as Listing[]);
      });
  }, [user]);
  async function loadContractData() {
    const { data } = await supabase.auth.getSession();
    const response = await fetch('/api/owner/interests', {
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    });
    if (!response.ok) throw new Error('Não foi possível carregar os interesses.');
    const result = (await response.json()) as { interests: Interest[]; agreements: Agreement[] };
    setInterests(result.interests);
    setAgreements(result.agreements);
  }
  useEffect(() => {
    if (!user) return;
    loadContractData().catch((error) =>
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os interesses.'),
    );
  }, [user]);
  if (loading)
    return <main className="my-listings wrap">Carregando anúncios...</main>;
  if (!user) return <Navigate to="/login" replace />;
  async function changeStatus(listing: Listing) {
    const status = listing.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', listing.id);
    if (error) setMessage('Não foi possível atualizar o anúncio.');
    else
      setListings((items) =>
        items.map((item) =>
          item.id === listing.id ? { ...item, status } : item,
        ),
      );
  }
  async function remove(listing: Listing) {
    if (
      !window.confirm(
        `Excluir “${listing.title}”? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', listing.id);
    if (error) setMessage('Não foi possível excluir o anúncio.');
    else setListings((items) => items.filter((item) => item.id !== listing.id));
  }
  async function approveInterest(interest: Interest) {
    const { data } = await supabase.auth.getSession();
    const response = await fetch(`/api/interests/${interest.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? 'Não foi possível aprovar o interesse.');
    else {
      setMessage('Interesse aprovado e contrato ativo criado. Conclua o contrato quando a locação terminar.');
      loadContractData().catch(() => undefined);
    }
  }
  async function completeAgreement(agreement: Agreement) {
    const { data } = await supabase.auth.getSession();
    const response = await fetch(`/api/rental-agreements/${agreement.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? 'Não foi possível concluir o contrato.');
    else {
      setMessage('Contrato concluído. O locatário já pode avaliar o imóvel.');
      loadContractData().catch(() => undefined);
    }
  }
  return (
    <main className="my-listings wrap">
      <p className="section-tag">ÁREA DO ANUNCIANTE</p>
      <div className="my-listings-head">
        <div>
          <h1>Meus anúncios</h1>
          <p>Gerencie a visibilidade dos seus imóveis cadastrados.</p>
        </div>
        <Link className="primary-link" to="/anunciar">
          Novo anúncio
        </Link>
      </div>
      {message && <p className="auth-message">{message}</p>}
      {listings.length ? (
        <div className="listing-manager">
          {listings.map((listing) => (
            <article key={listing.id}>
              <div>
                <span className={`listing-status ${listing.status}`}>
                  {listing.status === 'active' ? 'Ativo' : 'Pausado'}
                </span>
                <h2>{listing.title}</h2>
                <p>
                  {listing.neighborhood}, {listing.city} ·{' '}
                  {money(listing.price)}/mês
                </p>
              </div>
              <div className="listing-actions">
                <Link to={`/imovel/${listing.id}`} aria-label="Ver anúncio">
                  <Eye size={17} />
                </Link>
                <button
                  type="button"
                  onClick={() => changeStatus(listing)}
                  aria-label="Alterar status"
                >
                  {listing.status === 'active' ? (
                    <Pause size={17} />
                  ) : (
                    <Play size={17} />
                  )}
                </button>
                <button
                  className="delete-listing"
                  type="button"
                  onClick={() => remove(listing)}
                  aria-label="Excluir anúncio"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Você ainda não tem anúncios.</h2>
          <Link className="primary-link" to="/anunciar">
            Criar meu primeiro anúncio
          </Link>
        </div>
      )}
      <section className="listing-contracts" aria-labelledby="interests-title">
        <p className="section-tag">LOCAÇÕES</p>
        <h2 id="interests-title">Interesses recebidos</h2>
        {interests.filter((interest) => interest.status === 'pending').length ? (
          <div className="listing-manager">
            {interests.filter((interest) => interest.status === 'pending').map((interest) => (
              <article key={interest.id}>
                <div>
                  <h3>{interest.propertyTitle}</h3>
                  <p><b>{interest.renterName}</b> · {interest.renterEmail}</p>
                  <p>{interest.message}</p>
                </div>
                <div className="listing-actions">
                  <button type="button" onClick={() => approveInterest(interest)} title="Aprovar interesse">
                    <Check size={17} /> Aprovar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="empty-copy">Nenhum interesse pendente no momento.</p>}
        <h2>Contratos ativos</h2>
        {agreements.filter((agreement) => agreement.status === 'active').length ? (
          <div className="listing-manager">
            {agreements.filter((agreement) => agreement.status === 'active').map((agreement) => (
              <article key={agreement.id}>
                <div><h3>{agreement.propertyTitle}</h3><p>Locatário: {agreement.renterName}</p></div>
                <div className="listing-actions"><button type="button" onClick={() => completeAgreement(agreement)}>Concluir locação</button></div>
              </article>
            ))}
          </div>
        ) : <p className="empty-copy">Nenhum contrato ativo.</p>}
      </section>
    </main>
  );
}
