import {
  Building2,
  CalendarDays,
  Home,
  Mail,
  Phone,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  property_name: string;
  location: string;
  monthly_budget: number;
  status: 'new' | 'contacted' | 'visit_scheduled';
  created_at: string;
};
const labels = {
  new: 'Novo',
  contacted: 'Em contato',
  visit_scheduled: 'Visita agendada',
};
const money = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

export function AdminDashboardPage() {
  const { user, loading, session } = useAuth();
  const isAdmin = user?.app_metadata?.role === 'admin';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('admin_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError)
          setError('Não foi possível carregar os contatos do Supabase.');
        else setLeads((data ?? []) as Lead[]);
        setIsLoading(false);
      });
  }, [isAdmin]);

  if (loading)
    return <main className="admin-page wrap">Carregando painel...</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/perfil" replace />;

  function exportCsv() {
    const content = [
      [
        'Cliente',
        'E-mail',
        'Telefone',
        'Imóvel',
        'Região',
        'Orçamento',
        'Status',
      ],
      ...leads.map((lead) => [
        lead.full_name,
        lead.email,
        lead.phone,
        lead.property_name,
        lead.location,
        String(lead.monthly_budget),
        labels[lead.status],
      ]),
    ]
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(';'),
      )
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' }),
    );
    link.download = 'contatos-conectalar.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="admin-page wrap">
      <p className="section-tag">ÁREA RESTRITA</p>
      <div className="admin-heading">
        <div>
          <h1>Dashboard administrativo</h1>
          <p>
            Acompanhe os contatos de pessoas interessadas em alugar imóveis.
          </p>
        </div>
        <span className="admin-badge">
          <ShieldAlert size={16} /> Acesso administrador
        </span>
      </div>
      <section className="dashboard-metrics">
        <article>
          <span>
            <Users />
          </span>
          <div>
            <small>Interessados cadastrados</small>
            <strong>{leads.length}</strong>
            <p>Registros no Supabase</p>
          </div>
        </article>
        <article>
          <span>
            <Mail />
          </span>
          <div>
            <small>Novos contatos</small>
            <strong>
              {leads.filter((lead) => lead.status === 'new').length}
            </strong>
            <p>Aguardando retorno</p>
          </div>
        </article>
        <article>
          <span>
            <CalendarDays />
          </span>
          <div>
            <small>Visitas agendadas</small>
            <strong>
              {leads.filter((lead) => lead.status === 'visit_scheduled').length}
            </strong>
            <p>Para os próximos dias</p>
          </div>
        </article>
        <article>
          <span>
            <Building2 />
          </span>
          <div>
            <small>Imóveis procurados</small>
            <strong>
              {new Set(leads.map((lead) => lead.property_name)).size}
            </strong>
            <p>Em Fortaleza e região</p>
          </div>
        </article>
      </section>
      <section className="admin-leads">
        <div className="admin-table-heading">
          <div>
            <h2>Clientes interessados</h2>
            <p>Contatos carregados diretamente do Supabase.</p>
          </div>
          <button className="admin-export" type="button" onClick={exportCsv}>
            Exportar CSV
          </button>
          <span>{leads.length} contatos recentes</span>
        </div>
        {error ? (
          <p className="admin-load-state">{error}</p>
        ) : isLoading ? (
          <p className="admin-load-state">Carregando contatos...</p>
        ) : (
          <div className="leads-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Imóvel desejado</th>
                  <th>Orçamento</th>
                  <th>Contato</th>
                  <th>Recebido</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.full_name}</strong>
                      <small>{lead.location}</small>
                    </td>
                    <td>{lead.property_name}</td>
                    <td>{money(lead.monthly_budget)}/mês</td>
                    <td>
                      <a href={`mailto:${lead.email}`}>
                        <Mail size={14} /> {lead.email}
                      </a>
                      <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>
                        <Phone size={14} /> {lead.phone}
                      </a>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(lead.created_at))}
                    </td>
                    <td>
                      <select
                        className="lead-status-select"
                        value={lead.status}
                        onChange={async (event) => {
                          const status = event.target.value as Lead['status'];
                          const response = await fetch(
                            `/api/admin/leads/${lead.id}/status`,
                            {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${session?.access_token ?? ''}`,
                              },
                              body: JSON.stringify({ status }),
                            },
                          );
                          if (response.ok)
                            setLeads((items) =>
                              items.map((item) =>
                                item.id === lead.id
                                  ? { ...item, status }
                                  : item,
                              ),
                            );
                        }}
                      >
                        <option value="new">Novo</option>
                        <option value="contacted">Em contato</option>
                        <option value="visit_scheduled">Visita agendada</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-note">
          <Home size={17} /> Os dados de contato ficam protegidos e são exibidos
          somente para administradores.
        </div>
      </section>
    </main>
  );
}
