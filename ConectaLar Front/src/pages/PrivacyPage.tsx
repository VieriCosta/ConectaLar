export function PrivacyPage() {
  return (
    <main className="guidelines-page wrap">
      <p className="section-tag">PRIVACIDADE E SEGURANÇA</p>
      <h1>Política de privacidade</h1>
      <p className="guidelines-intro">
        Coletamos apenas os dados necessários para criar sua conta, publicar
        imóveis e permitir contatos sobre uma negociação.
      </p>
      <section className="guidelines-detail">
        <h2>Como usamos seus dados</h2>
        <ul>
          <li>
            Seu e-mail é usado para acesso, confirmações e recuperação de senha.
          </li>
          <li>
            Dados de contato são exibidos somente quando necessários para tratar
            do imóvel.
          </li>
          <li>
            Denúncias e contatos são acessíveis apenas à equipe autorizada.
          </li>
          <li>Você pode solicitar a atualização ou exclusão dos seus dados.</li>
        </ul>
        <h2>Segurança</h2>
        <p>
          Não solicitamos senhas, códigos de confirmação ou dados bancários em
          mensagens. Faça visitas e confirme a identidade do anunciante antes de
          realizar pagamentos.
        </p>
      </section>
    </main>
  );
}
