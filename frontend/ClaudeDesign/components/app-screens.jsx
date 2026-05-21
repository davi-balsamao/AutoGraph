/* Autograph mobile app — screens A: Welcome, Home, Catalog, Product detail.
   Each screen accepts a `dark` prop and adapts via theme(dark). */

// =============== 01 WELCOME / ONBOARDING ===============
function WelcomeScreen({ dark = false }) {
  // Welcome screen is always on dark deep teal (it's the brand hero) — same in both modes,
  // but in dark mode we deepen it further and adjust the inner accents.
  const heroBg = dark ? "#000a10" : AG.tealDeep;
  return (
    <PhoneShell dark statusBarStyle="light" bg={heroBg} statusBarColor={heroBg}>
      <div style={{
        position: "absolute", inset: 0,
        background:
          "radial-gradient(400px 200px at 80% 10%, rgba(0,237,100,.18), transparent 60%)," +
          "radial-gradient(400px 240px at 0% 100%, rgba(0,163,92,.16), transparent 60%)",
      }}/>
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "40px 28px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <AGLogoMark size={56} bg={AG.green} stroke={AG.tealDeep} />
          <ThemeToggleIcon dark size={40} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}/>
        </div>
        <div style={{ marginTop: 36, flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            color: AG.green,
            padding: "4px 10px",
            borderRadius: 9999,
            background: "rgba(0,237,100,.08)",
            border: "1px solid rgba(0,237,100,.18)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: AG.green }}/>
            Gráfica + agente
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1,
            color: "#fff", margin: "20px 0 16px",
          }}>
            Imprima tudo<br/>conversando.
          </h1>
          <p style={{ fontSize: 15, color: AG.muted, lineHeight: 1.55, margin: 0, maxWidth: 280 }}>
            Panfletos, banners, blocos e apostilas direto no chat. Orçamento em 40 s, prova digital, entrega em 24h.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{
            background: AG.green, color: AG.ink, border: 0,
            borderRadius: 9999, padding: "14px 22px",
            fontSize: 15, fontWeight: 600, fontFamily: AG.font, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Começar agora
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
          <button style={{
            background: "transparent", color: "#fff",
            border: `1px solid ${dark ? "#2a3d4a" : "#1c2d38"}`,
            borderRadius: 9999, padding: "14px 22px",
            fontSize: 15, fontWeight: 600, fontFamily: AG.font, cursor: "pointer",
          }}>Já tenho conta</button>
          <div style={{ textAlign: "center", color: AG.muted, fontSize: 11, marginTop: 12 }}>
            Continuando, você aceita os Termos e Política de Privacidade
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

// =============== 02 HOME ===============
function HomeScreen({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        {/* Top bar */}
        <div style={{ padding: "8px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <AGLogoMark size={32} bg={dark ? AG.green : AG.tealDeep} stroke={dark ? AG.tealDeep : AG.green}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Olá,</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.1 }}>Mariana Costa</div>
          </div>
          <button style={{
            width: 38, height: 38, borderRadius: 9999,
            background: T.surface, border: `1px solid ${T.border}`, position: "relative",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.8">
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/>
              <path d="M10 21a2 2 0 0 0 4 0"/>
            </svg>
            <span style={{
              position: "absolute", top: 8, right: 9,
              width: 8, height: 8, borderRadius: 4, background: AG.accentOrange, border: `2px solid ${T.bg}`,
            }}/>
          </button>
          <ThemeToggleIcon dark={dark} size={38}/>
        </div>

        {/* Hero card — agent CTA */}
        <div style={{ padding: "0 20px" }}>
          <div style={{
            background: dark ? "#001e2b" : AG.tealDeep, color: "#fff", borderRadius: 16,
            padding: 20, position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(220px 120px at 100% 0%, rgba(0,237,100,.18), transparent 70%)",
            }}/>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: AG.green, fontWeight: 600, letterSpacing: .8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: AG.green }}/>
                AGENTE ONLINE
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, marginTop: 8, letterSpacing: -0.3 }}>
                Precisa imprimir algo?
              </div>
              <div style={{ fontSize: 13, color: AG.muted, marginTop: 4, lineHeight: 1.5 }}>
                Conversa rápida, orçamento em 40 s.
              </div>
              <button style={{
                marginTop: 14, background: AG.green, color: AG.ink, border: 0,
                borderRadius: 9999, padding: "10px 16px",
                fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 .5C5.4.5 0 5.9 0 12.5c0 2.2.6 4.3 1.7 6.1L0 24l5.5-1.7c1.8 1 3.9 1.5 6 1.5h.5c6.6 0 12-5.4 12-12s-5.4-12-12-12z"/></svg>
                Conversar com o agente
              </button>
            </div>
          </div>
        </div>

        {/* Quick categories */}
        <div style={{ padding: "24px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Imprima agora</div>
          <a style={{ fontSize: 12, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Ver tudo</a>
        </div>
        <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { kind: "panfleto", label: "Panfletos", price: "R$ 89/mil" },
            { kind: "banner", label: "Banners", price: "R$ 49/m²" },
            { kind: "bloco", label: "Blocos", price: "R$ 12/un." },
            { kind: "apostila", label: "Apostilas", price: "R$ 18/un." },
          ].map(p => (
            <div key={p.kind} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12, display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <ProductGlyph kind={p.kind} size={140} dark={dark}/>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.label}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>a partir de {p.price}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent order */}
        <div style={{ padding: "24px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Último pedido</div>
          <a style={{ fontSize: 12, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Histórico</a>
        </div>
        <div style={{ padding: "0 20px" }}>
          <div style={{
            background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: 14, display: "flex", gap: 12, alignItems: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8, background: T.surfaceSoft,
              border: `1px solid ${T.border}`, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ProductGlyph kind="panfleto" size={60} dark={dark}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tag color="soft">Em produção</Tag>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: T.text }}>1.000 panfletos A5</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontFamily: AG.mono }}>#A-2847 · entrega qui.</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
          </div>
        </div>

        {/* Promo banner */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{
            background: dark ? "#003d2a" : AG.surfaceFeature,
            border: `1px solid ${dark ? AG.greenDark : AG.greenSoft}`,
            borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 24 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: dark ? AG.green : AG.greenDark }}>10% off no primeiro pedido</div>
              <div style={{ fontSize: 11, color: dark ? AG.muted : AG.slate, marginTop: 2 }}>Use AGRAPH10 no chat</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dark ? AG.green : AG.greenDark} strokeWidth="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </div>
        </div>
      </div>
      <BottomTabBar active="home" badge={{ chat: 2 }} dark={dark}/>
    </PhoneShell>
  );
}

// =============== 03 CATÁLOGO ===============
function CatalogScreen({ dark = false }) {
  const T = theme(dark);
  const products = [
    { kind: "panfleto", title: "Panfletos", tag: "Mais pedido", color: "green", desc: "A6, A5, A4 · couché ou offset · 4×4", price: "R$ 89/milheiro" },
    { kind: "banner", title: "Banners", tag: "Eventos", color: "orange", desc: "Lona 440g, oxford ou vinil adesivo", price: "R$ 49/m²" },
    { kind: "bloco", title: "Blocos", tag: "Comércio", color: "purple", desc: "1 ou 2 vias, numerado, carbonado", price: "R$ 12/unidade" },
    { kind: "apostila", title: "Apostilas", tag: "Escolar", color: "blue", desc: "Espiral, wire-o ou costurada", price: "R$ 18/unidade" },
  ];
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "8px 20px 4px" }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: T.text }}>Catálogo</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>4 produtos · preço fechado por tiragem</div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px 4px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.surface, borderRadius: 10,
            border: `1px solid ${T.borderStrong}`,
            padding: "10px 12px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input
              placeholder="Buscar produto, papel, formato…"
              style={{
                border: 0, background: "transparent", outline: "none", flex: 1,
                fontSize: 14, fontFamily: AG.font, color: T.text,
              }}/>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: "12px 20px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
          {["Tudo", "Promo", "24h", "Pequena tiragem", "Grande tiragem"].map((p, i) => (
            <div key={p} style={{
              fontSize: 12, fontWeight: 600,
              padding: "6px 12px", borderRadius: 9999,
              background: i === 0 ? (dark ? AG.green : AG.ink) : "transparent",
              color: i === 0 ? (dark ? AG.ink : "#fff") : T.textMuted,
              border: i === 0 ? `1px solid ${dark ? AG.green : AG.ink}` : `1px solid ${T.border}`,
              whiteSpace: "nowrap",
            }}>{p}</div>
          ))}
        </div>

        {/* Cards */}
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {products.map(p => (
            <div key={p.kind} style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 12, display: "flex", gap: 12,
            }}>
              <div style={{ width: 96, flexShrink: 0, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <ProductGlyph kind={p.kind} size={130} dark={dark}/>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <Tag color={p.color}>{p.tag}</Tag>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6, letterSpacing: -0.2, color: T.text }}>{p.title}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ flex: 1 }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: dark ? AG.green : AG.greenDark }}>{p.price}</div>
                  <button style={{
                    background: dark ? AG.green : AG.ink, color: dark ? AG.ink : "#fff", border: 0, borderRadius: 9999,
                    padding: "6px 12px", fontSize: 12, fontWeight: 600,
                  }}>Pedir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomTabBar active="shop" badge={{ chat: 2 }} dark={dark}/>
    </PhoneShell>
  );
}

// =============== 04 PRODUTO DETALHE ===============
function ProductDetailScreen({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 120 }}>
        {/* Top nav */}
        <div style={{ padding: "8px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Panfletos</div>
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.8"><path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z"/></svg>
          </button>
        </div>

        {/* Hero illustration */}
        <div style={{ margin: "0 20px", height: 200, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
          <ProductGlyph kind="panfleto" size={420} dark={dark}/>
          <div style={{ position: "absolute", left: 12, top: 12 }}>
            <Tag color="soft">Mais pedido</Tag>
          </div>
        </div>

        {/* Title + price */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: T.text }}>Panfletos A5</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 6 }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Couché 115g · 4×4 cores · entrega 48h</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>R$ 189<span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>,00</span></div>
          </div>
        </div>

        {/* Options */}
        <div style={{ padding: "20px 20px 0" }}>
          <OptionGroup label="Quantidade" options={["500", "1.000", "2.500", "5.000"]} active={1} dark={dark}/>
          <OptionGroup label="Formato" options={["A6", "A5", "A4"]} active={1} dark={dark}/>
          <OptionGroup label="Papel" options={["Couché 115g", "Couché 150g", "Offset 90g"]} active={0} dark={dark}/>
          <OptionGroup label="Cores" options={["4×0 frente", "4×4 frente e verso"]} active={1} dark={dark}/>
        </div>

        {/* Files */}
        <div style={{ padding: "8px 20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>Arquivo</div>
          <div style={{
            border: `1.5px dashed ${T.borderStrong}`, borderRadius: 10,
            padding: 16, display: "flex", alignItems: "center", gap: 12,
            background: T.surface,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: dark ? "#003d2a" : AG.greenSoft, color: dark ? AG.green : AG.greenDark,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Enviar arte (PDF, PNG, Canva)</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>ou peça pra gente diagramar — sai por +R$ 60</div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }}/>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: T.bg, borderTop: `1px solid ${T.border}`,
        padding: "12px 20px 30px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <button style={{
          width: 44, height: 44, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={dark ? AG.green : AG.greenDark}>
            <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 .5C5.4.5 0 5.9 0 12.5c0 2.2.6 4.3 1.7 6.1L0 24l5.5-1.7c1.8 1 3.9 1.5 6 1.5h.5c6.6 0 12-5.4 12-12s-5.4-12-12-12z"/>
          </svg>
        </button>
        <button style={{
          flex: 1, background: AG.green, color: AG.ink, border: 0,
          borderRadius: 9999, padding: "12px 20px", fontSize: 14, fontWeight: 600,
        }}>Adicionar ao pedido · R$ 189</button>
      </div>
    </PhoneShell>
  );
}

function OptionGroup({ label, options, active, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((o, i) => {
          const isActive = i === active;
          return (
            <div key={o} style={{
              padding: "8px 14px", borderRadius: 9999,
              border: isActive ? `2px solid ${AG.green}` : `1px solid ${T.borderStrong}`,
              background: isActive ? (dark ? "#003d2a" : AG.surfaceFeature) : T.bgElevated,
              color: isActive ? (dark ? AG.green : AG.greenDark) : T.text,
              fontSize: 13, fontWeight: isActive ? 600 : 500,
            }}>{o}</div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { WelcomeScreen, HomeScreen, CatalogScreen, ProductDetailScreen, OptionGroup });
