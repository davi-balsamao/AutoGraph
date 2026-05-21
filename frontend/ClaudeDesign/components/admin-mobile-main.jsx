/* Autograph Admin Mobile — Main canvas (7 screens × light/dark = 14 artboards) */

function App() {
  return (
    <DesignCanvas>
      <DCSection id="admin-mobile-auth-light" title="Autenticação admin · Light" subtitle="Login do gerente">
        <DCArtboard id="admin-login-light" label="00 · Login admin" width={360} height={720}>
          <AdmMobileLogin/>
        </DCArtboard>
      </DCSection>

      {/* ─────────── LIGHT MODE ─────────── */}
      <DCSection id="admin-mobile-overview-light" title="Painel admin mobile · Light" subtitle="App do gerente — visão geral e operação">
        <DCArtboard id="dash-light" label="01 · Dashboard" width={360} height={720}>
          <AdmMobileDashboard/>
        </DCArtboard>
        <DCArtboard id="kanban-light" label="02 · Kanban OS" width={360} height={720}>
          <AdmMobileKanban/>
        </DCArtboard>
        <DCArtboard id="chat-light" label="03 · Atendimento (lista)" width={360} height={720}>
          <AdmMobileChat/>
        </DCArtboard>
        <DCArtboard id="chat-open-light" label="03b · Conversa aberta" width={360} height={720}>
          <AdmMobileChatConversation/>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-mobile-records-light" title="Registros · Light" subtitle="Pedidos & financeiro">
        <DCArtboard id="orders-light" label="04 · Pedidos" width={360} height={720}>
          <AdmMobileOrders/>
        </DCArtboard>
        <DCArtboard id="finance-light" label="05 · Financeiro" width={360} height={720}>
          <AdmMobileFinance/>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-mobile-config-light" title="Configuração · Light" subtitle="Catálogo, usuários & menu Mais">
        <DCArtboard id="catalog-light" label="06 · Catálogo" width={360} height={720}>
          <AdmMobileCatalog/>
        </DCArtboard>
        <DCArtboard id="users-light" label="07 · Usuários" width={360} height={720}>
          <AdmMobileUsers/>
        </DCArtboard>
        <DCArtboard id="more-light" label="08 · Mais (tema, conta)" width={360} height={720}>
          <AdmMobileMore/>
        </DCArtboard>
      </DCSection>

      {/* ─────────── DARK MODE ─────────── */}
      <DCSection id="admin-mobile-auth-dark" title="Autenticação admin · Dark">
        <DCArtboard id="admin-login-dark" label="00 · Login admin (dark)" width={360} height={720}>
          <AdmMobileLogin dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-mobile-overview-dark" title="Painel admin mobile · Dark" subtitle="Mesmas telas com superfícies em deep teal">
        <DCArtboard id="dash-dark" label="01 · Dashboard (dark)" width={360} height={720}>
          <AdmMobileDashboard dark/>
        </DCArtboard>
        <DCArtboard id="kanban-dark" label="02 · Kanban OS (dark)" width={360} height={720}>
          <AdmMobileKanban dark/>
        </DCArtboard>
        <DCArtboard id="chat-dark" label="03 · Atendimento (dark)" width={360} height={720}>
          <AdmMobileChat dark/>
        </DCArtboard>
        <DCArtboard id="chat-open-dark" label="03b · Conversa aberta (dark)" width={360} height={720}>
          <AdmMobileChatConversation dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-mobile-records-dark" title="Registros · Dark">
        <DCArtboard id="orders-dark" label="04 · Pedidos (dark)" width={360} height={720}>
          <AdmMobileOrders dark/>
        </DCArtboard>
        <DCArtboard id="finance-dark" label="05 · Financeiro (dark)" width={360} height={720}>
          <AdmMobileFinance dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-mobile-config-dark" title="Configuração · Dark">
        <DCArtboard id="catalog-dark" label="06 · Catálogo (dark)" width={360} height={720}>
          <AdmMobileCatalog dark/>
        </DCArtboard>
        <DCArtboard id="users-dark" label="07 · Usuários (dark)" width={360} height={720}>
          <AdmMobileUsers dark/>
        </DCArtboard>
        <DCArtboard id="more-dark" label="08 · Mais (dark)" width={360} height={720}>
          <AdmMobileMore dark/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
