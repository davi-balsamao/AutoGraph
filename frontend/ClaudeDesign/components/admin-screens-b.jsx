/* Autograph Admin — Screens B: Pedidos, Financeiro, Catálogo, Usuários */

// ============== 04 HISTÓRICO DE PEDIDOS ==============
function AdminOrders() {
  const rows = [
    { id: "A-2847", client: "Mariana Costa", product: "1.000 panfletos A5", tag: "panfleto", date: "12/05 14:34", value: "R$ 189,00", status: "Em produção", color: "orange", payment: "Pix", channel: "Agente" },
    { id: "A-2845", client: "Padaria Estrela", product: "200 panfletos A5", tag: "panfleto", date: "12/05 11:12", value: "R$ 59,00", status: "Aprovado", color: "blue", payment: "Pix", channel: "Agente" },
    { id: "A-2843", client: "Studio Norte", product: "Banner oxford 1×2m", tag: "banner", date: "12/05 09:48", value: "R$ 168,00", status: "Em produção", color: "orange", payment: "Cartão 3×", channel: "Agente" },
    { id: "A-2841", client: "Clínica Anna", product: "Apostila A4 · 30 un.", tag: "apostila", date: "11/05 17:20", value: "R$ 540,00", status: "Em produção", color: "orange", payment: "Pix", channel: "Humano" },
    { id: "A-2839", client: "Mercado Ponto", product: "Bloco numerado 2 vias", tag: "bloco", date: "11/05 14:02", value: "R$ 144,00", status: "Em revisão", color: "purple", payment: "Boleto", channel: "Agente" },
    { id: "A-2834", client: "Café Trilho", product: "300 panfletos A6", tag: "panfleto", date: "11/05 10:18", value: "R$ 79,00", status: "Entregue", color: "soft", payment: "Pix", channel: "Agente" },
    { id: "A-2830", client: "Padaria Estrela", product: "Banner 80×120cm", tag: "banner", date: "10/05 15:55", value: "R$ 89,00", status: "Entregue", color: "soft", payment: "Cartão 6×", channel: "Agente" },
    { id: "A-2828", client: "Colégio Vértice", product: "Apostila 80pg · 100 un.", tag: "apostila", date: "10/05 11:40", value: "R$ 1.840,00", status: "Entregue", color: "soft", payment: "Pix", channel: "Humano" },
    { id: "A-2824", client: "Studio Norte", product: "Bloco recibo 1 via", tag: "bloco", date: "09/05 16:30", value: "R$ 96,00", status: "Cancelado", color: "danger", payment: "—", channel: "Agente" },
    { id: "A-2820", client: "Eventos Lume", product: "Banner LED 2×1m", tag: "banner", date: "09/05 09:22", value: "R$ 1.240,00", status: "Entregue", color: "soft", payment: "Cartão 6×", channel: "Humano" },
  ];

  const tagColors = { panfleto: "soft", banner: "orange", bloco: "purple", apostila: "blue" };

  return (
    <AdminShell
      active="orders"
      topBar={
        <AdminTopBar
          breadcrumb="Operação"
          title="Histórico de pedidos"
          subtitle="847 pedidos em 2025 · R$ 124.380 em vendas acumuladas"
          actions={
            <>
              <AdminBtn variant="secondary" icon={<DownloadIcon/>}>Exportar CSV</AdminBtn>
              <AdminBtn variant="primary" icon={<PlusIcon/>}>Lançar pedido</AdminBtn>
            </>
          }
        />
      }
    >
      <div style={{ padding: 28 }}>
        {/* Mini KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <MiniStat label="Pedidos mês" value="187" footnote="↑ 24 vs. abril" />
          <MiniStat label="Receita mês" value="R$ 28.140" footnote="↑ R$ 3.200 vs. abril" />
          <MiniStat label="Ticket médio" value="R$ 150" footnote="estável" />
          <MiniStat label="Taxa de cancelamento" value="1,2%" footnote="2 cancelados" warn />
        </div>

        {/* Filters bar */}
        <div style={{
          display: "flex", gap: 10, padding: "12px 14px",
          background: "#fff", border: `1px solid ${ADMIN.hairline}`,
          borderRadius: 12, marginBottom: 14, alignItems: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 12px", border: `1px solid ${ADMIN.hairlineStrong}`,
            borderRadius: 9999, fontSize: 12, color: ADMIN.steel,
            background: ADMIN.surface, flex: 1, maxWidth: 320,
          }}>
            <SearchIcon/>
            <span>Buscar #ID, cliente, produto…</span>
          </div>
          <FilterPill label="Período" value="Maio 2025"/>
          <FilterPill label="Status" value="Todos"/>
          <FilterPill label="Produto" value="Todos"/>
          <FilterPill label="Canal" value="Todos"/>
          <div style={{ flex: 1 }}/>
          <AdminBtn variant="ghost" size="sm" icon={<FilterIcon/>}>Limpar filtros</AdminBtn>
        </div>

        {/* Table */}
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: ADMIN.surface }}>
                {["sel", "Pedido", "Cliente", "Produto", "Data", "Pagamento", "Canal", "Valor", "Status", "actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 14px", textAlign: "left",
                    fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase",
                    color: ADMIN.steel,
                    borderBottom: `1px solid ${ADMIN.hairline}`,
                  }}>{h === "sel" || h === "actions" ? "" : h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${ADMIN.hairlineSoft}` }}>
                  <td style={{ padding: "10px 14px" }}>
                    <input type="checkbox" style={{ accentColor: ADMIN.green }}/>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: ADMIN.mono, fontWeight: 600, color: ADMIN.greenDark }}>#{r.id}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 9999, background: ADMIN.surfaceSoft, color: ADMIN.greenDark,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700,
                      }}>{r.client.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                      <span style={{ fontWeight: 500 }}>{r.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AdminBadge color={tagColors[r.tag]}>{r.tag}</AdminBadge>
                      <span style={{ color: ADMIN.charcoal }}>{r.product}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: ADMIN.steel, fontFamily: ADMIN.mono, fontSize: 11 }}>{r.date}</td>
                  <td style={{ padding: "10px 14px", color: ADMIN.charcoal }}>{r.payment}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
                      background: r.channel === "Agente" ? "rgba(0,237,100,.12)" : "rgba(123,63,242,.12)",
                      color: r.channel === "Agente" ? ADMIN.greenDark : ADMIN.accentPurple,
                    }}>{r.channel === "Agente" ? "🤖 " : "👤 "}{r.channel}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.value}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <AdminBadge color={r.color}>{r.status}</AdminBadge>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button style={{ background: "transparent", border: 0, color: ADMIN.steel, padding: 4, cursor: "pointer" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${ADMIN.hairline}`, fontSize: 12, color: ADMIN.steel }}>
            <span>Exibindo 1–10 de 847 pedidos</span>
            <div style={{ display: "flex", gap: 6 }}>
              <PgBtn>‹</PgBtn>
              <PgBtn active>1</PgBtn>
              <PgBtn>2</PgBtn>
              <PgBtn>3</PgBtn>
              <span style={{ padding: "0 4px" }}>…</span>
              <PgBtn>85</PgBtn>
              <PgBtn>›</PgBtn>
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function MiniStat({ label, value, footnote, warn }) {
  return (
    <Card padding={14}>
      <div style={{ fontSize: 10, fontWeight: 600, color: ADMIN.steel, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: warn ? ADMIN.accentOrange : ADMIN.greenDark, fontWeight: 500, marginTop: 4 }}>{footnote}</div>
    </Card>
  );
}

function FilterPill({ label, value }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", border: `1px solid ${ADMIN.hairline}`, borderRadius: 9999,
      fontSize: 12, color: ADMIN.charcoal, background: "#fff",
    }}>
      <span style={{ color: ADMIN.steel }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6"/></svg>
    </div>
  );
}

function PgBtn({ children, active }) {
  return (
    <button style={{
      width: 28, height: 28, borderRadius: 6,
      background: active ? ADMIN.ink : "#fff",
      color: active ? "#fff" : ADMIN.charcoal,
      border: `1px solid ${active ? ADMIN.ink : ADMIN.hairline}`,
      fontSize: 11, fontWeight: 600, cursor: "pointer",
    }}>{children}</button>
  );
}

// ============== 05 FINANCEIRO ==============
function AdminFinance() {
  return (
    <AdminShell
      active="finance"
      topBar={
        <AdminTopBar
          breadcrumb="Gestão"
          title="Financeiro"
          subtitle="Visão consolidada de receita, custos e fluxo de caixa"
          actions={
            <>
              <FilterPill label="Período" value="Maio 2025"/>
              <AdminBtn variant="secondary" icon={<DownloadIcon/>}>Relatório PDF</AdminBtn>
              <AdminBtn variant="primary">Conciliar Pix</AdminBtn>
            </>
          }
        />
      }
    >
      <div style={{ padding: 28 }}>
        {/* Hero financial */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card padding={0} style={{ background: ADMIN.tealDeep, color: "#fff", border: "none", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(300px 200px at 100% 0%, rgba(0,237,100,.18), transparent 70%)" }}/>
            <div style={{ position: "relative", padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ADMIN.green, letterSpacing: 1 }}>RECEITA NO MÊS</div>
              <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1, marginTop: 6 }}>R$ 28.140<span style={{ fontSize: 16, color: ADMIN.muted, fontWeight: 500 }}>,40</span></div>
              <div style={{ fontSize: 12, color: ADMIN.muted, marginTop: 4 }}>↑ 12,8% vs. abril · R$ 24.940</div>
              <div style={{ marginTop: 14, display: "flex", gap: 18 }}>
                <span style={{ fontSize: 12, color: ADMIN.muted }}>📥 Recebido <b style={{ color: ADMIN.green }}>R$ 24.310</b></span>
                <span style={{ fontSize: 12, color: ADMIN.muted }}>⏳ A receber <b style={{ color: "#fff" }}>R$ 3.830</b></span>
              </div>
            </div>
          </Card>
          <Card padding={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: ADMIN.steel, letterSpacing: 0.5, textTransform: "uppercase" }}>Custos do mês</div>
            <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>R$ 9.840</div>
            <div style={{ fontSize: 11, color: ADMIN.steel, marginTop: 6 }}>
              <div>Papel/insumos · R$ 5.420</div>
              <div>Logística · R$ 1.840</div>
              <div>Operacional · R$ 2.580</div>
            </div>
          </Card>
          <Card padding={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: ADMIN.steel, letterSpacing: 0.5, textTransform: "uppercase" }}>Margem líquida</div>
            <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6, color: ADMIN.greenDark }}>65,0%</div>
            <div style={{ height: 8, background: ADMIN.surfaceSoft, borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "65%", background: ADMIN.green }}/>
            </div>
            <div style={{ fontSize: 11, color: ADMIN.steel, marginTop: 6 }}>R$ 18.300 lucro · meta 60%</div>
          </Card>
        </div>

        {/* Chart + payment methods */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card padding={0}>
            <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Fluxo de caixa</div>
                <div style={{ fontSize: 11, color: ADMIN.steel, marginTop: 2 }}>Receita × custos · últimos 6 meses</div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: ADMIN.steel }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: ADMIN.green, marginRight: 4 }}/>Receita</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: ADMIN.accentOrange, marginRight: 4 }}/>Custos</span>
                <span><span style={{ display: "inline-block", width: 12, height: 2, background: ADMIN.tealDeep, marginRight: 4, verticalAlign: "middle" }}/>Lucro</span>
              </div>
            </div>
            <CashFlowChart/>
          </Card>

          <Card>
            <SectionHeading title="Por método" subtitle="% das transações"/>
            {[
              { name: "Pix", value: 62, color: ADMIN.green, amount: "R$ 17.450" },
              { name: "Cartão crédito", value: 28, color: ADMIN.accentBlue, amount: "R$ 7.880" },
              { name: "Boleto", value: 8, color: ADMIN.accentOrange, amount: "R$ 2.250" },
              { name: "Dinheiro", value: 2, color: ADMIN.stone, amount: "R$ 560" },
            ].map(m => (
              <div key={m.name} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: m.color }}/>
                    <span>{m.name}</span>
                  </span>
                  <span><b>{m.amount}</b> <span style={{ color: ADMIN.steel }}>· {m.value}%</span></span>
                </div>
                <div style={{ height: 6, background: ADMIN.surfaceSoft, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.value}%`, background: m.color }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Transactions */}
        <Card padding={0}>
          <div style={{ padding: "18px 20px 12px", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Últimas transações</div>
              <div style={{ fontSize: 11, color: ADMIN.steel, marginTop: 2 }}>Pagamentos confirmados nas últimas 48h</div>
            </div>
            <a style={{ fontSize: 12, color: ADMIN.greenDark, fontWeight: 600 }}>Ver todas →</a>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: ADMIN.surface }}>
                {["Data", "Pedido", "Cliente", "Método", "Tipo", "Valor"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: ADMIN.steel, borderBottom: `1px solid ${ADMIN.hairline}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { d: "hoje 14:42", id: "A-2847", c: "Mariana Costa", m: "Pix", t: "entrada", v: "+R$ 189,00" },
                { d: "hoje 12:18", id: "A-2845", c: "Padaria Estrela", m: "Pix", t: "entrada", v: "+R$ 59,00" },
                { d: "hoje 10:55", id: "—", c: "Papelaria Norte (insumos)", m: "Boleto", t: "saída", v: "−R$ 1.840,00" },
                { d: "ontem 16:30", id: "A-2843", c: "Studio Norte", m: "Cartão 3×", t: "entrada", v: "+R$ 168,00" },
                { d: "ontem 11:08", id: "A-2841", c: "Clínica Anna", m: "Pix", t: "entrada", v: "+R$ 540,00" },
                { d: "ontem 09:22", id: "—", c: "Motoboy maio", m: "Pix", t: "saída", v: "−R$ 480,00" },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${ADMIN.hairlineSoft}` }}>
                  <td style={{ padding: "10px 14px", color: ADMIN.steel, fontFamily: ADMIN.mono, fontSize: 11 }}>{r.d}</td>
                  <td style={{ padding: "10px 14px", fontFamily: ADMIN.mono, fontWeight: 600, color: r.id === "—" ? ADMIN.muted : ADMIN.greenDark }}>{r.id === "—" ? "—" : `#${r.id}`}</td>
                  <td style={{ padding: "10px 14px" }}>{r.c}</td>
                  <td style={{ padding: "10px 14px", color: ADMIN.charcoal }}>{r.m}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <AdminBadge color={r.t === "entrada" ? "soft" : "warning"}>{r.t === "entrada" ? "↓ Entrada" : "↑ Saída"}</AdminBadge>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: r.t === "entrada" ? ADMIN.greenDark : ADMIN.accentOrange }}>{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}

function CashFlowChart() {
  const months = ["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"];
  const receita = [18, 21, 19, 24, 25, 28];
  const custos = [8, 9, 8, 10, 9, 9.8];
  const max = 32;
  return (
    <div style={{ padding: "20px 20px 16px", height: 220, display: "flex", alignItems: "end", gap: 24 }}>
      {months.map((m, i) => (
        <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "end", justifyContent: "center", gap: 4 }}>
            <div style={{
              width: "40%", height: `${(receita[i] / max) * 100}%`,
              background: ADMIN.green, borderRadius: "4px 4px 0 0", position: "relative",
            }}>
              <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-4px)", fontSize: 9, color: ADMIN.steel, whiteSpace: "nowrap" }}>R$ {receita[i]}k</div>
            </div>
            <div style={{
              width: "40%", height: `${(custos[i] / max) * 100}%`,
              background: ADMIN.accentOrange, borderRadius: "4px 4px 0 0",
            }}/>
          </div>
          <div style={{ fontSize: 10, color: ADMIN.steel, fontWeight: 500 }}>{m}</div>
        </div>
      ))}
    </div>
  );
}

// ============== 06 CATÁLOGO DE PRODUTOS ==============
function AdminCatalog() {
  const products = [
    { kind: "panfleto", name: "Panfleto A6", sku: "PNF-A6-115", price: "R$ 0,06", cost: "R$ 0,021", minQty: 250, deadline: "24h", active: true, sales: 142, tag: "soft" },
    { kind: "panfleto", name: "Panfleto A5", sku: "PNF-A5-115", price: "R$ 0,12", cost: "R$ 0,038", minQty: 250, deadline: "24h", active: true, sales: 284, tag: "soft" },
    { kind: "panfleto", name: "Panfleto A4", sku: "PNF-A4-115", price: "R$ 0,24", cost: "R$ 0,082", minQty: 100, deadline: "48h", active: true, sales: 96, tag: "soft" },
    { kind: "banner", name: "Banner lona 440g", sku: "BNR-LN-440", price: "R$ 49,00/m²", cost: "R$ 18,40/m²", minQty: 1, deadline: "24h", active: true, sales: 64, tag: "orange" },
    { kind: "banner", name: "Banner oxford", sku: "BNR-OX", price: "R$ 79,00/m²", cost: "R$ 28,10/m²", minQty: 1, deadline: "48h", active: true, sales: 22, tag: "orange" },
    { kind: "bloco", name: "Bloco 50 fls · 1 via", sku: "BLC-50-1V", price: "R$ 12,00", cost: "R$ 3,80", minQty: 10, deadline: "48h", active: true, sales: 38, tag: "purple" },
    { kind: "bloco", name: "Bloco 50 fls · 2 vias", sku: "BLC-50-2V", price: "R$ 18,00", cost: "R$ 5,90", minQty: 10, deadline: "72h", active: true, sales: 24, tag: "purple" },
    { kind: "apostila", name: "Apostila 32pg espiral", sku: "APO-32-ESP", price: "R$ 12,00", cost: "R$ 4,20", minQty: 10, deadline: "72h", active: true, sales: 18, tag: "blue" },
    { kind: "apostila", name: "Apostila 64pg wire-o", sku: "APO-64-WO", price: "R$ 18,00", cost: "R$ 6,80", minQty: 10, deadline: "5d", active: true, sales: 32, tag: "blue" },
    { kind: "apostila", name: "Apostila 120pg costurada", sku: "APO-120-CO", price: "R$ 34,00", cost: "R$ 12,40", minQty: 20, deadline: "5d", active: false, sales: 4, tag: "blue" },
  ];

  return (
    <AdminShell
      active="catalog"
      topBar={
        <AdminTopBar
          breadcrumb="Catálogo"
          title="Produtos"
          subtitle="10 SKUs ativos · margem média 68% · agente usa essa tabela em todos os orçamentos"
          actions={
            <>
              <AdminBtn variant="secondary" icon={<DownloadIcon/>}>Importar tabela</AdminBtn>
              <AdminBtn variant="primary" icon={<PlusIcon/>}>Novo produto</AdminBtn>
            </>
          }
        />
      }
    >
      <div style={{ padding: 28 }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          {[
            { l: "Todos", n: 10, c: ADMIN.ink, active: true },
            { l: "Panfletos", n: 3, c: ADMIN.greenMid },
            { l: "Banners", n: 2, c: ADMIN.accentOrange },
            { l: "Blocos", n: 2, c: ADMIN.accentPurple },
            { l: "Apostilas", n: 3, c: ADMIN.accentBlue },
          ].map(p => (
            <div key={p.l} style={{
              padding: "8px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
              background: p.active ? ADMIN.ink : "#fff",
              color: p.active ? "#fff" : ADMIN.charcoal,
              border: p.active ? `1px solid ${ADMIN.ink}` : `1px solid ${ADMIN.hairline}`,
              display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: p.c }}/>
              {p.l}
              <span style={{ background: p.active ? "rgba(255,255,255,.15)" : ADMIN.surfaceSoft, padding: "1px 6px", borderRadius: 9999, fontSize: 10 }}>{p.n}</span>
            </div>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 12, color: ADMIN.steel }}>Visualizar:</div>
          <div style={{ display: "flex", border: `1px solid ${ADMIN.hairline}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: 8, background: ADMIN.surfaceSoft, color: ADMIN.ink }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </div>
            <div style={{ padding: 8, color: ADMIN.steel }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </div>
          </div>
        </div>

        {/* Products table */}
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: ADMIN.surface }}>
                {["Produto", "SKU", "Preço venda", "Custo", "Margem", "Pedido min.", "Prazo", "Vendas mês", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: ADMIN.steel, borderBottom: `1px solid ${ADMIN.hairline}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const numPrice = parseFloat(p.price.replace(/[^\d,]/g, "").replace(",", "."));
                const numCost = parseFloat(p.cost.replace(/[^\d,]/g, "").replace(",", "."));
                const margin = Math.round(((numPrice - numCost) / numPrice) * 100);
                return (
                  <tr key={p.sku} style={{ borderBottom: `1px solid ${ADMIN.hairlineSoft}`, opacity: p.active ? 1 : 0.55 }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, height: 30, borderRadius: 6, overflow: "hidden", border: `1px solid ${ADMIN.hairline}`, flexShrink: 0 }}>
                          <ProductGlyph kind={p.kind} size={56}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                          <AdminBadge color={p.tag}>{p.kind}</AdminBadge>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: ADMIN.mono, color: ADMIN.steel, fontSize: 11 }}>{p.sku}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.price}</td>
                    <td style={{ padding: "10px 14px", color: ADMIN.steel }}>{p.cost}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 600, color: margin >= 65 ? ADMIN.greenDark : margin >= 55 ? ADMIN.accentOrange : ADMIN.danger }}>{margin}%</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: ADMIN.charcoal }}>{p.minQty}</td>
                    <td style={{ padding: "10px 14px", color: ADMIN.charcoal }}>{p.deadline}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{p.sales}</span>
                        <div style={{ width: 50, height: 4, background: ADMIN.surfaceSoft, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (p.sales / 3))}%`, background: ADMIN.green }}/>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Toggle on={p.active}/>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button style={{ background: "transparent", border: 0, color: ADMIN.steel, padding: 4, cursor: "pointer" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 32, height: 18, borderRadius: 9999,
      background: on ? ADMIN.green : ADMIN.hairlineStrong,
      position: "relative", display: "inline-block",
    }}>
      <div style={{
        position: "absolute", top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: 9999, background: "#fff",
        boxShadow: "0 1px 2px rgba(0,30,43,.2)",
        transition: "left 150ms ease",
      }}/>
    </div>
  );
}

// ============== 07 USUÁRIOS ==============
function AdminUsers() {
  const users = [
    { name: "Mariana Costa", company: "Dezembro Studio", phone: "+55 11 9 8421-3344", joined: "mar/2025", orders: 13, ltv: "R$ 2.450", status: "active", segment: "VIP", lastOrder: "12/05" },
    { name: "Eventos Lume", company: "Lume Produções", phone: "+55 11 9 7203-8819", joined: "fev/2025", orders: 24, ltv: "R$ 18.940", status: "active", segment: "VIP", lastOrder: "11/05" },
    { name: "Studio Norte", company: "—", phone: "+55 11 9 4188-2208", joined: "abr/2025", orders: 8, ltv: "R$ 1.840", status: "active", segment: "Regular", lastOrder: "12/05" },
    { name: "Clínica Anna", company: "Dra. Anna Mello", phone: "+55 11 9 3422-7891", joined: "jan/2025", orders: 11, ltv: "R$ 3.220", status: "active", segment: "Regular", lastOrder: "11/05" },
    { name: "Café Trilho", company: "Trilho Cafés Ltda", phone: "+55 11 9 9018-4732", joined: "mar/2025", orders: 19, ltv: "R$ 1.480", status: "active", segment: "Frequente", lastOrder: "11/05" },
    { name: "Padaria Estrela", company: "Estrela Padaria", phone: "+55 11 9 6234-1175", joined: "fev/2025", orders: 32, ltv: "R$ 2.180", status: "active", segment: "Frequente", lastOrder: "12/05" },
    { name: "Mercado Ponto", company: "Ponto Mercado", phone: "+55 11 9 7711-3098", joined: "jan/2025", orders: 6, ltv: "R$ 980", status: "active", segment: "Regular", lastOrder: "11/05" },
    { name: "Colégio Vértice", company: "Vértice Educação", phone: "+55 11 9 5520-8821", joined: "out/2024", orders: 14, ltv: "R$ 12.430", status: "active", segment: "VIP", lastOrder: "10/05" },
    { name: "João Almeida", company: "—", phone: "+55 11 9 8800-1234", joined: "mai/2025", orders: 1, ltv: "R$ 89", status: "new", segment: "Novo", lastOrder: "09/05" },
    { name: "Ana Vieira", company: "—", phone: "+55 11 9 4422-1188", joined: "fev/2025", orders: 0, ltv: "R$ 0", status: "inactive", segment: "Inativo", lastOrder: "—" },
  ];

  const segColors = { VIP: "purple", Frequente: "soft", Regular: "blue", Novo: "orange", Inativo: "gray" };

  return (
    <AdminShell
      active="users"
      topBar={
        <AdminTopBar
          breadcrumb="Clientes"
          title="Usuários"
          subtitle="287 clientes cadastrados · 96% engajamento no agente"
          actions={
            <>
              <AdminBtn variant="secondary" icon={<DownloadIcon/>}>Exportar lista</AdminBtn>
              <AdminBtn variant="primary" icon={<PlusIcon/>}>Novo cliente</AdminBtn>
            </>
          }
        />
      }
    >
      <div style={{ padding: 28 }}>
        {/* Segment stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { l: "Total", n: 287, c: ADMIN.ink, sub: "+24 no mês" },
            { l: "VIP (>R$ 5k)", n: 18, c: ADMIN.accentPurple, sub: "↑ 2 vs. abril" },
            { l: "Frequentes", n: 64, c: ADMIN.greenMid, sub: "↑ 8 vs. abril" },
            { l: "Novos no mês", n: 24, c: ADMIN.accentOrange, sub: "primeira compra" },
            { l: "Inativos 60d+", n: 41, c: ADMIN.stone, sub: "considerar reativar", warn: true },
          ].map(s => (
            <Card padding={14} key={s.l}>
              <div style={{ fontSize: 10, fontWeight: 600, color: ADMIN.steel, letterSpacing: 0.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: s.c }}/>
                {s.l}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: s.warn ? ADMIN.accentOrange : ADMIN.steel, marginTop: 2 }}>{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", border: `1px solid ${ADMIN.hairlineStrong}`,
            borderRadius: 9999, fontSize: 13, color: ADMIN.steel,
            background: "#fff", flex: 1, maxWidth: 360,
          }}>
            <SearchIcon/>
            <span>Buscar por nome, telefone, e-mail ou empresa…</span>
          </div>
          <FilterPill label="Segmento" value="Todos"/>
          <FilterPill label="Status" value="Ativo"/>
          <FilterPill label="Ordenar" value="LTV (maior)"/>
        </div>

        {/* Users table */}
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: ADMIN.surface }}>
                {["Cliente", "Contato", "Cadastro", "Pedidos", "LTV", "Último pedido", "Segmento", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: ADMIN.steel, borderBottom: `1px solid ${ADMIN.hairline}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.name} style={{ borderBottom: `1px solid ${ADMIN.hairlineSoft}` }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9999,
                        background: u.segment === "VIP" ? "#f1e7ff" : ADMIN.surfaceSoft,
                        color: u.segment === "VIP" ? ADMIN.accentPurple : ADMIN.greenDark,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                      }}>{u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: ADMIN.steel }}>{u.company === "—" ? "Pessoa física" : u.company}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: ADMIN.mono, fontSize: 11, color: ADMIN.charcoal }}>{u.phone}</td>
                  <td style={{ padding: "12px 14px", color: ADMIN.steel }}>{u.joined}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{u.orders}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: ADMIN.greenDark }}>{u.ltv}</td>
                  <td style={{ padding: "12px 14px", color: ADMIN.charcoal }}>{u.lastOrder}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <AdminBadge color={segColors[u.segment]}>{u.segment}</AdminBadge>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
                      color: u.status === "active" ? ADMIN.greenDark : u.status === "new" ? ADMIN.accentOrange : ADMIN.stone,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: u.status === "active" ? ADMIN.green : u.status === "new" ? ADMIN.accentOrange : ADMIN.muted,
                      }}/>
                      {u.status === "active" ? "Ativo" : u.status === "new" ? "Novo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 4 }}>
                      <button style={{ width: 28, height: 28, borderRadius: 9999, background: ADMIN.surface, border: `1px solid ${ADMIN.hairline}`, color: ADMIN.greenDark, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 .5C5.4.5 0 5.9 0 12.5c0 2.2.6 4.3 1.7 6.1L0 24l5.5-1.7c1.8 1 3.9 1.5 6 1.5h.5c6.6 0 12-5.4 12-12s-5.4-12-12-12z"/></svg>
                      </button>
                      <button style={{ width: 28, height: 28, borderRadius: 9999, background: "transparent", border: 0, color: ADMIN.steel, cursor: "pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { AdminOrders, AdminFinance, AdminCatalog, AdminUsers });
