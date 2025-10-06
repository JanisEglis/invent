import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Item   = { id:string; nosaukums:string; skaits:number; vieniba:string; vieta:string };
type Person = { id:string; vards:string;   uzvards:string;   tips:string };
type Issue  = { id:string; personId:string; itemId:string; qty:number; ts:number };

export default function Dashboard(){
  // ─── Ielādējam demo datus no localStorage (te darbojas ar tavām /inventars, /personas, /izsniegumi lapām) ───
  const [inv, setInv]   = useState<Item[]>([]);
  const [per, setPer]   = useState<Person[]>([]);
  const [log, setLog]   = useState<Issue[]>([]);
  const [period, setPeriod] = useState<'daily'|'weekly'>('daily');
  const LOW = 3; // zema atlikuma robeža

  useEffect(()=>{
    if (typeof window === 'undefined') return;
    const i = localStorage.getItem('inventars');   if(i) setInv(JSON.parse(i));
    const p = localStorage.getItem('personas');    if(p) setPer(JSON.parse(p));
    const l = localStorage.getItem('izsniegumi');  if(l) setLog(JSON.parse(l));
  },[]);

  // ─── KPI aprēķini ───
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const last7 = now.getTime() - 7*24*60*60*1000;

  const totalSKU  = inv.length;
  const totalQty  = inv.reduce((a,b)=>a+(Number(b.skaits)||0),0);
  const lowStock  = inv.filter(x => (Number(x.skaits)||0) <= LOW).length;
  const issuedTodayQty = log.filter(e=>e.ts>=startOfToday).reduce((a,b)=>a+b.qty,0);
  const issued7dQty    = log.filter(e=>e.ts>=last7).reduce((a,b)=>a+b.qty,0);

  const recent = useMemo(()=>log.slice().sort((a,b)=>b.ts-a.ts).slice(0,10),[log]);
  const pName  = (id:string)=>{ const p = per.find(x=>x.id===id); return p ? `${p.vards} ${p.uzvards}` : '—'; };
  const iName  = (id:string)=>{ const i = inv.find(x=>x.id===id); return i ? i.nosaukums : '—'; };

  const fmtDate = (ts:number) => new Date(ts).toLocaleString('lv-LV');

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>CADET • Noliktava</h1>
            <small>Iekšējais panelis</small>
          </div>
        </div>

        <nav className="nav">
          <Link href="/" className="active"><span className="icon dots" /> Pārskats</Link>
          <Link href="/inventars">Inventārs</Link>
          <Link href="/personas">Personas</Link>
          <Link href="/izsniegumi">Izsniegumi</Link>
          <a href="#" onClick={e=>e.preventDefault()}>Atskaites</a>
          <a href="#" onClick={e=>e.preventDefault()}>Iestatījumi</a>
          <a href="/api/logout" style={{marginTop:6,opacity:.85}}>↩ Izrakstīties</a>
        </nav>
      </aside>

      {/* Main */}
      <section className="main">
        {/* Top bar */}
        <div className="topbar">
          <div className="search">
            <span>🔎</span>
            <input placeholder="Meklēt noliktavā…" />
          </div>
          <button className="btn" title="Iestatījumi">⚙️</button>
          <button className="btn" title="Paziņojumi">🔔</button>
          <div className="avatar">JE</div>
        </div>

        {/* Content */}
        <div className="container">
          <div className="cards">
            {/* Kopējais atlikums (gab.) */}
            <div className="card cols-4">
              <div className="label">Kopējais atlikums (gab.)</div>
              <div className="kpi">
                <div className="value">{totalQty.toLocaleString('lv-LV')}</div>
                <span className="pill up">+ pēd. 7d {issued7dQty.toLocaleString('lv-LV')}</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <div className="segment" role="tablist" aria-label="prognoze">
                  <button className="active">7d</button>
                  <button>30d</button>
                  <button>90d</button>
                </div>
                <Link className="btn" href="/inventars">Skatīt detalizēti</Link>
              </div>
            </div>

            {/* SKU skaits un zemais atlikums */}
            <div className="card cols-4">
              <div className="label">Preču pozīcijas (SKU)</div>
              <div className="kpi">
                <div className="value">{totalSKU}</div>
                <span className="pill down">zems atlikums: {lowStock}</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <Link href="/inventars" className="btn">Atvērt inventāru</Link>
              </div>
            </div>

            {/* Izsniegts šodien */}
            <div className="card cols-4">
              <div className="label">Izsniegts šodien</div>
              <div className="kpi">
                <div className="value">{issuedTodayQty}</div>
                <span className="pill up">pēd. 7d: {issued7dQty}</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <Link href="/izsniegumi" className="btn">Reģistrēt izsniegumu</Link>
              </div>
            </div>

            {/* Filtri */}
            <div className="card cols-12" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="actions" style={{gap:12}}>
                <div className="segment" role="tablist" aria-label="periods">
                  <button className={period==='daily'?'active':''}  onClick={()=>setPeriod('daily')}>Diena</button>
                  <button className={period==='weekly'?'active':''} onClick={()=>setPeriod('weekly')}>Nedēļa</button>
                </div>
                <div className="segment" role="tablist" aria-label="range">
                  <button className="active">Pēdējās 4 nedēļas</button>
                  <button>Pēdējie 3 mēneši</button>
                </div>
              </div>
              <button className="btn primary">Filtrs</button>
            </div>

            {/* Pēdējās darbības */}
            <div className="card cols-12">
              <div className="label">Pēdējās darbības</div>
              <table className="table">
                <thead>
                  <tr><th>Datums</th><th>Tips</th><th>Persona</th><th>Vienums</th><th>Daudzums</th></tr>
                </thead>
                <tbody>
                  {recent.length ? recent.map(e=>(
                    <tr key={e.id}>
                      <td>{fmtDate(e.ts)}</td>
                      <td>Izsniegts</td>
                      <td>{pName(e.personId)}</td>
                      <td>{iName(e.itemId)}</td>
                      <td>{e.qty}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{opacity:.7}}>Vēl nav ierakstu. Pievieno <Link href="/inventars">vienumus</Link> un reģistrē <Link href="/personas">personas</Link>, pēc tam veic <Link href="/izsniegumi">izsniegumu</Link>.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
