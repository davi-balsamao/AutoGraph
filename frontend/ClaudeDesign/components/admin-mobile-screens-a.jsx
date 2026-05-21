/* Autograph Admin Mobile — Screens A: Dashboard, Kanban OS, Chat */

// ============== 01 DASHBOARD ==============
function AdmMobileDashboard({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <GreetingBlock dark={dark}/>

        {/* Hero stat */}
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: dark ? "#001e2b" : ADM.tealDeep, color: "#fff",
            borderRadius: 16, padding: 16, position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(220px 120px at 100% 0%, rgba(0,237,100,.18), transparent 70%)",
            }}/>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: ADM.green, letterSpacing: 1 }}>RECEITA HOJE</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.8, marginTop: 4, lineHeight: 1 }}>
                R$ 2.840<span style={{ fontSize: 14, color: "#a8b3bc", fontWeight: 500 }}>,40</span>
              </div>
              <div style={{ fontSize: 11, color: "#a8b3bc", marginTop: 4 }}>↑ 18% vs. ontem · 24 pedidos</div>
              {/* Mini chart */}
              <div style={{ display: "flex", alignItems: "end", gap: 3, height: 32, marginTop: 12 }}>
                {[12, 18, 14, 22, 19, 26, 30, 24, 28, 32, 27, 35, 33, 40].map((v, i) => {
                  const isToday = i === 13;
                  return (
                    <div key={i} style={{
                      flex: 1, height: `${(v / 40) * 100}%`,
                      background: isToday ? ADM.green : "rgba(255,255,255,.18)",
                      borderRadius: "2px 2px 0 0",
                    }}/>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs 2x2 */}
        <div style={{ padding: "14px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <KpiTile dark={dark} label="OSs ativas" value="26" delta="↑ 4" deltaUp/>
          <KpiTile dark={dark} label="Ticket médio" value="R$ 142" delta="▼ 2,1%" />
          <KpiTile dark={dark} label="Resposta agente" value="38s" delta="▼ 12s" deltaUp accent/>
          <KpiTile dark={dark} label="Aprovar" value="3" delta="urgente" warn/>
        </div>

        {/* Status overview */}
        <div style={{ padding: "20px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Status das OSs</div>
          <a style={{ fontSize: 11, color: dark ? ADM.green : ADM.greenDark, fontWeight: 600 }}>Ver Kanban →</a>
        </div>
        <div style={{ padding: "0 16px" }}>
          <AdmCard dark={dark} padding={14}>
            {[
              { c: "#a8b3bc", l: "Aguardando aprovação", v: 5 },
              { c: ADM.accentBlue, l: "Aprovadas", v: 4 },
              { c: ADM.accentOrange, l: "Em progresso", v: 8 },
              { c: ADM.accentPurple, l: "Em revisão", v: 3 },
              { c: ADM.green, l: "Concluídas hoje", v: 6 },
            ].map((r, i, arr) => (
              <div key={r.l} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 0", fontSize: 12,
                borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: r.c }}/>
                  <span style={{ color: T.text }}>{r.l}</span>
                </div>
                <span style={{ fontWeight: 700, color: T.text }}>{r.v}</span>
              </div>
            ))}
          </AdmCard>
        </div>

        {/* Aprovações pendentes */}
        <div style={{ padding: "20px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Aprovações pendentes</div>
          <AdmBadge color="warning">3 pendente</AdmBadge>
        </div>
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { title: "Orçamento R$ 7.840", sub: "Banner LED 3×2m · Eventos Lume" },
            { title: "Desconto 25%", sub: "Cliente recorrente · Café Trilho" },
            { title: "Refazer produção", sub: "OS #A-2790 · Studio Norte" },
          ].map((p, i) => (
            <div key={i} style={{
              borderLeft: `3px solid ${ADM.accentOrange}`,
              background: T.surface, borderRadius: 8,
              padding: "10px 12px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{p.title}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{p.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div style={{ padding: "20px 16px 8px", fontSize: 14, fontWeight: 600, color: T.text }}>
          Últimas atividades
        </div>
        <div style={{ padding: "0 16px" }}>
          <AdmCard dark={dark} padding={0}>
            {[
              { who: "Agente", what: "Fechou R$ 189 com Mariana", time: "agora", color: ADM.green, icon: "🤖" },
              { who: "Paula", what: "Aprovou arte do #A-2847", time: "2 min", color: ADM.accentBlue, icon: "✓" },
              { who: "Agente", what: "Escalou orçamento >R$ 5k", time: "12 min", color: ADM.accentOrange, icon: "!" },
              { who: "Rafa", what: "Iniciou lote de 5 OSs", time: "34 min", color: ADM.accentPurple, icon: "▶" },
            ].map((a, i, arr) => (
              <div key={i} style={{
                padding: "10px 14px", display: "flex", gap: 10, alignItems: "center",
                borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 9999,
                  background: a.color, color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{a.icon}</div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <b style={{ fontWeight: 600, color: T.text }}>{a.who}</b>
                  <span style={{ color: T.textMuted }}> · {a.what}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textFaint, flexShrink: 0 }}>{a.time}</div>
              </div>
            ))}
          </AdmCard>
        </div>
      </div>
      <AdminTabBar active="home" badge={{ chat: 3 }} dark={dark}/>
    </PhoneShell>
  );
}

function KpiTile({ label, value, delta, deltaUp, accent, warn, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      background: T.bgElevated, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 12,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, marginTop: 4, color: accent ? (dark ? ADM.green : ADM.greenDark) : T.text }}>{value}</div>
      <div style={{
        fontSize: 10, fontWeight: 600, marginTop: 2,
        color: warn ? ADM.accentOrange : (deltaUp ? (dark ? ADM.green : ADM.greenDark) : T.textMuted),
      }}>{delta}</div>
    </div>
  );
}

// ============== 02 KANBAN OS (MOBILE) ==============
// Mobile pattern: segmented status tabs at top + vertical list of OSs below.
function AdmMobileKanban({ dark = false }) {
  const T = theme(dark);
  const [activeStatus, setActiveStatus] = React.useState("progress");
  const statuses = [
    { id: "wait", label: "Aguard.", color: "#a8b3bc", count: 5 },
    { id: "approved", label: "Aprov.", color: ADM.accentBlue, count: 4 },
    { id: "progress", label: "Progresso", color: ADM.accentOrange, count: 8 },
    { id: "review", label: "Revisão", color: ADM.accentPurple, count: 3 },
    { id: "done", label: "Concl.", color: ADM.green, count: 6 },
  ];

  const allCards = {
    wait: [
      { id: "A-2851", title: "Banner LED 3×2m", client: "Eventos Lume", value: "R$ 7.840", prio: "high", reason: "Acima do limite", tag: "banner" },
      { id: "A-2850", title: "500 panfletos A4", client: "Café Trilho", value: "R$ 124", prio: "low", tag: "panfleto" },
      { id: "A-2849", title: "Bloco RPA 2 vias", client: "Mercado Ponto", value: "R$ 240", prio: "med", tag: "bloco" },
    ],
    approved: [
      { id: "A-2848", title: "Apostila 80pg · 50un", client: "Colégio Vértice", value: "R$ 920", prio: "med", tag: "apostila", deadline: "qui" },
      { id: "A-2845", title: "200 panfletos A5", client: "Padaria Estrela", value: "R$ 59", prio: "low", tag: "panfleto", deadline: "amanhã" },
    ],
    progress: [
      { id: "A-2847", title: "1.000 panfletos A5", client: "Mariana Costa", value: "R$ 189", prio: "med", tag: "panfleto", deadline: "qui · 14h", progress: 0.55 },
      { id: "A-2843", title: "Banner oxford 1×2m", client: "Studio Norte", value: "R$ 168", prio: "med", tag: "banner", deadline: "qui", progress: 0.35 },
      { id: "A-2841", title: "Apostila A4 · 30 un.", client: "Clínica Anna", value: "R$ 540", prio: "high", tag: "apostila", deadline: "qui · 16h", progress: 0.7 },
    ],
    review: [
      { id: "A-2839", title: "Bloco numerado", client: "Mercado Ponto", value: "R$ 144", prio: "low", tag: "bloco", note: "Aguardando ok do cliente" },
      { id: "A-2837", title: "Folder duplex A4", client: "Eventos Lume", value: "R$ 312", prio: "med", tag: "panfleto", note: "Conferindo sangria" },
    ],
    done: [
      { id: "A-2834", title: "300 panfletos A6", client: "Café Trilho", value: "R$ 79", prio: "low", tag: "panfleto", doneAt: "hoje 11h" },
      { id: "A-2830", title: "Banner 80×120cm", client: "Padaria Estrela", value: "R$ 89", prio: "low", tag: "banner", doneAt: "hoje 09h" },
    ],
  };
  const cards = allCards[activeStatus] || [];

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AdminMobileHeader
          title="Ordens de serviço"
          subtitle="26 OSs ativas · arraste pra mudar status"
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

        {/* Status tabs (horizontal scroll) */}
        <div style={{
          display: "flex", gap: 6, padding: "10px 12px 12px",
          overflowX: "auto", flexShrink: 0,
          borderBottom: `1px solid ${T.borderSoft}`,
        }}>
          {statuses.map(s => {
            const isActive = s.id === activeStatus;
            return (
              <div key={s.id}
                onClick={() => setActiveStatus(s.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 12px", borderRadius: 9999,
                  background: isActive ? (dark ? T.bgElevated : "#fff") : "transparent",
                  border: isActive ? `1.5px solid ${s.color}` : `1px solid ${T.border}`,
                  fontSize: 11, fontWeight: 600,
                  color: isActive ? T.text : T.textMuted,
                  whiteSpace: "nowrap", cursor: "pointer",
                  flexShrink: 0,
                }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: s.color }}/>
                {s.label}
                <span style={{
                  background: isActive ? s.color : T.surface,
                  color: isActive ? "#fff" : T.textMuted,
                  padding: "1px 6px", borderRadius: 9999, fontSize: 9, fontWeight: 700,
                  minWidth: 16, textAlign: "center",
                }}>{s.count}</span>
              </div>
            );
          })}
        </div>

        {/* Cards list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 90px", display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.map(c => <KanbanMobileCard key={c.id} card={c} dark={dark}/>)}
        </div>

        <AdminTabBar active="kanban" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

function KanbanMobileCard({ card, dark = false }) {
  const T = theme(dark);
  const tagPalettes = { panfleto: "soft", banner: "orange", bloco: "purple", apostila: "blue" };
  const prioColors = { high: ADM.danger, med: ADM.accentOrange, low: "#a8b3bc" };
  return (
    <div style={{
      background: T.bgElevated, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 12,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AdmTag color={tagPalettes[card.tag] || "soft"}>{card.tag}</AdmTag>
          <span style={{ fontSize: 10, color: T.textMuted, fontFamily: ADM.mono }}>#{card.id}</span>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: prioColors[card.prio] }}/>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{card.title}</div>
      <div style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 16, height: 16, borderRadius: 9999, background: T.surfaceSoft,
          fontSize: 9, fontWeight: 700, color: dark ? ADM.green : ADM.greenDark,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>{card.client[0]}</span>
        {card.client}
      </div>
      {card.reason && (
        <div style={{
          fontSize: 10, fontWeight: 600, color: ADM.accentOrange,
          background: dark ? "rgba(250,110,57,0.1)" : "#fff4ed", borderRadius: 4, padding: "3px 6px",
        }}>! {card.reason}</div>
      )}
      {card.note && <div style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic" }}>{card.note}</div>}
      {card.progress !== undefined && (
        <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${card.progress * 100}%`, background: ADM.accentOrange }}/>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: card.doneAt ? (dark ? ADM.green : ADM.greenDark) : T.textMuted, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          {card.doneAt ? `Concl. ${card.doneAt}` : card.deadline ? `Entrega ${card.deadline}` : "—"}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{card.value}</span>
      </div>
    </div>
  );
}

// ============== 03 ATENDIMENTO (LISTA DE CONVERSAS) ==============
function AdmMobileChat({ dark = false }) {
  const T = theme(dark);
  const conversations = [
    { id: 1, name: "Mariana Costa", last: "fechado 💚 já te mando a arte", time: "agora", unread: 0, agent: true },
    { id: 2, name: "Eventos Lume", last: "Posso fazer 3×2m? Qual o preço?", time: "2 min", unread: 2, escalated: true },
    { id: 3, name: "Café Trilho", last: "[agente] Orçamento enviado · R$ 124", time: "12 min", unread: 0, agent: true },
    { id: 4, name: "Studio Norte", last: "Tá errado, a cor da capa ficou…", time: "1 h", unread: 1, escalated: true, priority: "high" },
    { id: 5, name: "Padaria Estrela", last: "[agente] Pagamento confirmado", time: "2 h", unread: 0, agent: true },
    { id: 6, name: "Clínica Anna", last: "Obrigada, chegou tudo certo!", time: "3 h", unread: 0 },
    { id: 7, name: "Colégio Vértice", last: "[agente] Prova digital enviada", time: "ontem", unread: 0, agent: true },
    { id: 8, name: "Mercado Ponto", last: "[agente] Pedido em produção", time: "ontem", unread: 0, agent: true },
  ];
  const [tab, setTab] = React.useState("todas");

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AdminMobileHeader
          title="Atendimento"
          subtitle="3 escaladas · 21 com agente"
          dark={dark}
          actions={
            <button style={{
              width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            </button>
          }
        />

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 6, padding: "10px 16px 8px",
          flexShrink: 0, borderBottom: `1px solid ${T.borderSoft}`,
        }}>
          {[
            { id: "todas", l: "Todas", n: 24 },
            { id: "humano", l: "Humano", n: 3 },
            { id: "agente", l: "Agente", n: 21 },
          ].map(t => {
            const isActive = t.id === tab;
            return (
              <div key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: "6px 12px", borderRadius: 9999,
                  background: isActive ? (dark ? ADM.green : ADM.tealDeep) : "transparent",
                  color: isActive ? (dark ? ADM.tealDeep : "#fff") : T.textMuted,
                  border: isActive ? `1px solid ${isActive ? (dark ? ADM.green : ADM.tealDeep) : T.border}` : `1px solid ${T.border}`,
                  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                }}>
                {t.l}
                <span style={{
                  background: isActive ? "rgba(0,30,43,.18)" : T.surface,
                  padding: "1px 6px", borderRadius: 9999, fontSize: 9,
                  color: isActive ? (dark ? ADM.tealDeep : "#fff") : T.textMuted,
                }}>{t.n}</span>
              </div>
            );
          })}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
          {conversations.map(c => (
            <div key={c.id} style={{
              padding: "12px 16px", display: "flex", gap: 10,
              borderBottom: `1px solid ${T.borderSoft}`,
              background: c.priority === "high" ? (dark ? "rgba(214,69,69,0.05)" : "#fff8f6") : "transparent",
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 9999,
                  background: c.priority === "high" ? (dark ? "rgba(214,69,69,0.15)" : "#fde8e8") : T.surfaceSoft,
                  color: c.priority === "high" ? ADM.danger : (dark ? ADM.green : ADM.greenDark),
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13,
                }}>{c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                {c.agent && !c.escalated && (
                  <span style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 17, height: 17, borderRadius: 9999, background: ADM.green,
                    color: ADM.tealDeep, fontSize: 8, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${T.bg}`,
                  }}>🤖</span>
                )}
                {c.escalated && (
                  <span style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 17, height: 17, borderRadius: 9999, background: ADM.accentOrange,
                    color: "#fff", fontSize: 9, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${T.bg}`,
                  }}>!</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{c.time}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <div style={{ fontSize: 12, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.last}</div>
                  {c.unread > 0 && (
                    <span style={{
                      background: ADM.green, color: ADM.tealDeep, fontSize: 10, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 9999, minWidth: 18, textAlign: "center",
                    }}>{c.unread}</span>
                  )}
                </div>
                {(c.escalated || c.priority === "high") && (
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {c.escalated && <AdmBadge color="warning">Escalada</AdmBadge>}
                    {c.priority === "high" && <AdmBadge color="danger">Urgente</AdmBadge>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <AdminTabBar active="chat" badge={{ chat: 3 }} dark={dark}/>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { AdmMobileDashboard, AdmMobileKanban, AdmMobileChat });
