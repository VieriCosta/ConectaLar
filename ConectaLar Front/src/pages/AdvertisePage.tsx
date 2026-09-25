import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { demoMode } from '../config';
import { supabase } from '../services/supabase';
import {
  formatCurrencyInput,
  formatPhone,
  limitInteger,
  onlyDigits,
} from '../utils/formatters';
export function AdvertisePage() {
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (demoMode) {
      setMessage(
        'Esta é uma prévia. O envio de anúncios está disponível com o Supabase conectado.',
      );
      return;
    }
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
    const invalidNumeric = numericFields.find(([, rawValue]) => {
      const value = Number(rawValue);
      return !rawValue || !Number.isInteger(value) || value < 0 || value > 30;
    });
    if (invalidNumeric)
      return setMessage(
        `${invalidNumeric[0]} deve ser um número entre 0 e 30.`,
      );
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
    const files = d
      .getAll('images')
      .filter((item): item is File => item instanceof File && item.size > 0);
    if (!userId)
      return setMessage('Entre na sua conta para publicar um anúncio.');
    if (!files.length)
      return setMessage('Adicione pelo menos uma foto do imóvel.');
    if (files.length > 6 || files.some((file) => file.size > 5242880))
      return setMessage('Envie até 6 fotos, com no máximo 5 MB cada.');
    if (
      files.some(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      )
    )
      return setMessage('Envie fotos JPG, PNG ou WEBP.');
    setUploading(true);
    const images: string[] = [];
    for (const file of files) {
      const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
      const { error } = await supabase.storage
        .from('property-images')
        .upload(path, file, { contentType: file.type });
      if (error) {
        setUploading(false);
        return setMessage('Não foi possível enviar uma das fotos.');
      }
      images.push(
        supabase.storage.from('property-images').getPublicUrl(path).data
          .publicUrl,
      );
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
    setUploading(false);
    setDone(true);
    e.currentTarget.reset();
  };
  if (done)
    return (
      <main className="wrap success-page">
        <Check size={42} />
        <h1>Anúncio criado com sucesso!</h1>
        <p>
          Seu imóvel foi salvo no banco e será publicado após a análise da
          equipe.
        </p>
        <Link to="/meus-anuncios">Acompanhar meus anúncios</Link>
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
                event.currentTarget.value = limitInteger(
                  event.currentTarget.value,
                  30,
                );
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
                event.currentTarget.value = limitInteger(
                  event.currentTarget.value,
                  30,
                );
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
                event.currentTarget.value = limitInteger(
                  event.currentTarget.value,
                  30,
                );
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
                event.currentTarget.value = onlyDigits(
                  event.currentTarget.value,
                );
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
          <label className="wide">
            Fotos do imóvel
            <input
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />
            <small>
              Até 6 fotos em JPG, PNG ou WEBP; máximo de 5 MB por foto.
            </small>
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
            {uploading ? 'Enviando fotos...' : 'Publicar anúncio'}{' '}
            <ChevronRight />
          </button>
          {message && <p className="rental-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}
