/* Autograph Admin — Main canvas. 7 screens, each wrapped in a browser window. */

function AdminScreen({ url, title, children }) {
  return (
    <ChromeWindow
      tabs={[{ title }]}
      activeIndex={0}
      url={url}
      width={1280}
      height={780}
    >
      {children}
    </ChromeWindow>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="admin-auth" title="Autenticação · Desktop" subtitle="Login do gerente no painel web">
        <DCArtboard id="admin-login-desktop" label="00 · Login admin" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/login" title="Autograph Admin · Login">
            <AdminLoginScreen/>
          </AdminScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-overview" title="Painel admin — Visão geral" subtitle="Dashboard inicial do gerente da gráfica">
        <DCArtboard id="dashboard" label="01 · Dashboard" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/dashboard" title="Autograph Admin · Visão geral">
            <AdminDashboard/>
          </AdminScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-operation" title="Operação" subtitle="Kanban de ordens de serviço + atendimento ao cliente">
        <DCArtboard id="kanban" label="02 · Kanban OS" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/ordens" title="Autograph Admin · Ordens de serviço">
            <AdminKanban/>
          </AdminScreen>
        </DCArtboard>
        <DCArtboard id="chat" label="03 · Atendimento" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/atendimento" title="Autograph Admin · Atendimento">
            <AdminChat/>
          </AdminScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-records" title="Pedidos & Financeiro" subtitle="Histórico de transações e visão de receita">
        <DCArtboard id="orders" label="04 · Histórico de pedidos" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/pedidos" title="Autograph Admin · Pedidos">
            <AdminOrders/>
          </AdminScreen>
        </DCArtboard>
        <DCArtboard id="finance" label="05 · Financeiro" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/financeiro" title="Autograph Admin · Financeiro">
            <AdminFinance/>
          </AdminScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="admin-catalog-users" title="Catálogo & Usuários" subtitle="Cadastros do agente: produtos que ele cota e clientes da base">
        <DCArtboard id="catalog" label="06 · Catálogo" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/catalogo" title="Autograph Admin · Catálogo">
            <AdminCatalog/>
          </AdminScreen>
        </DCArtboard>
        <DCArtboard id="users" label="07 · Usuários" width={1280} height={820}>
          <AdminScreen url="admin.autograph.com.br/usuarios" title="Autograph Admin · Usuários">
            <AdminUsers/>
          </AdminScreen>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
