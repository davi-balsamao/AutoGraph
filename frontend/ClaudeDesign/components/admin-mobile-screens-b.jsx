/* Autograph Admin Mobile — Screens B: Pedidos, Financeiro, Catálogo, Usuários */

// ============== 04 HISTÓRICO DE PEDIDOS (MOBILE) ==============
function AdmMobileOrders({ dark = false }) {
  const T = theme(dark);
  const rows = [
    { id: "A-2847", client: "Mariana Costa", product: "1.000 panfletos A5", tag: "panfleto", date: "12/05 14:34", value: "R$ 189,00", status: "Em produção", color: "orange", channel: "agente" },
    { id: "A-2845", client: "Padaria Estrela", product: "200 panfletos A5", tag: "panfleto", date: "12/05 11:12", value: "R$ 59,00", status: "Aprovado", color: "blue", channel: "agente" },
    { id: "A-2843", client: "Studio Norte", product: "Banner 1×2m", tag: "banner", date: "12/05 09:48", value: "R$ 168,00", status: "Em produção", color: "orange", channel: "agente" },
    { id: "A-2841", client: "Clínica Anna", product: "Apostila A4 · 30 un.", tag: "apostila", date: "11/05 17:20", value: "R$ 540,00", status: "Em produção", color: "orange", channel: "humano" },
    { id: "A-2839", client: "Mercado Ponto", product: "Bloco numerado", tag: "bloco", date: "11/05 14:02", value: "R$ 144,00", status: "Em revisão", color: "purple", channel: "agente" },
    { id: "A-2834", client: "Café Trilho", product: "300 panfletos A6", tag: "panfleto", date: "11/05 10:18", value: "R$ 79,00", status: "Entregue", color: "soft", channel: "agente" },
    { id: "A-2830", client: "Padaria Estrela", product: "Banner 80×120", tag: "banner", date: "10/05 15:55", value: "R$ 89,00", status: "Entregue", color: "soft", channel: "agente" },
    { id: "A-2828", client: "Colégio Vértice", product: "Apostila 80pg · 100un", tag: "apostila", date: "10/05 11:40", value: "R$ 1.840,00", status: "Entregue", color: "soft", channel: "humano" },
  ];
  const tagColors = { panfleto: "soft", banner: "orange", bloco: "purple", apostila: "blue" };

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AdminMobileHeader
          title="Pedidos"
          subtitle="847 em 2025 · R$ 124.380 totais"
          dark={dark}
          actions={
            <button style={{
              width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
            </button>
          }
        />

        {/* Mini KPIs horizontal */}
        <div style={{ padding: "12px 16px 0", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0 }}>
          {[
            { l: "Pedidos mês", v: "187", d: "↑ 24" },
            { l: "Receita mês", v: "R$ 28,1k", d: "↑ R$ 3,2k" },
            { l: "Ticket médio", v: "R$ 150", d: "estável" },
            { l: "Cancelados", v: "1,2%", d: "2 hoje", warn: true },
          ].map(k => (
            <div key={k.l} style={{
              flexShrink: 0, minWidth: 130,
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: 10,
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: T.text }}>{k.v}</div>
              <div style={{ fontSize: 10, color: k.warn ? ADM.accentOrange : (dark ? ADM.green : ADM.greenDark), fontWeight: 500, marginTop: 2 }}>{k.d}</div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div style={{ padding: "12px 16px 4px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
          {[
            { l: "Maio 2025", active: true },
            { l: "Status: todos" },
            { l: "Produto: todos" },
            { l: "Canal: todos" },
          ].map(p => (
            <div key={p.l} style={{
              fontSize: 11, fontWeight: 500,
              padding: "6px 12px", borderRadius: 9999,
              background: p.active ? (dark ? T.surfaceSoft : "#fff") : "transparent",
              color: T.text,
              border: `1px solid ${p.active ? T.borderStrong : T.border}`,
              whiteSpace: "nowrap", flexShrink: 0,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {p.l}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          ))}
        </div>

        {/* Cards list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 90px", display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(r => (
            <div key={r.id} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AdmTag color={tagColors[r.tag]}>{r.tag}</AdmTag>
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono }}>#{r.id}</span>
                </div>
                <AdmBadge color={r.color}>{r.status}</AdmBadge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{r.product}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 9999, background: T.surfaceSoft, color: dark ? ADM.green : ADM.greenDark,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700,
                }}>{r.client.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                <span style={{ fontSize: 11, color: T.textMuted, flex: 1 }}>{r.client}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  padding: "2px 6px", borderRadius: 9999,
                  background: r.channel === "agente" ? "rgba(0,237,100,.15)" : "rgba(123,63,242,.15)",
                  color: r.channel === "agente" ? (dark ? ADM.green : ADM.greenDark) : ADM.accentPurple,
                }}>{r.channel === "agente" ? "🤖" : "👤"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.borderSoft}` }}>
                <span style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono }}>{r.date}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{r.value}</span>
              </div>
            </div>
          ))}
        </div>

        <AdminTabBar active="orders" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

// ============== 05 FINANCEIRO (MOBILE) ==============
function AdmMobileFinance({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <AdminMobileHeader
          back
          title="Financeiro"
          subtitle="Maio 2025"
          dark={dark}
          actions={
            <button style={{
              width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
            </button>
          }
        />

        {/* Hero receita */}
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{
            background: dark ? "#001e2b" : ADM.tealDeep, color: "#fff",
            borderRadius: 16, padding: 18, position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(220px 120px at 100% 0%, rgba(0,237,100,.18), transparent 70%)" }}/>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: ADM.green, letterSpacing: 1 }}>RECEITA NO MÊS</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.8, marginTop: 4, lineHeight: 1 }}>
                R$ 28.140<span style={{ fontSize: 14, color: "#a8b3bc", fontWeight: 500 }}>,40</span>
              </div>
              <div style={{ fontSize: 11, color: "#a8b3bc", marginTop: 4 }}>↑ 12,8% vs. abril</div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11 }}>
                <div>
                  <div style={{ color: "#a8b3bc", marginBottom: 2 }}>📥 Recebido</div>
                  <div style={{ fontWeight: 700, color: ADM.green }}>R$ 24.310</div>
                </div>
                <div>
                  <div style={{ color: "#a8b3bc", marginBottom: 2 }}>⏳ A receber</div>
                  <div style={{ fontWeight: 700 }}>R$ 3.830</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Margem + custos */}
        <div style={{ padding: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <AdmCard dark={dark} padding={12}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Custos mês</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: T.text }}>R$ 9.840</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              <div>Insumos · R$ 5.420</div>
              <div>Logística · R$ 1.840</div>
            </div>
          </AdmCard>
          <AdmCard dark={dark} padding={12}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Margem líquida</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: dark ? ADM.green : ADM.greenDark }}>65,0%</div>
            <div style={{ height: 6, background: T.surfaceSoft, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "65%", background: ADM.green }}/>
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>R$ 18.300 lucro</div>
          </AdmCard>
        </div>

        {/* Chart */}
        <div style={{ padding: "16px 16px 0" }}>
          <AdmCard dark={dark} padding={14}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Fluxo de caixa</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Últimos 6 meses</div>
            <div style={{ padding: "14px 0 4px", height: 120, display: "flex", alignItems: "end", gap: 14 }}>
              {[
                ["Dez", 18, 8], ["Jan", 21, 9], ["Fev", 19, 8],
                ["Mar", 24, 10], ["Abr", 25, 9], ["Mai", 28, 9.8],
              ].map(([m, r, c], i) => (
                <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "end", justifyContent: "center", gap: 3 }}>
                    <div style={{ width: "40%", height: `${(r / 32) * 100}%`, background: ADM.green, borderRadius: "3px 3px 0 0" }}/>
                    <div style={{ width: "40%", height: `${(c / 32) * 100}%`, background: ADM.accentOrange, borderRadius: "3px 3px 0 0" }}/>
                  </div>
                  <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 500 }}>{m}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.textMuted, marginTop: 8 }}>
              <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: ADM.green, marginRight: 4 }}/>Receita</span>
              <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: ADM.accentOrange, marginRight: 4 }}/>Custos</span>
            </div>
          </AdmCard>
        </div>

        {/* Métodos de pagamento */}
        <div style={{ padding: "16px 16px 0" }}>
          <AdmCard dark={dark} padding={14}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Por método</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, marginBottom: 10 }}>% das transações</div>
            {[
              { name: "Pix", v: 62, c: ADM.green, amount: "R$ 17.450" },
              { name: "Cartão crédito", v: 28, c: ADM.accentBlue, amount: "R$ 7.880" },
              { name: "Boleto", v: 8, c: ADM.accentOrange, amount: "R$ 2.250" },
              { name: "Dinheiro", v: 2, c: "#7c8c9a", amount: "R$ 560" },
            ].map(m => (
              <div key={m.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: T.text }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: m.c }}/>
                    {m.name}
                  </span>
                  <span><b>{m.amount}</b> <span style={{ color: T.textMuted }}>· {m.v}%</span></span>
                </div>
                <div style={{ height: 5, background: T.surfaceSoft, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.v}%`, background: m.c }}/>
                </div>
              </div>
            ))}
          </AdmCard>
        </div>

        {/* Recent transactions */}
        <div style={{ padding: "16px 16px 0", fontSize: 13, fontWeight: 600, color: T.text }}>Últimas transações</div>
        <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { d: "hoje 14:42", id: "A-2847", c: "Mariana Costa", m: "Pix", t: "entrada", v: "+R$ 189,00" },
            { d: "hoje 12:18", id: "A-2845", c: "Padaria Estrela", m: "Pix", t: "entrada", v: "+R$ 59,00" },
            { d: "hoje 10:55", id: "—", c: "Papelaria Norte", m: "Boleto", t: "saída", v: "−R$ 1.840,00" },
            { d: "ontem 16:30", id: "A-2843", c: "Studio Norte", m: "Cartão 3×", t: "entrada", v: "+R$ 168,00" },
          ].map((r, i) => (
            <AdmCard key={i} dark={dark} padding={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9999,
                  background: r.t === "entrada" ? (dark ? "rgba(0,237,100,.18)" : ADM.greenSoft) : (dark ? "rgba(250,110,57,.18)" : "#fff4ed"),
                  color: r.t === "entrada" ? (dark ? ADM.green : ADM.greenDark) : ADM.accentOrange,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontSize: 13, fontWeight: 700,
                }}>{r.t === "entrada" ? "↓" : "↑"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.c}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono, marginTop: 2 }}>{r.d} · {r.m} {r.id !== "—" && `· #${r.id}`}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.t === "entrada" ? (dark ? ADM.green : ADM.greenDark) : ADM.accentOrange }}>{r.v}</div>
              </div>
            </AdmCard>
          ))}
        </div>

        <AdminTabBar active="more" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

// ============== 06 CATÁLOGO (MOBILE) ==============
function AdmMobileCatalog({ dark = false }) {
  const T = theme(dark);
  const products = [
    { kind: "panfleto", name: "Panfleto A5", sku: "PNF-A5-115", price: "R$ 0,12", cost: "R$ 0,038", deadline: "24h", active: true, sales: 284, tag: "soft", margin: 68 },
    { kind: "panfleto", name: "Panfleto A6", sku: "PNF-A6-115", price: "R$ 0,06", cost: "R$ 0,021", deadline: "24h", active: true, sales: 142, tag: "soft", margin: 65 },
    { kind: "banner", name: "Banner lona 440g", sku: "BNR-LN-440", price: "R$ 49/m²", cost: "R$ 18,40/m²", deadline: "24h", active: true, sales: 64, tag: "orange", margin: 62 },
    { kind: "banner", name: "Banner oxford", sku: "BNR-OX", price: "R$ 79/m²", cost: "R$ 28,10/m²", deadline: "48h", active: true, sales: 22, tag: "orange", margin: 64 },
    { kind: "bloco", name: "Bloco 50fls · 1 via", sku: "BLC-50-1V", price: "R$ 12,00", cost: "R$ 3,80", deadline: "48h", active: true, sales: 38, tag: "purple", margin: 68 },
    { kind: "bloco", name: "Bloco 50fls · 2 vias", sku: "BLC-50-2V", price: "R$ 18,00", cost: "R$ 5,90", deadline: "72h", active: true, sales: 24, tag: "purple", margin: 67 },
    { kind: "apostila", name: "Apostila 64pg wire-o", sku: "APO-64-WO", price: "R$ 18,00", cost: "R$ 6,80", deadline: "5d", active: true, sales: 32, tag: "blue", margin: 62 },
    { kind: "apostila", name: "Apostila 120pg costurada", sku: "APO-120-CO", price: "R$ 34,00", cost: "R$ 12,40", deadline: "5d", active: false, sales: 4, tag: "blue", margin: 64 },
  ];

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AdminMobileHeader
          back
          title="Catálogo"
          subtitle="10 SKUs · margem média 68%"
          dark={dark}
          actions={
            <button style={{
              width: 36, height: 36, borderRadius: 9999, background: ADM.green, border: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ADM.tealDeep} strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          }
        />

        {/* Category filter */}
        <div style={{ padding: "10px 16px 8px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
          {[
            { l: "Todos", n: 10, c: T.text, active: true },
            { l: "Panfletos", n: 3, c: ADM.greenMid },
            { l: "Banners", n: 2, c: ADM.accentOrange },
            { l: "Blocos", n: 2, c: ADM.accentPurple },
            { l: "Apostilas", n: 3, c: ADM.accentBlue },
          ].map(p => (
            <div key={p.l} style={{
              padding: "6px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
              background: p.active ? (dark ? T.bgElevated : "#fff") : "transparent",
              color: T.text,
              border: `1px solid ${p.active ? T.borderStrong : T.border}`,
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: p.c }}/>
              {p.l}
              <span style={{ background: T.surfaceSoft, padding: "1px 5px", borderRadius: 9999, fontSize: 9, color: T.textMuted }}>{p.n}</span>
            </div>
          ))}
        </div>

        {/* Products list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 90px", display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map(p => (
            <div key={p.sku} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12, opacity: p.active ? 1 : 0.55,
              display: "flex", gap: 12,
            }}>
              <div style={{ width: 60, height: 50, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
                <ProductGlyph kind={p.kind} size={80} dark={dark}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <AdmTag color={p.tag}>{p.kind}</AdmTag>
                  <Toggle on={p.active}/>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 4 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono, marginTop: 2 }}>{p.sku} · {p.deadline}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.price}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    margem <b style={{ color: p.margin >= 65 ? (dark ? ADM.green : ADM.greenDark) : ADM.accentOrange }}>{p.margin}%</b>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    <b style={{ color: T.text }}>{p.sales}</b> vendas
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AdminTabBar active="more" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 30, height: 18, borderRadius: 9999,
      background: on ? ADM.green : "#c1ccd6",
      position: "relative", display: "inline-block", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2, left: on ? 14 : 2,
        width: 14, height: 14, borderRadius: 9999, background: "#fff",
        boxShadow: "0 1px 2px rgba(0,30,43,.2)",
      }}/>
    </div>
  );
}

// ============== 07 USUÁRIOS (MOBILE) ==============
function AdmMobileUsers({ dark = false }) {
  const T = theme(dark);
  const users = [
    { name: "Eventos Lume", company: "Lume Produções", phone: "+55 11 9 7203-8819", orders: 24, ltv: "R$ 18.940", status: "active", segment: "VIP" },
    { name: "Colégio Vértice", company: "Vértice Educação", phone: "+55 11 9 5520-8821", orders: 14, ltv: "R$ 12.430", status: "active", segment: "VIP" },
    { name: "Clínica Anna", company: "Dra. Anna Mello", phone: "+55 11 9 3422-7891", orders: 11, ltv: "R$ 3.220", status: "active", segment: "Regular" },
    { name: "Mariana Costa", company: "Dezembro Studio", phone: "+55 11 9 8421-3344", orders: 13, ltv: "R$ 2.450", status: "active", segment: "VIP" },
    { name: "Padaria Estrela", company: "Estrela Padaria", phone: "+55 11 9 6234-1175", orders: 32, ltv: "R$ 2.180", status: "active", segment: "Frequente" },
    { name: "Studio Norte", company: "—", phone: "+55 11 9 4188-2208", orders: 8, ltv: "R$ 1.840", status: "active", segment: "Regular" },
    { name: "Café Trilho", company: "Trilho Cafés", phone: "+55 11 9 9018-4732", orders: 19, ltv: "R$ 1.480", status: "active", segment: "Frequente" },
    { name: "João Almeida", company: "—", phone: "+55 11 9 8800-1234", orders: 1, ltv: "R$ 89", status: "new", segment: "Novo" },
    { name: "Ana Vieira", company: "—", phone: "+55 11 9 4422-1188", orders: 0, ltv: "R$ 0", status: "inactive", segment: "Inativo" },
  ];

  const segColors = { VIP: "purple", Frequente: "soft", Regular: "blue", Novo: "orange", Inativo: "gray" };

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AdminMobileHeader
          back
          title="Usuários"
          subtitle="287 cadastrados · 96% no agente"
          dark={dark}
          actions={
            <button style={{
              width: 36, height: 36, borderRadius: 9999, background: ADM.green, border: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ADM.tealDeep} strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          }
        />

        {/* Segment KPIs scroll */}
        <div style={{ padding: "10px 16px 0", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0 }}>
          {[
            { l: "Total", n: 287, c: T.text, sub: "+24 mês" },
            { l: "VIP", n: 18, c: ADM.accentPurple, sub: "↑ 2" },
            { l: "Frequentes", n: 64, c: ADM.greenMid, sub: "↑ 8" },
            { l: "Novos", n: 24, c: ADM.accentOrange, sub: "primeira compra" },
            { l: "Inativos", n: 41, c: "#7c8c9a", sub: "60d+", warn: true },
          ].map(s => (
            <div key={s.l} style={{
              flexShrink: 0, minWidth: 110,
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: 10,
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: s.c }}/>
                {s.l}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: T.text }}>{s.n}</div>
              <div style={{ fontSize: 10, color: s.warn ? ADM.accentOrange : T.textMuted, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px 4px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.surface, borderRadius: 10,
            border: `1px solid ${T.borderStrong}`,
            padding: "8px 12px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <span style={{ fontSize: 12, color: T.textMuted, flex: 1 }}>Buscar cliente, telefone…</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>Ordenar: LTV ↓</span>
          </div>
        </div>

        {/* Users list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 90px", display: "flex", flexDirection: "column", gap: 6 }}>
          {users.map(u => (
            <div key={u.name} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9999,
                background: u.segment === "VIP" ? (dark ? "rgba(123,63,242,.2)" : "#f1e7ff")
                  : u.segment === "Inativo" ? T.surfaceSoft
                  : T.surfaceSoft,
                color: u.segment === "VIP" ? ADM.accentPurple : (dark ? ADM.green : ADM.greenDark),
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                  <AdmBadge color={segColors[u.segment]}>{u.segment}</AdmBadge>
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{u.company === "—" ? "Pessoa física" : u.company}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono }}>{u.phone}</div>
                  <div style={{ fontSize: 11, color: T.text }}>
                    <b>{u.orders}</b> ped · <b style={{ color: dark ? ADM.green : ADM.greenDark }}>{u.ltv}</b>
                  </div>
                </div>
              </div>
              <button style={{
                width: 32, height: 32, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
                color: dark ? ADM.green : ADM.greenDark,
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 .5C5.4.5 0 5.9 0 12.5c0 2.2.6 4.3 1.7 6.1L0 24l5.5-1.7c1.8 1 3.9 1.5 6 1.5h.5c6.6 0 12-5.4 12-12s-5.4-12-12-12z"/></svg>
              </button>
            </div>
          ))}
        </div>

        <AdminTabBar active="more" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { AdmMobileOrders, AdmMobileFinance, AdmMobileCatalog, AdmMobileUsers });
