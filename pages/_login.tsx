import { useEffect, useState } from "react";
import Head from "next/head";

const BRAND = process.env.NEXT_PUBLIC_BRAND || "Noliktava";
const PRIMARY = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#437e12";
const ENABLE_LOCAL = process.env.NEXT_PUBLIC_ENABLE_LOCAL === "1";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [from, setFrom] = useState("/");

  useEffect(() => {
    const url = new URL(window.location.href);
    setFrom(url.searchParams.get("from") || "/");
  }, []);

  async function handleLocal(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u, p })
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      window.location.href = j.redirect || from || "/";
    } catch (e: any) {
      setErr(e.message || "Neizdevās ielogoties");
    }
  }

  return (
    <>
      <Head>
        <title>Login — {BRAND}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{minHeight:"100svh",display:"grid",placeItems:"center",background:"#0b0d0b",fontFamily:"ui-sans-serif,system-ui"}}>
        <div style={{width:"min(92vw,480px)",background:"rgba(20,22,20,0.92)",borderRadius:24,padding:24,boxShadow:"0 10px 40px rgba(0,0,0,.35)",border:`1px solid ${PRIMARY}`}}>
          <div style={{textAlign:"center",marginBottom:18}}>
            <div style={{fontSize:14,letterSpacing:1,color:"#c9e7cc"}}>CADET • {BRAND}</div>
            <h1 style={{margin:"6px 0 0",fontSize:28,color:"#fff",fontWeight:700}}>Piekļuve</h1>
            <p style={{margin:0,color:"#b7c2b8",fontSize:14}}>Izvēlies ielogošanās veidu</p>
          </div>

          <a
            href={`/api/auth/signin?callbackUrl=${encodeURIComponent(from||"/")}`}
            style={{display:"block",textDecoration:"none",textAlign:"center",padding:"12px 16px",borderRadius:12,background:PRIMARY,color:"#fff",fontWeight:700}}
          >
            Turpināt ar GitHub
          </a>

          {ENABLE_LOCAL && (
            <>
              <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}>
                <div style={{flex:1,height:1,background:"#2a2f2a"}}/>
                <div style={{color:"#8fa090",fontSize:12}}>vai lokālais</div>
                <div style={{flex:1,height:1,background:"#2a2f2a"}}/>
              </div>

              <form onSubmit={handleLocal}>
                <label style={{display:"block",color:"#cfd7cf",fontSize:12,marginBottom:4}}>Lietotājs</label>
                <input value={u} onChange={e=>setU(e.target.value)} required placeholder="lietotājs"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #2f372f",background:"#111",color:"#e6f1e6"}} />
                <label style={{display:"block",color:"#cfd7cf",fontSize:12,margin:"12px 0 4px"}}>Parole</label>
                <input value={p} onChange={e=>setP(e.target.value)} required type="password" placeholder="parole"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #2f372f",background:"#111",color:"#e6f1e6"}} />
                {err && <div style={{color:"#ffb3b3",fontSize:12,marginTop:8}}>{err}</div>}
                <button type="submit" style={{width:"100%",marginTop:12,padding:"10px 12px",borderRadius:10,border:"1px solid #2f372f",background:"#1a1f1a",color:"#e6f1e6",fontWeight:700}}>Ielogoties</button>
              </form>
            </>
          )}

          <p style={{marginTop:16,color:"#7b8a7d",fontSize:12,textAlign:"center"}}>Iekšējā noliktavas sistēma.</p>
        </div>
      </div>
    </>
  );
}
