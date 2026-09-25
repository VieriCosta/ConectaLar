import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bath, BedDouble, Car, Check, MapPin, Star } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { getPropertyReviews, type PropertyReview } from '../services/reviews';
import { supabase } from '../services/supabase';
import type { Property } from '../types/property';
import { formatCurrency as money } from '../utils/formatters';
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
export function DetailPage({
  properties,
  loadingProperties,
}: {
  properties: Property[];
  loadingProperties: boolean;
}) {
  const { id } = useParams();
  const { user } = useAuth();
  const p = properties.find((x) => x.id === id);
  const [sent, setSent] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [hasConfirmedRental, setHasConfirmedRental] = useState(false);
  const [rentalAgreementId, setRentalAgreementId] = useState<string | null>(
    null,
  );
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
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const response = await fetch(
          `/api/properties/${p.id}/review-eligibility`,
          {
            headers: {
              Authorization: `Bearer ${data.session?.access_token ?? ''}`,
            },
          },
        );
        if (!response.ok) return;
        const eligibility = (await response.json()) as {
          eligible: boolean;
          rentalAgreementId: string | null;
        };
        setHasConfirmedRental(eligibility.eligible);
        setRentalAgreementId(eligibility.rentalAgreementId);
      })
      .catch(() => {
        setHasConfirmedRental(false);
        setRentalAgreementId(null);
      });
  }, [p?.id, user]);
  async function submitInterest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setContactMessage(
        'Entre na sua conta para enviar interesse ao anunciante.',
      );
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
        body: JSON.stringify({
          propertyId: p?.id,
          message: form.get('message'),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ?? 'Não foi possível enviar seu interesse.',
        );
      setSent(true);
    } catch (error) {
      setContactMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar seu interesse.',
      );
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
    setReviewStatus(
      'Avaliação enviada. Obrigado por compartilhar sua experiência!',
    );
    if (p)
      getPropertyReviews(p.id)
        .then(setReviews)
        .catch(() => undefined);
  }
  async function openWhatsApp() {
    if (!user) {
      setContactMessage(
        'Entre na sua conta e envie seu interesse para solicitar o contato.',
      );
      return;
    }
    if (!p) return;
    setLoadingContact(true);
    setContactMessage('');
    const { data } = await supabase.auth.getSession();
    try {
      const response = await fetch(`/api/properties/${p.id}/contact`, {
        headers: {
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? 'Não foi possível liberar o contato.');
      const phone = String(result.phone).replace(/\D/g, '');
      window.open(
        `https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(`Olá, tenho interesse em ${p.title}`)}`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (error) {
      setContactMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível liberar o contato.',
      );
    } finally {
      setLoadingContact(false);
    }
  }
  if (!p && loadingProperties)
    return (
      <main className="wrap property-state" aria-live="polite">
        <p className="section-tag">CARREGANDO</p>
        <h1>Buscando imóvel...</h1>
        <p>Aguarde um instante enquanto consultamos os dados.</p>
      </main>
    );
  if (!p)
    return (
      <main className="wrap property-state empty">
        <p className="section-tag">ANÚNCIO INDISPONÍVEL</p>
        <h1>Imóvel não encontrado</h1>
        <p>
          Este anúncio pode ter sido removido, pausado ou ainda estar em
          análise.
        </p>
        <Link to="/alugar">Voltar à busca</Link>
      </main>
    );
  return (
    <main className="detail wrap">
      <Link className="back" to="/alugar">
        ← Voltar para imóveis
      </Link>
      <div
        className={p.images.length > 1 ? 'gallery' : 'gallery gallery-single'}
      >
        <img src={p.images[0]} alt={p.title} />
        {p.images[1] && (
          <img src={p.images[1]} alt={`Outro ambiente de ${p.title}`} />
        )}
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
                      <Star
                        size={22}
                        fill={rating <= reviewRating ? 'currentColor' : 'none'}
                      />
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
                {reviewStatus && (
                  <small className="form-message">{reviewStatus}</small>
                )}
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
            <form
              id="contact-form"
              className="contact"
              onSubmit={submitInterest}
            >
              <input
                required
                placeholder="Seu nome"
                defaultValue={user?.user_metadata?.full_name ?? ''}
              />
              <input
                required
                type="email"
                placeholder="Seu e-mail"
                defaultValue={user?.email ?? ''}
              />
              <textarea
                name="message"
                required
                minLength={10}
                placeholder="Olá! Tenho interesse neste imóvel."
              />
              <button disabled={sendingInterest}>
                {sendingInterest ? 'Enviando...' : 'Enviar mensagem'}
              </button>
              {contactMessage && (
                <small className="form-message">{contactMessage}</small>
              )}
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
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('contact-form')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          >
            Tenho interesse
          </button>
          <ReportProperty propertyId={p.id} />
          <button
            type="button"
            className="whatsapp-contact"
            onClick={openWhatsApp}
            disabled={loadingContact}
          >
            {loadingContact ? 'Verificando contato...' : 'Falar pelo WhatsApp'}
          </button>
          {contactMessage && (
            <small className="form-message contact-message">
              {contactMessage}
            </small>
          )}
        </aside>
      </div>
    </main>
  );
}
