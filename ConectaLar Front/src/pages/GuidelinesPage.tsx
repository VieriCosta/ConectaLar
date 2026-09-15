import { CheckCircle2, FileText, ShieldCheck, UsersRound } from 'lucide-react';

const rules = [
  {
    icon: <UsersRound />,
    title: 'Uso respeitoso',
    text: 'Trate anunciantes e interessados com respeito. Não são permitidas mensagens ofensivas, discriminatórias, assédio ou tentativa de fraude.',
  },
  {
    icon: <FileText />,
    title: 'Anúncios verdadeiros',
    text: 'Publique somente imóveis que você possa anunciar. Valores, localização, fotos e características devem ser verdadeiros e atualizados.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Segurança e privacidade',
    text: 'Não compartilhe senhas, códigos de confirmação ou dados bancários pela plataforma. Use os contatos apenas para tratar do imóvel.',
  },
  {
    icon: <CheckCircle2 />,
    title: 'Moderação',
    text: 'Podemos pausar ou remover conteúdos que violem estas regras, apresentem informações falsas ou coloquem usuários em risco.',
  },
];

export function GuidelinesPage() {
  return (
    <main className="guidelines-page wrap">
      <p className="section-tag">CONVIVÊNCIA E CONFIANÇA</p>
      <h1>Diretrizes e regras</h1>
      <p className="guidelines-intro">
        O ConectaLar existe para tornar a busca e o anúncio de imóveis mais
        simples, seguros e transparentes.
      </p>
      <section className="guidelines-grid">
        {rules.map((rule) => (
          <article key={rule.title}>
            <span>{rule.icon}</span>
            <h2>{rule.title}</h2>
            <p>{rule.text}</p>
          </article>
        ))}
      </section>
      <section className="guidelines-detail">
        <h2>Boas práticas ao alugar</h2>
        <ul>
          <li>Visite o imóvel antes de qualquer pagamento ou assinatura.</li>
          <li>Confirme a identidade e a legitimidade de quem anuncia.</li>
          <li>Formalize toda negociação em contrato adequado.</li>
          <li>Denuncie informações suspeitas para a equipe responsável.</li>
        </ul>
        <p>
          Estas diretrizes podem ser atualizadas para melhorar a segurança da
          comunidade.
        </p>
      </section>
    </main>
  );
}
