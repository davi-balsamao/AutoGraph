/* Autograph mobile app — main canvas. Light + dark variants side by side. */

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── LIGHT MODE ─────────── */}
      <DCSection id="auth-light" title="Autenticação · Light" subtitle="Login e cadastro do cliente">
        <DCArtboard id="login-light" label="00a · Login" width={360} height={720}>
          <LoginScreen/>
        </DCArtboard>
        <DCArtboard id="signup-light" label="00b · Cadastro" width={360} height={720}>
          <SignupScreen/>
        </DCArtboard>
      </DCSection>

      <DCSection id="onboarding-light" title="Boas-vindas · Light" subtitle="Onboarding & home do app">
        <DCArtboard id="welcome-light" label="01 · Welcome" width={360} height={720}>
          <WelcomeScreen/>
        </DCArtboard>
        <DCArtboard id="home-light" label="02 · Início" width={360} height={720}>
          <HomeScreen/>
        </DCArtboard>
      </DCSection>

      <DCSection id="chat-light" title="Atendimento automático · Light" subtitle="O agente Autograph no WhatsApp — orçamento, prova digital e aprovação dentro do chat">
        <DCArtboard id="chat-light-1" label="03 · Conversa com agente" width={360} height={720}>
          <ChatScreen/>
        </DCArtboard>
      </DCSection>

      <DCSection id="catalog-light" title="Catálogo & Pedido · Light" subtitle="Panfletos, banners, blocos e apostilas">
        <DCArtboard id="catalog-list-light" label="04 · Catálogo" width={360} height={720}>
          <CatalogScreen/>
        </DCArtboard>
        <DCArtboard id="product-detail-light" label="05 · Produto" width={360} height={720}>
          <ProductDetailScreen/>
        </DCArtboard>
      </DCSection>

      <DCSection id="orders-light" title="Pedidos & Conta · Light" subtitle="Acompanhamento de produção e perfil">
        <DCArtboard id="orders-list-light" label="06 · Pedidos" width={360} height={720}>
          <OrdersScreen/>
        </DCArtboard>
        <DCArtboard id="tracking-light" label="07 · Rastreio" width={360} height={720}>
          <TrackingScreen/>
        </DCArtboard>
        <DCArtboard id="account-light" label="08 · Conta" width={360} height={720}>
          <AccountScreen/>
        </DCArtboard>
      </DCSection>

      {/* ─────────── DARK MODE ─────────── */}
      <DCSection id="auth-dark" title="Autenticação · Dark" subtitle="Login e cadastro do cliente em dark mode">
        <DCArtboard id="login-dark" label="00a · Login (dark)" width={360} height={720}>
          <LoginScreen dark/>
        </DCArtboard>
        <DCArtboard id="signup-dark" label="00b · Cadastro (dark)" width={360} height={720}>
          <SignupScreen dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="onboarding-dark" title="Boas-vindas · Dark" subtitle="Mesmo fluxo no modo escuro — superfícies em deep teal, tipografia em on-dark">
        <DCArtboard id="welcome-dark" label="01 · Welcome (dark)" width={360} height={720}>
          <WelcomeScreen dark/>
        </DCArtboard>
        <DCArtboard id="home-dark" label="02 · Início (dark)" width={360} height={720}>
          <HomeScreen dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="chat-dark" title="Atendimento automático · Dark" subtitle="Chat no esquema escuro do WhatsApp — bolhas em #202c33 e #005c4b">
        <DCArtboard id="chat-dark-1" label="03 · Conversa com agente (dark)" width={360} height={720}>
          <ChatScreen dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="catalog-dark" title="Catálogo & Pedido · Dark">
        <DCArtboard id="catalog-list-dark" label="04 · Catálogo (dark)" width={360} height={720}>
          <CatalogScreen dark/>
        </DCArtboard>
        <DCArtboard id="product-detail-dark" label="05 · Produto (dark)" width={360} height={720}>
          <ProductDetailScreen dark/>
        </DCArtboard>
      </DCSection>

      <DCSection id="orders-dark" title="Pedidos & Conta · Dark">
        <DCArtboard id="orders-list-dark" label="06 · Pedidos (dark)" width={360} height={720}>
          <OrdersScreen dark/>
        </DCArtboard>
        <DCArtboard id="tracking-dark" label="07 · Rastreio (dark)" width={360} height={720}>
          <TrackingScreen dark/>
        </DCArtboard>
        <DCArtboard id="account-dark" label="08 · Conta (dark)" width={360} height={720}>
          <AccountScreen dark/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
