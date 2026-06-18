import { useState, useRef, useEffect, useCallback } from "react";
import {
  uploadContract,
  analyzeContract,
  sendChatMessage,
  compareContracts,
  downloadReport,
} from "../services/api.js";

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  obsidian:"#0A0A0F", ink:"#111118", slate:"#1A1A26", border:"#2E2E4A",
  gold:"#C9A84C", goldLight:"#E8C96A", goldDim:"#8A6E2F", amber:"#E8A835",
  cream:"#F0E6D0", text:"#E8E0D0", textMuted:"#8A8470", textDim:"#5A5445",
  red:"#E05252", redDim:"#8B2E2E", orange:"#E8823A", orangeDim:"#8B4E1E",
  green:"#4CAF78", blue:"#5B8FE8", purple:"#9B6BE8",
};

const SEV = {
  HIGH:   { color: P.red,    bg: "#8B2E2E40", label: "High Risk"   },
  MEDIUM: { color: P.orange, bg: "#8B4E1E40", label: "Medium Risk" },
  LOW:    { color: P.amber,  bg: "#8A6E2F40", label: "Low Risk"    },
};

const TYPE_COLORS = {
  Payment: P.blue, IP: P.purple, Termination: P.red, Liability: P.orange,
  Confidentiality: P.amber, "Governing Law": P.green, Amendment: P.gold,
  Services: P.blue, Privacy: P.purple, General: P.textMuted,
};

const ANALYZE_STEPS = [
  "Extracting text…", "Parsing clauses…", "Running AI analysis…",
  "Detecting risks…", "Scoring severity…", "Generating report…",
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function LegalEase() {
  const [page, setPage]               = useState("home");
  const [file, setFile]               = useState(null);
  const [contractId, setContractId]   = useState(null);
  const [analysisId, setAnalysisId]   = useState(null);
  const [progress, setProgress]       = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult]           = useState(null);
  const [activeClause, setActiveClause] = useState(null);
  const [activeTab, setActiveTab]     = useState("overview");
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [language, setLanguage]       = useState("en");
  const [filterSev, setFilterSev]     = useState("ALL");
  const [filterType, setFilterType]   = useState("ALL");
  const [showSuggestion, setShowSuggestion] = useState(null);
  const [compareText, setCompareText] = useState("");
  const [error, setError]             = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileRef    = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // ── File handling ───────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setPage("upload"); setError(null); }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPage("upload"); setError(null); }
  };

  // ── Upload + Analyze ────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    setPage("analyzing");
    setProgress(0);
    setProgressStep(0);
    setError(null);

    try {
      // Step 1: Upload
      setProgressStep(0);
      let cId = contractId;
      if (!contractId || file?.name !== "demo") {
        const upRes = await uploadContract(file, (p) => {
          setUploadProgress(p);
          setProgress(Math.round(p * 0.2)); // upload = first 20%
        });
        cId = upRes.data.contractId;
        setContractId(cId);
      }

      // Steps 2-6: Analyze (simulate step progress while waiting)
      const ticker = setInterval(() => {
        setProgressStep((s) => Math.min(s + 1, ANALYZE_STEPS.length - 1));
        setProgress((p) => Math.min(p + 12, 90));
      }, 600);

      const res = await analyzeContract(cId, { language });
      clearInterval(ticker);

      setProgress(100);
      setProgressStep(ANALYZE_STEPS.length - 1);
      setResult(res.data);
      setAnalysisId(res.data.analysisId);

      await new Promise((r) => setTimeout(r, 300));
      setPage("analysis");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Analysis failed");
      setPage("upload");
    }
  };

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await sendChatMessage(contractId, msg, chatMessages, language);
      setChatMessages((m) => [...m, { role: "assistant", content: res.data.answer }]);
    } catch {
      setChatMessages((m) => [...m, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const clauses       = result?.clauses || [];
  const filtered      = clauses.filter(
    (c) => (filterSev === "ALL" || c.severity === filterSev) &&
           (filterType === "ALL" || c.type === filterType)
  );
  const clauseTypes   = [...new Set(clauses.map((c) => c.type))];
  const highCount     = clauses.filter((c) => c.severity === "HIGH").length;
  const medCount      = clauses.filter((c) => c.severity === "MEDIUM").length;
  const lowCount      = clauses.filter((c) => c.severity === "LOW").length;
  const score         = result?.healthScore || 0;
  const scoreColor    = score < 30 ? P.red : score < 60 ? P.orange : P.green;
  const scoreLabel    = score < 30 ? "Dangerous" : score < 50 ? "High Risk" : score < 75 ? "Moderate" : "Safe";

  const summary =
    result?.summary
      ? typeof result.summary === "object"
        ? result.summary.detailed_summary || result.summary.short_summary || ""
        : String(result.summary)
      : "";

  // ── Shared styles ───────────────────────────────────────────────────────────
  const card = (extra = {}) => ({
    background: `${P.slate}60`, border: `1px solid ${P.border}`,
    borderRadius: "12px", padding: "24px", ...extra,
  });

  const btn = (primary = false) => ({
    padding: primary ? "13px 28px" : "10px 20px",
    background: primary ? `linear-gradient(135deg, ${P.gold}, ${P.amber})` : "transparent",
    border: primary ? "none" : `1px solid ${P.border}`,
    borderRadius: "8px", color: primary ? P.obsidian : P.text,
    fontSize: primary ? "15px" : "13px", fontWeight: primary ? "700" : "400",
    cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
  });

  const label = { fontSize: "11px", letterSpacing: "0.2em", color: P.gold, textTransform: "uppercase", marginBottom: "12px" };

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (page === "home") return (
    <div style={{ minHeight:"100vh", background:P.obsidian, position:"relative", overflow:"hidden" }} onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet"/>
      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 80% 60% at 20% -10%,${P.goldDim}18 0%,transparent 60%),radial-gradient(ellipse 60% 80% at 80% 110%,#2E4E8A15 0%,transparent 55%)`}}/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",opacity:0.025,backgroundImage:`linear-gradient(${P.gold} 1px,transparent 1px),linear-gradient(90deg,${P.gold} 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>

      {/* Nav */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:`${P.ink}E8`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:"60px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"32px",height:"32px",background:`linear-gradient(135deg,${P.gold},${P.amber})`,borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"700",color:P.obsidian,fontFamily:"monospace"}}>§</div>
          <span style={{fontSize:"18px",fontWeight:"600",color:P.cream,letterSpacing:"0.05em"}}>LegalEase</span>
        </div>
        <button onClick={()=>fileRef.current?.click()} style={{...btn(true),padding:"7px 18px",fontSize:"13px"}}>Upload</button>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} style={{display:"none"}}/>
      </nav>

      {/* Hero */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"80px 24px 40px",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",maxWidth:"700px",marginBottom:"64px"}}>
          <div style={{fontSize:"11px",letterSpacing:"0.35em",color:P.gold,marginBottom:"24px",textTransform:"uppercase"}}>◆ AI-Powered Contract Intelligence</div>
          <h1 style={{fontSize:"clamp(42px,6vw,72px)",fontWeight:"400",lineHeight:"1.1",color:P.cream,margin:"0 0 24px",fontFamily:"'Crimson Pro',serif"}}>
            Read Contracts<br/><span style={{color:P.gold,fontStyle:"italic"}}>Like a Lawyer</span>
          </h1>
          <p style={{fontSize:"18px",color:P.textMuted,lineHeight:"1.7",maxWidth:"500px",margin:"0 auto 40px"}}>
            Upload any contract. Get instant AI risk analysis, plain-English explanations, and multilingual summaries — in seconds.
          </p>
          <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>fileRef.current?.click()} style={btn(true)}>Upload Contract</button>
            <button onClick={()=>{setFile({name:"sample-risky-contract.txt"});setPage("upload");}} style={btn()}>Try Demo</button>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} style={{display:"none"}}/>
        </div>

        {/* Feature grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"16px",maxWidth:"900px",width:"100%"}}>
          {[
            {icon:"⚖",title:"Risk Detection",desc:"Identify unfair clauses automatically"},
            {icon:"🌐",title:"3 Languages",desc:"English, Hindi & Tamil"},
            {icon:"💬",title:"AI Chat",desc:"Ask anything about your contract"},
            {icon:"📊",title:"Health Score",desc:"0–100 contract safety rating"},
          ].map((f)=>(
            <div key={f.title} style={{background:`${P.slate}80`,border:`1px solid ${P.border}`,borderRadius:"12px",padding:"24px",textAlign:"center"}}>
              <div style={{fontSize:"26px",marginBottom:"10px"}}>{f.icon}</div>
              <div style={{fontSize:"14px",fontWeight:"600",color:P.cream,marginBottom:"6px"}}>{f.title}</div>
              <div style={{fontSize:"13px",color:P.textMuted}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── UPLOAD ──────────────────────────────────────────────────────────────────
  if (page === "upload") return (
    <div style={{minHeight:"100vh",background:P.obsidian,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Crimson Pro',serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:"560px",width:"100%",textAlign:"center"}}>
        <div onClick={()=>setPage("home")} style={{fontSize:"13px",color:P.textMuted,marginBottom:"24px",cursor:"pointer"}}>← Back</div>
        <h2 style={{fontSize:"32px",fontWeight:"400",color:P.cream,marginBottom:"6px"}}>Ready to Analyze</h2>
        <p style={{color:P.textMuted,marginBottom:"32px",fontSize:"15px"}}>{file?.name}</p>

        {error && (
          <div style={{background:`${P.red}20`,border:`1px solid ${P.red}40`,borderRadius:"8px",padding:"12px 16px",marginBottom:"20px",fontSize:"13px",color:P.red,textAlign:"left"}}>
            ⚠ {error}
          </div>
        )}

        <div style={{...card(),marginBottom:"24px"}}>
          <div style={label}>Output Language</div>
          <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}}>
            {[["en","English"],["hi","हिंदी"],["ta","தமிழ்"]].map(([l,name])=>(
              <button key={l} onClick={()=>setLanguage(l)} style={{padding:"8px 18px",borderRadius:"6px",border:`1px solid ${language===l?P.gold:P.border}`,background:language===l?`${P.gold}22`:"transparent",color:language===l?P.goldLight:P.textMuted,cursor:"pointer",fontSize:"14px",fontFamily:"inherit",transition:"all 0.15s"}}>{name}</button>
            ))}
          </div>
          <div style={{marginTop:"20px",background:`${P.obsidian}80`,borderRadius:"8px",padding:"16px",fontSize:"13px",color:P.textMuted,textAlign:"left"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><span>File</span><span style={{color:P.cream}}>{file?.name}</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Language</span><span style={{color:P.gold}}>{language==="en"?"English":language==="hi"?"Hindi":"Tamil"}</span></div>
          </div>
        </div>

        <button onClick={runAnalysis} style={{...btn(true),width:"100%",padding:"15px"}}>Run AI Analysis</button>
        <button onClick={()=>{setFile(null);setError(null);setPage("home");}} style={{...btn(),width:"100%",marginTop:"8px",borderColor:"transparent",color:P.textMuted}}>Cancel</button>
      </div>
    </div>
  );

  // ── ANALYZING ───────────────────────────────────────────────────────────────
  if (page === "analyzing") return (
    <div style={{minHeight:"100vh",background:P.obsidian,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Crimson Pro',serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:"460px",width:"100%",textAlign:"center",padding:"24px"}}>
        <div style={{width:"80px",height:"80px",margin:"0 auto 32px",position:"relative"}}>
          <svg width="80" height="80" style={{animation:"spin 2s linear infinite"}}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <circle cx="40" cy="40" r="36" fill="none" stroke={P.border} strokeWidth="3"/>
            <circle cx="40" cy="40" r="36" fill="none" stroke={P.gold} strokeWidth="3" strokeDasharray="60 166" strokeLinecap="round"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"700",color:P.gold,fontFamily:"monospace"}}>{progress}%</div>
        </div>
        <h2 style={{fontSize:"28px",fontWeight:"400",color:P.cream,marginBottom:"8px"}}>Analyzing Contract</h2>
        <p style={{color:P.gold,marginBottom:"32px",fontSize:"14px"}}>{ANALYZE_STEPS[progressStep]}</p>
        <div style={{background:`${P.slate}60`,borderRadius:"4px",height:"4px",overflow:"hidden",marginBottom:"24px"}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,${P.gold},${P.amber})`,width:`${progress}%`,transition:"width 0.5s ease",borderRadius:"4px"}}/>
        </div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"center"}}>
          {ANALYZE_STEPS.map((s,i)=>(
            <span key={s} style={{padding:"3px 9px",borderRadius:"20px",fontSize:"11px",border:`1px solid ${i<progressStep?P.goldDim:P.border}`,color:i<progressStep?P.gold:P.textDim,background:i<progressStep?`${P.gold}15`:"transparent"}}>
              {i<progressStep?"✓ ":""}{s.replace("…","")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ANALYSIS ────────────────────────────────────────────────────────────────
  if (page === "analysis" && result) return (
    <div style={{minHeight:"100vh",background:P.obsidian,fontFamily:"'Crimson Pro',serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet"/>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      {/* Top Nav */}
      <nav style={{background:`${P.ink}F0`,borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"56px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}} onClick={()=>{setPage("home");setResult(null);setFile(null);setContractId(null);}}>
          <div style={{width:"28px",height:"28px",background:`linear-gradient(135deg,${P.gold},${P.amber})`,borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700",color:P.obsidian}}>§</div>
          <span style={{fontSize:"16px",fontWeight:"600",color:P.cream}}>LegalEase</span>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {[["en","EN"],["hi","हि"],["ta","த"]].map(([l,label])=>(
            <button key={l} onClick={()=>setLanguage(l)} style={{padding:"4px 9px",borderRadius:"4px",fontSize:"12px",cursor:"pointer",border:`1px solid ${language===l?P.gold:P.border}`,background:language===l?`${P.gold}22`:"transparent",color:language===l?P.goldLight:P.textMuted,fontFamily:"inherit"}}>{label}</button>
          ))}
          <button onClick={()=>setChatOpen(c=>!c)} style={{marginLeft:"8px",padding:"5px 14px",borderRadius:"6px",border:`1px solid ${chatOpen?P.gold+"60":P.border}`,background:chatOpen?`${P.gold}15`:"transparent",color:chatOpen?P.gold:P.textMuted,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>AI Chat</button>
          <button onClick={()=>downloadReport(analysisId,file?.name)} style={{padding:"5px 14px",borderRadius:"6px",border:`1px solid ${P.border}`,background:"transparent",color:P.textMuted,cursor:"pointer",fontSize:"13px",fontFamily:"inherit"}}>⬇ Report</button>
        </div>
      </nav>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <div style={{width:"290px",flexShrink:0,background:P.ink,borderRight:`1px solid ${P.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Score */}
          <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${P.border}`}}>
            <div style={{fontSize:"10px",letterSpacing:"0.2em",color:P.textMuted,marginBottom:"10px",textTransform:"uppercase"}}>Contract Health</div>
            <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
              <div style={{position:"relative",width:"60px",height:"60px",flexShrink:0}}>
                <svg width="60" height="60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke={P.border} strokeWidth="5"/>
                  <circle cx="30" cy="30" r="26" fill="none" stroke={scoreColor} strokeWidth="5"
                    strokeDasharray={`${score/100*163} 163`} strokeLinecap="round" transform="rotate(-90 30 30)"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700",color:scoreColor,fontFamily:"monospace"}}>{score}</div>
              </div>
              <div>
                <div style={{fontSize:"17px",fontWeight:"600",color:scoreColor}}>{scoreLabel}</div>
                <div style={{fontSize:"11px",color:P.textMuted,marginTop:"2px"}}>
                  {score<30?"Do not sign without review":score<60?"Review before signing":"Generally safe"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${P.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",textAlign:"center"}}>
              {[[highCount,"High",P.red],[medCount,"Med",P.orange],[lowCount,"Low",P.amber]].map(([n,l,c])=>(
                <div key={l} style={{background:`${P.slate}60`,borderRadius:"6px",padding:"8px 4px"}}>
                  <div style={{fontSize:"20px",fontWeight:"700",color:c,fontFamily:"monospace"}}>{n}</div>
                  <div style={{fontSize:"9px",color:P.textMuted,marginTop:"1px"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div style={{padding:"10px 16px 6px",borderBottom:`1px solid ${P.border}`}}>
            <div style={{fontSize:"9px",letterSpacing:"0.15em",color:P.textDim,marginBottom:"6px",textTransform:"uppercase"}}>Filter</div>
            <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>
              {["ALL","HIGH","MEDIUM","LOW"].map((s)=>(
                <button key={s} onClick={()=>setFilterSev(s)} style={{padding:"2px 7px",borderRadius:"3px",fontSize:"10px",border:`1px solid ${filterSev===s?P.gold:P.border}`,background:filterSev===s?`${P.gold}20`:"transparent",color:filterSev===s?P.gold:P.textMuted,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>
              ))}
            </div>
          </div>

          {/* Clause list */}
          <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
            {filtered.map((c)=>{
              const cfg=SEV[c.severity]||SEV.LOW;
              const isActive=activeClause?.id===c.id;
              return (
                <div key={c.id} onClick={()=>setActiveClause(isActive?null:c)} style={{padding:"10px",borderRadius:"7px",marginBottom:"3px",cursor:"pointer",border:`1px solid ${isActive?P.gold+"50":P.border}`,background:isActive?`${P.gold}10`:`${P.slate}40`,transition:"all 0.12s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:"6px",alignItems:"flex-start"}}>
                    <div style={{fontSize:"12px",fontWeight:"500",color:P.cream,lineHeight:"1.3",flex:1}}>{c.title}</div>
                    <span style={{padding:"2px 5px",borderRadius:"3px",fontSize:"9px",fontWeight:"700",background:cfg.bg,color:cfg.color,whiteSpace:"nowrap",flexShrink:0}}>{c.severity}</span>
                  </div>
                  <div style={{marginTop:"5px"}}>
                    <span style={{padding:"2px 6px",borderRadius:"3px",fontSize:"10px",background:`${TYPE_COLORS[c.type]||P.blue}20`,color:TYPE_COLORS[c.type]||P.blue,border:`1px solid ${TYPE_COLORS[c.type]||P.blue}30`}}>{c.type}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{padding:"10px",borderTop:`1px solid ${P.border}`}}>
            <button onClick={()=>setChatOpen(true)} style={{width:"100%",padding:"9px",background:`${P.gold}18`,border:`1px solid ${P.gold}40`,borderRadius:"7px",color:P.gold,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>Ask AI About This Contract</button>
          </div>
        </div>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Tabs */}
          <div style={{background:P.ink,borderBottom:`1px solid ${P.border}`,display:"flex",flexShrink:0}}>
            {[["overview","Overview"],["document","Document"],["compare","Compare"],["report","Full Report"]].map(([k,v])=>(
              <button key={k} onClick={()=>setActiveTab(k)} style={{padding:"13px 18px",background:"none",border:"none",borderBottom:`2px solid ${activeTab===k?P.gold:"transparent"}`,color:activeTab===k?P.gold:P.textMuted,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",transition:"all 0.15s"}}>{v}</button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto"}}>

            {/* OVERVIEW TAB */}
            {activeTab==="overview" && (
              <div style={{padding:"28px"}}>
                <h2 style={{fontSize:"24px",fontWeight:"400",color:P.cream,marginBottom:"4px"}}>Analysis Overview</h2>
                <p style={{color:P.textMuted,fontSize:"13px",marginBottom:"28px"}}>{file?.name}</p>

                {summary && (
                  <div style={{...card(),marginBottom:"20px"}}>
                    <div style={label}>AI Summary</div>
                    <p style={{color:P.text,lineHeight:"1.75",fontSize:"15px",margin:0}}>{summary}</p>
                  </div>
                )}

                <div style={{...card(),marginBottom:"20px"}}>
                  <div style={label}>Risk Distribution</div>
                  <div style={{display:"flex",gap:"10px",marginBottom:"14px"}}>
                    {[[highCount,"High Risk",P.red],[medCount,"Medium Risk",P.orange],[lowCount,"Low Risk",P.amber]].map(([n,l,c])=>(
                      <div key={l} style={{flex:1,background:`${c}18`,border:`1px solid ${c}40`,borderRadius:"8px",padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:"28px",fontWeight:"700",color:c,fontFamily:"monospace"}}>{n}</div>
                        <div style={{fontSize:"11px",color:P.textMuted,marginTop:"3px"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:"10px",borderRadius:"5px",overflow:"hidden",background:P.slate,display:"flex"}}>
                    {clauses.length>0 && [[highCount,P.red],[medCount,P.orange],[lowCount,P.amber]].map(([n,c],i)=>(
                      <div key={i} style={{height:"100%",width:`${n/clauses.length*100}%`,background:c}}/>
                    ))}
                  </div>
                </div>

                <div style={card()}>
                  <div style={label}>Clause Categories</div>
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    {clauseTypes.map((t)=>{
                      const count=clauses.filter((c)=>c.type===t).length;
                      const color=TYPE_COLORS[t]||P.blue;
                      const active=filterType===t;
                      return (
                        <div key={t} onClick={()=>setFilterType(active?"ALL":t)} style={{padding:"7px 13px",borderRadius:"6px",background:active?`${color}30`:`${color}15`,border:`1px solid ${color}${active?"60":"30"}`,cursor:"pointer",fontSize:"13px",color,transition:"all 0.15s"}}>
                          {t} <span style={{fontFamily:"monospace",fontSize:"11px",opacity:0.8}}>({count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT TAB */}
            {activeTab==="document" && (
              <div style={{padding:"28px"}}>
                <h2 style={{fontSize:"22px",fontWeight:"400",color:P.cream,marginBottom:"20px"}}>Contract Document</h2>
                <div style={{display:"flex",gap:"20px",alignItems:"flex-start"}}>
                  <div style={{flex:1,background:`${P.slate}40`,border:`1px solid ${P.border}`,borderRadius:"10px",padding:"20px",fontSize:"13px",lineHeight:"1.85",color:P.text,maxHeight:"62vh",overflowY:"auto"}}>
                    <p style={{whiteSpace:"pre-wrap",fontFamily:"'Crimson Pro',serif"}}>{result.contractText || "(Contract text not available in this view — use the Overview or Report tabs)"}</p>
                  </div>
                  {activeClause && (
                    <div style={{width:"280px",flexShrink:0,background:`${P.slate}80`,border:`1px solid ${SEV[activeClause.severity]?.color}50`,borderRadius:"10px",padding:"18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                        <span style={{padding:"3px 7px",borderRadius:"3px",fontSize:"10px",fontWeight:"700",background:SEV[activeClause.severity]?.bg,color:SEV[activeClause.severity]?.color}}>{activeClause.severity} RISK</span>
                        <button onClick={()=>setActiveClause(null)} style={{background:"none",border:"none",color:P.textMuted,cursor:"pointer",fontSize:"18px",lineHeight:1}}>×</button>
                      </div>
                      <div style={{fontSize:"14px",fontWeight:"600",color:P.cream,marginBottom:"10px"}}>{activeClause.title}</div>
                      <div style={{fontSize:"10px",letterSpacing:"0.1em",color:P.gold,marginBottom:"7px",textTransform:"uppercase"}}>What it means for you</div>
                      <div style={{fontSize:"12px",color:P.text,lineHeight:"1.6",marginBottom:"14px"}}>{activeClause.explanation}</div>
                      {activeClause.suggestion && (
                        <button onClick={()=>setShowSuggestion(activeClause)} style={{width:"100%",padding:"7px",background:`${P.gold}18`,border:`1px solid ${P.gold}40`,borderRadius:"5px",color:P.gold,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>See Safer Wording ✦</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMPARE TAB */}
            {activeTab==="compare" && (
              <div style={{padding:"28px"}}>
                <h2 style={{fontSize:"22px",fontWeight:"400",color:P.cream,marginBottom:"6px"}}>Contract Comparison</h2>
                <p style={{color:P.textMuted,fontSize:"13px",marginBottom:"22px"}}>Paste a second contract version to compare changes</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <div>
                    <div style={{fontSize:"10px",letterSpacing:"0.15em",color:P.gold,marginBottom:"7px",textTransform:"uppercase"}}>Contract A (Current)</div>
                    <div style={{background:`${P.slate}40`,border:`1px solid ${P.border}`,borderRadius:"8px",padding:"14px",fontSize:"12px",color:P.textMuted,maxHeight:"380px",overflowY:"auto",lineHeight:"1.65",whiteSpace:"pre-wrap"}}>
                      {(result.contractText || summary || "").slice(0,600)}…
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:"10px",letterSpacing:"0.15em",color:P.gold,marginBottom:"7px",textTransform:"uppercase"}}>Contract B (Paste here)</div>
                    <textarea value={compareText} onChange={(e)=>setCompareText(e.target.value)} placeholder="Paste second contract version here…" style={{width:"100%",height:"380px",background:`${P.slate}40`,border:`1px solid ${P.border}`,borderRadius:"8px",padding:"14px",fontSize:"12px",color:P.text,resize:"none",fontFamily:"'Crimson Pro',serif",lineHeight:"1.65",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                </div>
                <button style={{marginTop:"14px",...btn(true)}}>Compare Contracts</button>
              </div>
            )}

            {/* REPORT TAB */}
            {activeTab==="report" && (
              <div style={{padding:"28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"22px"}}>
                  <h2 style={{fontSize:"22px",fontWeight:"400",color:P.cream}}>Full Risk Report</h2>
                  <button onClick={()=>downloadReport(analysisId,file?.name)} style={btn(true)}>⬇ Download PDF</button>
                </div>
                {clauses.map((c)=>{
                  const cfg=SEV[c.severity]||SEV.LOW;
                  return (
                    <div key={c.id} style={{background:`${P.slate}40`,border:`1px solid ${P.border}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:"8px",padding:"18px",marginBottom:"14px"}}>
                      <div style={{display:"flex",gap:"7px",marginBottom:"10px",flexWrap:"wrap"}}>
                        <span style={{padding:"2px 7px",borderRadius:"3px",fontSize:"10px",background:cfg.bg,color:cfg.color,fontWeight:"700"}}>{c.severity}</span>
                        <span style={{padding:"2px 7px",borderRadius:"3px",fontSize:"10px",background:`${TYPE_COLORS[c.type]||P.blue}20`,color:TYPE_COLORS[c.type]||P.blue}}>{c.type}</span>
                      </div>
                      <div style={{fontSize:"15px",fontWeight:"600",color:P.cream,marginBottom:"9px"}}>{c.title}</div>
                      {c.text && <div style={{background:`${P.obsidian}60`,padding:"9px 12px",borderRadius:"5px",fontSize:"12px",color:P.textMuted,fontStyle:"italic",marginBottom:"10px",lineHeight:"1.55"}}>"{c.text.slice(0,280)}{c.text.length>280?"…":""}"</div>}
                      {c.explanation && <div style={{fontSize:"13px",color:P.text,lineHeight:"1.6",marginBottom:"8px"}}><strong style={{color:cfg.color}}>Risk: </strong>{c.explanation}</div>}
                      {c.suggestion && <div style={{fontSize:"13px",color:P.green,lineHeight:"1.6"}}><strong>Suggestion: </strong>{c.suggestion}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat Panel ────────────────────────────────────────────────────────── */}
      {chatOpen && (
        <div style={{position:"fixed",bottom:"20px",right:"20px",width:"370px",height:"510px",background:P.ink,border:`1px solid ${P.border}`,borderRadius:"14px",display:"flex",flexDirection:"column",zIndex:200}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${P.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"14px",fontWeight:"600",color:P.cream}}>LegalEase AI</div>
              <div style={{fontSize:"11px",color:P.green,marginTop:"1px"}}>● Online · Contract Q&A</div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{background:"none",border:"none",color:P.textMuted,cursor:"pointer",fontSize:"20px",lineHeight:1}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
            {chatMessages.length===0 && (
              <div style={{textAlign:"center",padding:"20px 12px"}}>
                <div style={{fontSize:"26px",marginBottom:"10px"}}>⚖</div>
                <div style={{fontSize:"12px",color:P.textMuted,lineHeight:"1.6",marginBottom:"14px"}}>Ask me anything about your contract.</div>
                {["Is it safe to sign this?","What's the biggest risk?","Explain the termination clause"].map((q)=>(
                  <button key={q} onClick={()=>setChatInput(q)} style={{display:"block",width:"100%",padding:"7px 10px",background:`${P.slate}80`,border:`1px solid ${P.border}`,borderRadius:"6px",color:P.textMuted,fontSize:"12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",marginBottom:"4px"}}>{q}</button>
                ))}
              </div>
            )}
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"3px 12px 12px 12px",background:m.role==="user"?`${P.gold}22`:P.slate,border:`1px solid ${m.role==="user"?P.gold+"40":P.border}`,fontSize:"13px",color:P.text,lineHeight:"1.6"}}>{m.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={{display:"flex",gap:"4px",padding:"9px 13px",background:P.slate,borderRadius:"3px 12px 12px 12px",width:"fit-content",border:`1px solid ${P.border}`}}>
                {[0,1,2].map((i)=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:P.gold,animation:`bounce 0.8s ${i*0.15}s infinite`,opacity:0.7}}/>)}
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${P.border}`,display:"flex",gap:"7px"}}>
            <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&sendChat()} placeholder="Ask about this contract…" style={{flex:1,padding:"9px 13px",background:`${P.slate}80`,border:`1px solid ${P.border}`,borderRadius:"7px",color:P.text,fontSize:"13px",outline:"none",fontFamily:"inherit"}}/>
            <button onClick={sendChat} style={{padding:"9px 15px",background:`linear-gradient(135deg,${P.gold},${P.amber})`,border:"none",borderRadius:"7px",color:P.obsidian,cursor:"pointer",fontWeight:"700",fontSize:"14px"}}>→</button>
          </div>
        </div>
      )}

      {/* ── Suggestion Modal ────────────────────────────────────────────────── */}
      {showSuggestion && (
        <div style={{position:"fixed",inset:0,background:`${P.obsidian}CC`,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSuggestion(null)}>
          <div style={{background:P.ink,border:`1px solid ${P.border}`,borderRadius:"14px",padding:"28px",maxWidth:"520px",width:"90%"}} onClick={(e)=>e.stopPropagation()}>
            <div style={label}>Safer Alternative Wording</div>
            <div style={{fontSize:"17px",fontWeight:"500",color:P.cream,marginBottom:"18px"}}>{showSuggestion.title}</div>
            <div style={{marginBottom:"14px"}}>
              <div style={{fontSize:"10px",color:P.red,marginBottom:"7px",textTransform:"uppercase",letterSpacing:"0.1em"}}>Current (Risky)</div>
              <div style={{background:`${P.red}15`,border:`1px solid ${P.red}30`,borderRadius:"7px",padding:"12px",fontSize:"13px",color:P.text,lineHeight:"1.6",fontStyle:"italic"}}>"{showSuggestion.text}"</div>
            </div>
            <div style={{marginBottom:"22px"}}>
              <div style={{fontSize:"10px",color:P.green,marginBottom:"7px",textTransform:"uppercase",letterSpacing:"0.1em"}}>Suggested (Safer)</div>
              <div style={{background:`${P.green}15`,border:`1px solid ${P.green}30`,borderRadius:"7px",padding:"12px",fontSize:"13px",color:P.text,lineHeight:"1.6"}}>{showSuggestion.suggestion}</div>
            </div>
            <button onClick={()=>setShowSuggestion(null)} style={btn(true)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );

  return null;
}
