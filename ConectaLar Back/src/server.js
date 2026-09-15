import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FRONTEND_URL'];
for (const key of required)
  if (!process.env[key])
    throw new Error(`Variável obrigatória ausente: ${key}`);
const app = express();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const allowedOrigins = process.env.FRONTEND_URL.split(',').map((origin) =>
  origin.trim(),
);
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error('Origem não autorizada pelo CORS.'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '20kb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
const publicFormLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas. Aguarde alguns minutos para enviar novamente.',
  },
});
const authenticatedWriteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos.' },
});

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        }),
      },
    );
    return Boolean((await response.json()).success);
  } catch {
    return false;
  }
}

async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user)
    return res.status(401).json({ error: 'Sessão inválida.' });
  req.user = data.user;
  next();
}
function requireAdmin(req, res, next) {
  if (req.user?.app_metadata?.role !== 'admin')
    return res.status(403).json({ error: 'Acesso restrito.' });
  next();
}
app.get('/health', (_, res) => res.json({ status: 'ok' }));
const propertySchema = z
  .object({
    title: z.string().trim().min(10).max(140),
    type: z.string().trim().min(3).max(60),
    city: z.string().trim().min(2).max(120),
    neighborhood: z.string().trim().min(2).max(120),
    address: z.string().trim().min(4).max(240),
    price: z.coerce.number().int().positive(),
    bedrooms: z.coerce.number().int().min(0).max(30),
    bathrooms: z.coerce.number().int().min(0).max(30),
    parkingSpaces: z.coerce.number().int().min(0).max(30),
    area: z.coerce.number().positive().max(100000),
    description: z.string().trim().min(20).max(5000),
    acceptsPets: z.boolean(),
  furnished: z.boolean(),
  images: z.array(z.string().min(3).max(500)).min(1).max(6),
  })
  .strict();
app.post(
  '/api/properties',
  authenticatedWriteLimit,
  requireUser,
  async (req, res) => {
    const input = propertySchema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ error: 'Revise os dados do anúncio.' });
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, role')
      .eq('id', req.user.id)
      .maybeSingle();
    if (profile?.role !== 'owner')
      return res
        .status(403)
        .json({ error: 'Sua conta precisa ser de anunciante para publicar.' });
    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert({
        owner_id: req.user.id,
        title: input.data.title,
        type: input.data.type,
        city: input.data.city,
        neighborhood: input.data.neighborhood,
        address: input.data.address,
        price: input.data.price,
        bedrooms: input.data.bedrooms,
        bathrooms: input.data.bathrooms,
        parking_spaces: input.data.parkingSpaces,
        area: input.data.area,
        description: input.data.description,
        accepts_pets: input.data.acceptsPets,
        furnished: input.data.furnished,
        status: 'active',
    images: input.data.images,
      })
      .select()
      .single();
    if (error || !data)
      return res
        .status(400)
        .json({ error: 'Não foi possível publicar o anúncio.' });
    res.status(201).json({
      property: {
        id: data.id,
        title: data.title,
        type: data.type,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address,
        price: data.price,
        condominium: data.condominium ?? undefined,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parkingSpaces: data.parking_spaces,
        area: Number(data.area),
        description: data.description,
        images: data.images,
        acceptsPets: data.accepts_pets,
        furnished: data.furnished,
        status: data.status,
        ownerName: profile.full_name,
        ownerPhone: profile.phone ?? '',
      },
    });
  },
);
app.get('/api/properties', async (_, res) => {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(
      'id, title, type, city, neighborhood, address, price, condominium, bedrooms, bathrooms, parking_spaces, area, description, images, accepts_pets, furnished, status, owner_id',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error)
    return res
      .status(400)
      .json({ error: 'Não foi possível carregar imóveis.' });
  const ownerIds = [
    ...new Set((data ?? []).map((property) => property.owner_id)),
  ];
  const { data: owners } = ownerIds.length
    ? await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', ownerIds)
    : { data: [] };
  const ownerById = new Map((owners ?? []).map((owner) => [owner.id, owner]));
  res.json({
    properties: (data ?? []).map((property) => {
      const owner = ownerById.get(property.owner_id);
      return {
        id: property.id,
        title: property.title,
        type: property.type,
        city: property.city,
        neighborhood: property.neighborhood,
        address: property.address,
        price: property.price,
        condominium: property.condominium,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parking_spaces,
        area: Number(property.area),
        description: property.description,
        images: property.images,
        acceptsPets: property.accepts_pets,
        furnished: property.furnished,
        status: property.status,
        ownerName: owner?.full_name ?? 'Anunciante',
        ownerPhone: owner?.phone ?? '',
      };
    }),
  });
});
const propertyIdSchema = z.string().uuid();
app.get('/api/properties/:propertyId/reviews', async (req, res) => {
  if (!propertyIdSchema.safeParse(req.params.propertyId).success)
    return res.json({ reviews: [] });
  const { data, error } = await supabaseAdmin
    .from('property_reviews')
    .select('id, rating, comment, created_at, author_id')
    .eq('property_id', req.params.propertyId)
    .order('created_at', { ascending: false });
  if (error)
    return res
      .status(400)
      .json({ error: 'Não foi possível carregar avaliações.' });
  const authorIds = [
    ...new Set((data ?? []).map((review) => review.author_id)),
  ];
  const { data: authors } = authorIds.length
    ? await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', authorIds)
    : { data: [] };
  const authorNames = new Map(
    (authors ?? []).map((author) => [author.id, author.full_name]),
  );
  res.json({
    reviews: (data ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      author: authorNames.get(review.author_id) ?? 'Usuário verificado',
    })),
  });
});
app.get(
  '/api/properties/:propertyId/review-eligibility',
  requireUser,
  async (req, res) => {
    if (!propertyIdSchema.safeParse(req.params.propertyId).success)
      return res.json({ eligible: false });
    const { data } = await supabaseAdmin
      .from('rental_agreements')
      .select('id')
      .eq('property_id', req.params.propertyId)
      .eq('renter_id', req.user.id)
      .eq('status', 'completed')
      .maybeSingle();
    res.json({ eligible: Boolean(data), rentalAgreementId: data?.id ?? null });
  },
);
const propertyReviewSchema = z
  .object({
    propertyId: z.string().uuid(),
    rentalAgreementId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(10).max(800),
  })
  .strict();
app.post(
  '/api/property-reviews',
  authenticatedWriteLimit,
  requireUser,
  async (req, res) => {
    const input = propertyReviewSchema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ error: 'Revise sua avaliação.' });
    const { error } = await supabaseAdmin.from('property_reviews').insert({
      property_id: input.data.propertyId,
      rental_agreement_id: input.data.rentalAgreementId,
      author_id: req.user.id,
      rating: input.data.rating,
      comment: input.data.comment,
    });
    if (error)
      return res.status(400).json({
        error: 'A avaliação só pode ser enviada após o aluguel confirmado.',
      });
    res.status(201).json({ success: true });
  },
);
app.get('/api/me', requireUser, (req, res) =>
  res.json({
    id: req.user.id,
    email: req.user.email,
    profile: req.user.user_metadata,
  }),
);
const rentalRequestSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(30),
    propertyType: z.string().trim().min(3).max(60),
    location: z.string().trim().min(3).max(160),
    budget: z.coerce.number().int().positive().max(1000000),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();
app.post('/api/rental-requests', publicFormLimit, async (req, res) => {
  const input = rentalRequestSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: 'Revise os dados do seu interesse.' });
  if (!(await verifyTurnstile(input.data.turnstileToken, req.ip)))
    return res
      .status(400)
      .json({ error: 'Verificação de segurança inválida.' });
  const { fullName, email, phone, propertyType, location, budget } = input.data;
  const { error } = await supabaseAdmin.from('admin_leads').insert({
    full_name: fullName,
    email: email.toLowerCase(),
    phone,
    property_name: `${propertyType} em ${location}`,
    location,
    monthly_budget: budget,
    status: 'new',
  });
  if (error?.code === '23505')
    return res
      .status(409)
      .json({ error: 'Já existe um interesse cadastrado para este e-mail.' });
  if (error)
    return res
      .status(400)
      .json({ error: 'Não foi possível registrar seu interesse.' });
  res.status(201).json({ success: true });
});
const contactSchema = z
  .object({
    propertyId: z.string().uuid(),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();
app.post(
  '/api/interests',
  authenticatedWriteLimit,
  requireUser,
  async (req, res) => {
    const input = contactSchema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ error: 'Dados de contato inválidos.' });
    const { error } = await supabaseAdmin.from('interests').insert({
      property_id: input.data.propertyId,
      renter_id: req.user.id,
      message: input.data.message,
    });
    if (error)
      return res
        .status(400)
        .json({ error: 'Não foi possível registrar seu interesse.' });
    res.status(201).json({ success: true });
  },
);
app.post('/api/interests/:id/approve', authenticatedWriteLimit, requireUser, async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: 'Interesse inválido.' });
  const { data: interest } = await supabaseAdmin.from('interests').select('id, property_id, renter_id, properties!inner(owner_id)').eq('id', req.params.id).maybeSingle();
  if (!interest || interest.properties.owner_id !== req.user.id) return res.status(404).json({ error: 'Interesse não encontrado.' });
  const { error: agreementError } = await supabaseAdmin.from('rental_agreements').upsert({ property_id: interest.property_id, renter_id: interest.renter_id, owner_id: req.user.id, status: 'active' }, { onConflict: 'property_id,renter_id' });
  if (agreementError) return res.status(400).json({ error: 'Não foi possível criar o contrato.' });
  await supabaseAdmin.from('interests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', interest.id);
  res.json({ success: true });
});
app.post('/api/rental-agreements/:id/complete', authenticatedWriteLimit, requireUser, async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: 'Contrato inválido.' });
  const { data: agreement } = await supabaseAdmin.from('rental_agreements').select('owner_id').eq('id', req.params.id).maybeSingle();
  if (!agreement || agreement.owner_id !== req.user.id) return res.status(404).json({ error: 'Contrato não encontrado.' });
  const { error } = await supabaseAdmin.from('rental_agreements').update({ status: 'completed', confirmed_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: 'Não foi possível concluir o contrato.' });
  res.json({ success: true });
});
app.get('/api/owner/interests', requireUser, async (req, res) => {
  const { data: properties, error: propertiesError } = await supabaseAdmin
    .from('properties')
    .select('id, title')
    .eq('owner_id', req.user.id);
  if (propertiesError)
    return res.status(400).json({ error: 'NÃ£o foi possÃ­vel carregar os interesses.' });
  const propertyIds = (properties ?? []).map((property) => property.id);
  if (!propertyIds.length) return res.json({ interests: [], agreements: [] });
  const titleById = new Map(
    (properties ?? []).map((property) => [property.id, property.title]),
  );
  const [{ data: interests, error: interestsError }, { data: agreements, error: agreementsError }] = await Promise.all([
    supabaseAdmin.from('interests').select('id, property_id, renter_id, message, status, created_at').in('property_id', propertyIds).order('created_at', { ascending: false }),
    supabaseAdmin.from('rental_agreements').select('id, property_id, renter_id, status, confirmed_at').in('property_id', propertyIds).order('confirmed_at', { ascending: false }),
  ]);
  if (interestsError || agreementsError)
    return res.status(400).json({ error: 'NÃ£o foi possÃ­vel carregar os interesses.' });
  const renterIds = [...new Set([...(interests ?? []).map((item) => item.renter_id), ...(agreements ?? []).map((item) => item.renter_id)])];
  const { data: renters } = renterIds.length
    ? await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', renterIds)
    : { data: [] };
  const renterById = new Map((renters ?? []).map((renter) => [renter.id, renter]));
  res.json({
    interests: (interests ?? []).map((interest) => ({
      ...interest,
      propertyTitle: titleById.get(interest.property_id) ?? 'ImÃ³vel',
      renterName: renterById.get(interest.renter_id)?.full_name ?? 'UsuÃ¡rio',
      renterEmail: renterById.get(interest.renter_id)?.email ?? '',
    })),
    agreements: (agreements ?? []).map((agreement) => ({
      ...agreement,
      propertyTitle: titleById.get(agreement.property_id) ?? 'ImÃ³vel',
      renterName: renterById.get(agreement.renter_id)?.full_name ?? 'UsuÃ¡rio',
    })),
  });
});
const reportSchema = z
  .object({
    propertyId: z.string().uuid().optional(),
    reason: z.enum([
      'fraud',
      'inaccurate_information',
      'offensive_content',
      'other',
    ]),
    details: z.string().trim().min(10).max(1500),
  })
  .strict();
app.post(
  '/api/reports',
  authenticatedWriteLimit,
  requireUser,
  async (req, res) => {
    const input = reportSchema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ error: 'Revise os dados da denúncia.' });
    const { error } = await supabaseAdmin.from('reports').insert({
      reporter_id: req.user.id,
      property_id: input.data.propertyId ?? null,
      reason: input.data.reason,
      details: input.data.details,
    });
    if (error)
      return res
        .status(400)
        .json({ error: 'Não foi possível enviar a denúncia.' });
    res.status(201).json({ success: true });
  },
);
const leadStatusSchema = z
  .object({ status: z.enum(['new', 'contacted', 'visit_scheduled']) })
  .strict();
app.post(
  '/api/admin/leads/:id/status',
  requireUser,
  requireAdmin,
  async (req, res) => {
    const input = leadStatusSchema.safeParse(req.body);
    if (!input.success || !z.string().uuid().safeParse(req.params.id).success)
      return res.status(400).json({ error: 'Dados inválidos.' });
    const { error } = await supabaseAdmin
      .from('admin_leads')
      .update({ status: input.data.status })
      .eq('id', req.params.id);
    if (error)
      return res
        .status(400)
        .json({ error: 'Não foi possível atualizar o status.' });
    res.json({ success: true });
  },
);
app.use((error, _, res, next) => {
  if (error?.message === 'Origem não autorizada pelo CORS.')
    return res.status(403).json({ error: 'Origem não autorizada.' });
  return next(error);
});
app.use((_, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.listen(Number(process.env.PORT ?? 3333), () =>
  console.log('API ConectaLar em execução.'),
);
