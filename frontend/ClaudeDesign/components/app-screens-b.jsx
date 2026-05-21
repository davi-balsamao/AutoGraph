/* Autograph mobile app — screens B: Chat, Orders, Tracking, Account.
   Each screen accepts a `dark` prop and adapts via theme(dark). */

// =============== 05 CHAT — AGENTE AUTOGRAPH ===============
const CHAT_SCRIPT = [
  { side: "out", text: "oi, queria 1000 panfletos pro evento de sábado", t: "14:32" },
  { side: "in", typing: 700, text: "Boa tarde, Mariana! 👋 Aqui é o agente da Autograph. 1.000 panfletos pro sábado dá tempo sim.", t: "14:32" },
  { side: "in", text: "Pra fechar o orçamento:\n• Tamanho A6, A5 ou A4?\n• Frente só ou frente e verso?\n• Couché brilho 115g está ótimo pra panfleto, manda esse?", t: "14:32" },
  { side: "out", text: "A5 frente e verso, couché tá bom 👍", t: "14:33" },
  { side: "in", typing: 800, kind: "quote", t: "14:33" },
  { side: "out", text: "fechado 💚 já te mando a arte", t: "14:34" },
  { side: "in", typing: 700, kind: "proof", t: "14:34" },
];

function ChatScreen({ dark = false }) {
  const [step, setStep] = React.useState(CHAT_SCRIPT.length);
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Replay loop
  React.useEffect(() => {
    let cancelled = false;
    async function loop() {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, 6000));
        if (cancelled) return;
        setStep(0); setTyping(false);
        for (let i = 0; i < CHAT_SCRIPT.length; i++) {
          if (cancelled) return;
          const m = CHAT_SCRIPT[i];
          if (m.side === "in" && m.typing) {
            setTyping(true);
            await new Promise(r => setTimeout(r, m.typing));
            if (cancelled) return;
            setTyping(false);
          }
          setStep(s => s + 1);
          await new Promise(r => setTimeout(r, 700));
        }
      }
    }
    loop();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [step, typing]);

  // WhatsApp palette: light mode (#efeae2 bg, white/green bubbles) vs dark mode (#0b141a bg, dark bubbles).
  const wa = dark
    ? {
        bg: "#0b141a",
        pattern: "rgba(255,255,255,0.025)",
        headerBg: "#1f2c33",
        bubbleIn: "#202c33",
        bubbleOut: "#005c4b",
        bubbleInText: "#e9edef",
        bubbleOutText: "#e9edef",
        bubbleMeta: "#8696a0",
        composerBg: "#1f2c33",
        composerInput: "#2a3942",
        composerText: "#8696a0",
        proofCardBg: "#0b1f1a",
        quoteInnerBg: "#0b1f1a",
      }
    : {
        bg: "#efeae2",
        pattern: "rgba(0,30,43,.06)",
        headerBg: AG.tealDeep,
        bubbleIn: "#ffffff",
        bubbleOut: "#d9fdd3",
        bubbleInText: "#111b21",
        bubbleOutText: "#111b21",
        bubbleMeta: "#667781",
        composerBg: "#f0f2f5",
        composerInput: "#ffffff",
        composerText: "#667781",
        proofCardBg: AG.tealDeep,
        quoteInnerBg: "#f7f8fa",
      };

  return (
    <PhoneShell bg={wa.bg} statusBarStyle="light" statusBarColor={wa.headerBg}>
      <div style={{
        background: wa.headerBg, color: "#fff",
        padding: "8px 12px 12px",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0,
      }}>
        <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 18, padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 9999,
          background: AG.green, color: AG.ink,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <AGLogoMark size={32} bg={AG.green} stroke={AG.tealDeep}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            Autograph
            <span style={{
              width: 13, height: 13, borderRadius: 7, background: AG.green, color: AG.tealDeep,
              fontSize: 8, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>✓</span>
          </div>
          <div style={{ fontSize: 11, color: AG.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: AG.green }}/>
            agente automático · responde em segundos
          </div>
        </div>
        <button style={{ background: "transparent", border: 0, color: "#fff", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4l14 8L5 20z"/></svg>
        </button>
        <button style={{ background: "transparent", border: 0, color: "#fff", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        padding: "12px 10px 70px",
        display: "flex", flexDirection: "column", gap: 4,
        background: wa.bg,
        backgroundImage: `radial-gradient(${wa.pattern} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
      }}>
        <div style={{
          alignSelf: "center",
          background: dark ? "#1d2c2c" : "#fdf4c8",
          color: dark ? "#a8b3bc" : "#665a25",
          fontSize: 10, padding: "4px 10px", borderRadius: 6, margin: "4px 0 8px"
        }}>🔒 Mensagens protegidas com criptografia ponta a ponta</div>

        {CHAT_SCRIPT.slice(0, step).map((m, i) => {
          if (m.kind === "quote") return <QuoteBubble key={i} t={m.t} wa={wa} dark={dark}/>;
          if (m.kind === "proof") return <ProofBubble key={i} t={m.t} wa={wa} dark={dark}/>;
          return <Bubble key={i} side={m.side} text={m.text} t={m.t} wa={wa}/>;
        })}
        {typing && <TypingBubble wa={wa}/>}
      </div>

      <div style={{
        position: "absolute", left: 8, right: 8, bottom: 26,
        background: wa.composerBg, borderRadius: 24,
        display: "flex", alignItems: "center", gap: 6,
        padding: 6, zIndex: 5,
      }}>
        <span style={{ width: 28, textAlign: "center", color: wa.composerText, fontSize: 16 }}>😊</span>
        <div style={{
          flex: 1, background: wa.composerInput, borderRadius: 20, padding: "8px 14px",
          color: wa.composerText, fontSize: 13,
        }}>Mensagem</div>
        <span style={{ width: 24, textAlign: "center", color: wa.composerText, fontSize: 14 }}>📎</span>
        <div style={{
          width: 36, height: 36, borderRadius: 9999, background: "#00a884", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </div>
      </div>
    </PhoneShell>
  );
}

const tickSvg = (
  <svg width="14" height="9" viewBox="0 0 16 11" style={{ flexShrink: 0 }}>
    <path d="M1 6L4 9L10 2" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M6 6L9 9L15 2" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

function Bubble({ side, text, t = "14:32", wa }) {
  const isOut = side === "out";
  return (
    <div className="ag-msg-in" style={{
      alignSelf: isOut ? "flex-end" : "flex-start",
      background: isOut ? wa.bubbleOut : wa.bubbleIn,
      color: isOut ? wa.bubbleOutText : wa.bubbleInText,
      borderRadius: isOut ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
      padding: "6px 10px 4px",
      maxWidth: "82%",
      boxShadow: "0 1px 0.5px rgba(0,0,0,.06)",
      fontSize: 13, lineHeight: 1.45,
      marginBottom: 2,
    }}>
      {text.split("\n").map((l, i) => <div key={i}>{l || "\u00A0"}</div>)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, alignItems: "center", marginTop: 2, fontSize: 10, color: wa.bubbleMeta }}>
        <span>{t}</span>
        {isOut && tickSvg}
      </div>
    </div>
  );
}

function TypingBubble({ wa }) {
  const dot = (i) => ({
    width: 5, height: 5, borderRadius: 3, background: wa.bubbleMeta,
    animation: `ag-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
  });
  return (
    <div style={{
      alignSelf: "flex-start", background: wa.bubbleIn, borderRadius: "10px 10px 10px 2px",
      padding: "10px 12px", boxShadow: "0 1px 0.5px rgba(0,0,0,.06)",
      display: "inline-flex", gap: 3,
    }}>
      <span style={dot(0)}/><span style={dot(1)}/><span style={dot(2)}/>
    </div>
  );
}

function QuoteBubble({ t, wa, dark }) {
  return (
    <div className="ag-msg-in" style={{
      alignSelf: "flex-start", background: wa.bubbleIn, color: wa.bubbleInText,
      borderRadius: "10px 10px 10px 2px", padding: "8px 10px 6px",
      maxWidth: "85%", boxShadow: "0 1px 0.5px rgba(0,0,0,.06)",
      fontSize: 13, lineHeight: 1.45,
    }}>
      Prontinho! Aqui está:
      <div style={{
        marginTop: 6, background: wa.quoteInnerBg, borderRadius: 6,
        borderLeft: `3px solid ${AG.greenMid}`, padding: 10, fontSize: 12,
        color: wa.bubbleInText,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: dark ? AG.green : AG.greenDark, letterSpacing: 1, textTransform: "uppercase" }}>
          Orçamento #A-2847
        </div>
        <div style={{ marginTop: 4, lineHeight: 1.6 }}>
          <div><b>1.000 un.</b> · Panfleto A5</div>
          <div>Couché brilho 115g · 4×4</div>
          <div style={{ color: wa.bubbleMeta, fontSize: 11 }}>Entrega quinta-feira (44h)</div>
        </div>
        <div style={{ borderTop: `1px dashed ${dark ? "#2a3d4a" : AG.hairline}`, margin: "6px 0" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: wa.bubbleMeta, fontSize: 11 }}>Total</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>R$ 189,00</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <div style={{ flex: 1, background: "#00a884", color: "#fff", textAlign: "center", padding: "6px 8px", borderRadius: 18, fontSize: 11, fontWeight: 600 }}>Aprovar</div>
        <div style={{ flex: 1, background: dark ? "transparent" : "#fff", color: dark ? "#fff" : "#00684a", border: `1px solid #00a884`, textAlign: "center", padding: "6px 8px", borderRadius: 18, fontSize: 11, fontWeight: 600 }}>Ajustar</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, fontSize: 10, color: wa.bubbleMeta }}>{t}</div>
    </div>
  );
}

function ProofBubble({ t, wa, dark }) {
  return (
    <div className="ag-msg-in" style={{
      alignSelf: "flex-start", background: wa.bubbleIn, color: wa.bubbleInText,
      borderRadius: "10px 10px 10px 2px", padding: "8px 10px 6px",
      maxWidth: "85%", boxShadow: "0 1px 0.5px rgba(0,0,0,.06)",
      fontSize: 13, lineHeight: 1.45,
    }}>
      Olha a prova digital — confere se está tudo certo:
      <div style={{ marginTop: 6, background: wa.proofCardBg, borderRadius: 6, padding: 12, border: dark ? `1px solid #2a3d4a` : "none" }}>
        <div style={{ display: "inline-block", background: AG.green, color: AG.ink, padding: "2px 6px", borderRadius: 3, fontSize: 8, fontWeight: 700 }}>
          PRÉ-VISUALIZAÇÃO
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 8 }}>FESTIVAL DA RUA</div>
        <div style={{ color: AG.muted, fontSize: 10, marginTop: 2 }}>Sábado · 22h · Rua Aurora</div>
        <div style={{ marginTop: 8, display: "flex", gap: 3 }}>
          {[AG.green, AG.accentOrange, AG.accentPurple].map((c, i) => (
            <div key={i} style={{ height: 3, flex: 1, background: c, borderRadius: 1.5 }}/>
          ))}
        </div>
        <div style={{ color: AG.muted, fontSize: 8, marginTop: 8, fontFamily: AG.mono }}>
          A5 · 148×210mm · 300dpi · CMYK · sangria 3mm ✓
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <div style={{ flex: 1, background: "#00a884", color: "#fff", textAlign: "center", padding: "6px 8px", borderRadius: 18, fontSize: 11, fontWeight: 600 }}>Aprovar prova</div>
        <div style={{ flex: 1, background: dark ? "transparent" : "#fff", color: dark ? "#fff" : "#00684a", border: `1px solid #00a884`, textAlign: "center", padding: "6px 8px", borderRadius: 18, fontSize: 11, fontWeight: 600 }}>Pedir ajuste</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, fontSize: 10, color: wa.bubbleMeta }}>{t}</div>
    </div>
  );
}

// =============== 06 PEDIDOS ===============
function OrdersScreen({ dark = false }) {
  const T = theme(dark);
  const orders = [
    { id: "A-2847", title: "1.000 panfletos A5", date: "12 mai", total: "R$ 189,00", status: "Em produção", color: "soft", kind: "panfleto", progress: 0.55 },
    { id: "A-2812", title: "Banner 80×120cm", date: "08 mai", total: "R$ 89,00", status: "Entregue", color: "green", kind: "banner", progress: 1 },
    { id: "A-2790", title: "Bloco de pedidos 50fls", date: "02 mai", total: "R$ 144,00", status: "Entregue", color: "green", kind: "bloco", progress: 1 },
    { id: "A-2754", title: "Apostila 64pg · 30 un.", date: "24 abr", total: "R$ 540,00", status: "Entregue", color: "green", kind: "apostila", progress: 1 },
  ];
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "8px 20px 4px" }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: T.text }}>Pedidos</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>1 em andamento · 12 concluídos</div>
        </div>

        <div style={{ padding: "16px 20px 4px" }}>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9999,
            padding: 4, display: "flex",
          }}>
            {["Todos", "Em andamento", "Concluídos"].map((s, i) => (
              <div key={s} style={{
                flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600,
                padding: "8px 0", borderRadius: 9999,
                background: i === 0 ? (dark ? T.bgElevated : "#fff") : "transparent",
                color: i === 0 ? T.text : T.textFaint,
                boxShadow: i === 0 ? (dark ? "none" : "0 1px 2px rgba(0,30,43,.06)") : "none",
                border: i === 0 && dark ? `1px solid ${T.borderStrong}` : "none",
              }}>{s}</div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map(o => (
            <div key={o.id} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: T.surfaceSoft, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ProductGlyph kind={o.kind} size={60} dark={dark}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Tag color={o.color}>{o.status}</Tag>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{o.date}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: T.text }}>{o.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: AG.mono, display: "flex", justifyContent: "space-between" }}>
                    <span>#{o.id}</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{o.total}</span>
                  </div>
                </div>
              </div>
              {o.progress < 1 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${o.progress * 100}%`, background: AG.green }}/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
                    <span>✓ Aprovado</span>
                    <span style={{ color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>● Imprimindo</span>
                    <span>○ Saiu p/ entrega</span>
                    <span>○ Entregue</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomTabBar active="orders" badge={{ chat: 2 }} dark={dark}/>
    </PhoneShell>
  );
}

// =============== 07 TRACKING ===============
function TrackingScreen({ dark = false }) {
  const T = theme(dark);
  const steps = [
    { label: "Pedido recebido", time: "ter, 14:34", done: true },
    { label: "Arte aprovada", time: "ter, 15:02", done: true },
    { label: "Em impressão", time: "qua, 08:10", done: true, current: true },
    { label: "Acabamento", time: "previsto qua, 16h", done: false },
    { label: "Saiu para entrega", time: "previsto qui, 09h", done: false },
    { label: "Entregue", time: "previsto qui, 14h", done: false },
  ];
  return (
    <PhoneShell bg={T.surface} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.surface}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "8px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: T.bgElevated, border: `1px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Pedido #A-2847</div>
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: T.bgElevated, border: `1px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.8"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
          </button>
        </div>

        <div style={{ margin: "0 20px" }}>
          <div style={{
            background: dark ? "#001e2b" : AG.tealDeep, color: "#fff", borderRadius: 16, padding: 18,
            position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(220px 120px at 100% 0%, rgba(0,237,100,.16), transparent 70%)" }}/>
            <div style={{ position: "relative" }}>
              <Tag color="teal">EM PRODUÇÃO</Tag>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8, lineHeight: 1.15 }}>
                Saindo da máquina em <span style={{ color: AG.green }}>~6h</span>
              </div>
              <div style={{ fontSize: 12, color: AG.muted, marginTop: 4 }}>
                Entrega prevista: quinta-feira, 14h · Rua Aurora 245
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 }}>Linha do tempo</div>
          <div style={{ position: "relative" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i === steps.length - 1 ? 0 : 16, position: "relative" }}>
                {i < steps.length - 1 && (
                  <div style={{
                    position: "absolute", left: 11, top: 24, bottom: 0,
                    width: 2, background: s.done ? AG.green : T.borderStrong,
                  }}/>
                )}
                <div style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: s.current ? AG.green : (s.done ? (dark ? "#003d2a" : AG.greenSoft) : T.bgElevated),
                  border: s.current ? `2px solid ${AG.green}` : (s.done ? `2px solid ${AG.green}` : `2px solid ${T.borderStrong}`),
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, zIndex: 1,
                  boxShadow: s.current ? `0 0 0 4px rgba(0,237,100,.18)` : "none",
                }}>
                  {s.done && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5L5 9l5-6" stroke={s.current ? AG.tealDeep : (dark ? AG.green : AG.greenDark)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: s.current ? 600 : 500, color: s.done ? T.text : T.textFaint }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, fontSize: 13, color: T.text }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ color: T.textMuted }}>1.000 panfletos A5</span>
              <span style={{ fontWeight: 600 }}>R$ 169,00</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ color: T.textMuted }}>Frete motoboy</span>
              <span style={{ fontWeight: 600 }}>R$ 20,00</span>
            </div>
            <div style={{ borderTop: `1px dashed ${T.border}`, margin: "8px 0" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700 }}>R$ 189,00</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>✓ Pago via Pix · 12/05 14:42</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px 0", display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, background: T.bgElevated, color: T.text,
            border: `1px solid ${T.borderStrong}`, borderRadius: 9999, padding: "11px 16px",
            fontSize: 13, fontWeight: 600,
          }}>Falar com o agente</button>
          <button style={{
            background: T.bgElevated, color: T.text, border: `1px solid ${T.border}`,
            width: 44, height: 44, borderRadius: 9999,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg>
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

// =============== 08 CONTA ===============
function AccountScreen({ dark = false }) {
  const T = theme(dark);
  const Row = ({ icon, label, detail, danger }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: danger ? (dark ? "#3d1c0e" : "#fff0ed") : T.surfaceSoft,
        color: danger ? AG.accentOrange : (dark ? AG.green : AG.greenDark),
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? AG.accentOrange : T.text }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{detail}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
    </div>
  );

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "8px 20px 4px" }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: T.text }}>Conta</div>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <div style={{
            background: dark ? "#001e2b" : AG.tealDeep, color: "#fff", borderRadius: 16, padding: 16,
            display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(180px 100px at 100% 100%, rgba(0,237,100,.14), transparent 70%)" }}/>
            <div style={{
              width: 56, height: 56, borderRadius: 9999, background: AG.green,
              color: AG.tealDeep, fontSize: 22, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>M</div>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Mariana Costa</div>
              <div style={{ fontSize: 12, color: AG.muted, marginTop: 2 }}>+55 11 9 8421-3344</div>
              <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, color: AG.green, letterSpacing: 0.8 }}>
                MEMBRO DESDE MAR/2025
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { v: "13", l: "pedidos" },
            { v: "R$ 2.4k", l: "gasto total" },
            { v: "4,9", l: "avaliação" },
          ].map(s => (
            <div key={s.l} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: "10px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <SectionLabel dark={dark}>Conta</SectionLabel>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px", overflow: "hidden" }}>
          <Row icon={<UserIcon/>} label="Dados pessoais" detail="Nome, CNPJ, e-mail"/>
          <Row icon={<PinIcon/>} label="Endereços" detail="2 endereços salvos"/>
          <Row icon={<CardIcon/>} label="Formas de pagamento" detail="Pix · Cartão final 4831"/>
        </div>

        <SectionLabel dark={dark}>Preferências</SectionLabel>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px 16px", overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px",
            borderBottom: `1px solid ${T.borderSoft}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: T.surfaceSoft,
              color: dark ? AG.green : AG.greenDark,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>{dark ? "\u{1F319}" : "\u2600\uFE0F"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>Tema</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Claro, escuro ou automático</div>
            </div>
            <ThemeToggleSwitch dark={dark} value={dark ? "dark" : "light"}/>
          </div>
          <Row icon={<BellIcon/>} label="Notificações" detail="Push, e-mail e WhatsApp"/>
          <Row icon={<ChatIcon/>} label="Falar com humano" detail="Pedir atendimento humano"/>
          <Row icon={<HelpIcon/>} label="Central de ajuda"/>
        </div>

        <SectionLabel dark={dark}>Outros</SectionLabel>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px 16px", overflow: "hidden" }}>
          <Row icon={<LogoutIcon/>} label="Sair" danger/>
        </div>

        <div style={{ textAlign: "center", color: T.textFaint, fontSize: 10, padding: "8px 0 0" }}>
          Autograph v1.0 · feito em São Paulo
        </div>
      </div>
      <BottomTabBar active="account" badge={{ chat: 2 }} dark={dark}/>
    </PhoneShell>
  );
}

function SectionLabel({ children, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase",
      padding: "20px 20px 8px",
    }}>{children}</div>
  );
}

const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
const PinIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
const CardIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>;
const BellIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
const ChatIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.8-4.7C3.7 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/></svg>;
const HelpIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4.5 1.5c-1 .5-2 1-2 2.5"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>;

Object.assign(window, {
  ChatScreen, OrdersScreen, TrackingScreen, AccountScreen,
});
