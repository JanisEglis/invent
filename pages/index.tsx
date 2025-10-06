import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/** ====== Datu tipi ====== */
type Item   = { id:string; nosaukums:string; skaits:number; vieniba:string; vieta:string; minAtlikums?:number };
type Person = { id:string; vards:string; uzvards:string; tips:'Jaunsargs'|'Instruktors'|'Cits' };
type MoveKind = 'SAŅEMTS'|'IZDOTS'|'ATGRIEZTS';
type PartnerType =
  | 'JAUNSARDZES_CENTRS'
  | 'VALIC'
  | 'INSTRUKTORS'
  | 'JAUNSARGS'
  | 'CITS';

type Move = {
  id:string; ts:number;
  kind:MoveKind;
  itemId:string; qty:number;
  partnerType:PartnerType;
  personId?:string;         // ja izsniegts/atgriezts personai
  partnerName?:string;      // ja CITS vai brīvs teksts (piem., vienības nosaukums)
};

const K_ITEMS='inventars';      // no /inventars lapas
const K_PERSONS='personas';     // no /personas lapas
const K_MOVES='darbibas';       // šeit glabāsim visus notikumus

/** ====== Palīgi ====== */
const uid = () => (typeof crypto!=='undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const nowTs = () => Date.now();

function useLocal<T>(key:string, def:T){
  const [val,setVal]=useState<T>(def);
  useEffect(()=>{ if(typeof window==='undefined')return;
    const r=localStorage.getItem(key); if(r) setVal(JSON.parse(r));
  },[key]);
  useEffect(()=>{ if(typeof window==='undefined')return;
    localStorage.setItem(key, JSON.stringify(val));
  },[key,val]);
  return [val,setVal] as const;
}

/** ====== Modālais logs ====== */
function Modal(props:{title:string; onClose:()=>void; children:React.ReactNode}){
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'grid',placeItems:'center',zIndex:50}}>
      <div className="card cols-6" style={{maxWidth:720,width:'min(92vw,720px)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h3 style={{margin:0}}>{props.title}</h3>
          <button className="btn" onClick={props.onClose}>✕</button>
        </div>
        <div className="hr" />
        {props.children}
      </div>
    </div>
  );
}

/** ====== Galvenais panelis ====== */
export default function Dashboard(){
  // Dati
  const [inv, setInv]     = useLocal<Item[]>(K_ITEMS, []);
  const [per, setPer]     = useLocal<Person[]>(K_PERSONS, []);
  const [moves, setMoves] = useLocal<Move[]>(K_MOVES, []);

  // Filtri
  const [range, setRange] = useState<'7d'|'30d'|'90d'|'all'>('7d');
  const [kindF, setKindF] = useState<MoveKind | 'VISI'>('VISI');
  const [partnerF, setPartnerF] = useState<PartnerType | 'VISI'>('VISI');
  const [q, setQ] = useState('');

  // UI—ātrās darbības
  const [showRecv, setShowRecv] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  // KPI
  const totalQty  = inv.reduce((a,b)=>a+(Number(b.skaits)||0),0);
  const totalSKU  = inv.length;
  const lowBound  = (it:Item)=> it.minAtlikums ?? 3;
  const lowCount  = inv.filter(x => (Number(x.skaits)||0) <= lowBound(x)).length;

  // Filtrēšana
  const fromTs = useMemo(()=>{
    const d = { '7d':7, '30d':30, '90d':90 } as const;
    return range==='all' ? 0 : (Date.now() - d[range]*24*60*60*1000);
  },[range]);

  const filtered = useMemo(()=>{
    const match = (s:string) => s.toLowerCase().includes(q.toLowerCase().trim());
    return moves
      .filter(m => m.ts >= fromTs)
      .filter(m => kindF==='VISI' ? true : m.kind===kindF)
      .filter(m => partnerF==='VISI' ? true : m.partnerType===partnerF)
      .filter(m => {
        if(!q.trim()) return true;
        const item = inv.find(i=>i.id===m.itemId);
        const person = m.personId ? per.find(p=>p.id===m.personId) : null;
        const hay = [
          item?.nosaukums || '',
          person ? `${person.vards} ${person.uzvards}` : '',
          m.partnerName || '',
          m.partnerType.replaceAll('_',' ')
        ].join(' ');
        return match(hay);
      })
      .sort((a,b)=>b.ts-a.ts)
      .slice(0,20);
  },[moves,inv,per,fromTs,kindF,partnerF,q]);

  const sumQty = (k:MoveKind) => moves.filter(m=>m.kind===k && m.ts>=fromTs).reduce((a,b)=>a+b.qty,0);

  // ===== Darbības (mutācijas) =====
  function mutateStock(itemId:string, delta:number){
    setInv(prev => prev.map(it => it.id===itemId ? {...it, skaits: Math.max(0, (Number(it.skaits)||0) + delta)} : it));
  }

  function addMove(m:Move){
    setMoves(prev => [...prev, m]);
  }

  // ===== Formu stāvokļi =====
  const [recv, setRecv] = useState<{itemId:string; qty:number; partnerType:PartnerType; partnerName?:string}>({
    itemId:'', qty:1, partnerType:'JAUNSARDZES_CENTRS', partnerName:''
  });

  const [iss, setIss] = useState<{itemId:string; qty:number; partnerType:PartnerType; personId?:string; partnerName?:string}>({
    itemId:'', qty:1, partnerType:'JAUNSARGS', personId:'', partnerName:''
  });

  const [ret, setRet] = useState<{itemId:string; qty:number; partnerType:PartnerType; personId?:string; partnerName?:string}>({
    itemId:'', qty:1, partnerType:'JAUNSARGS', personId:'', partnerName:''
  });

  // ===== Iesniegumi =====
  const handleRecv = ()=>{
    if(!recv.itemId || recv.qty<=0) return;
    mutateStock(recv.itemId, +recv.qty);
    addMove({ id:uid(), ts:nowTs(), kind:'SAŅEMTS', itemId:recv.itemId, qty:+recv.qty, partnerType:recv.partnerType, partnerName:recv.partnerName?.trim() || undefined });
    setShowRecv(false);
  };

  const handleIssue = ()=>{
    if(!iss.itemId || iss.qty<=0) return;
    const item = inv.find(i=>i.id===iss.itemId);
    if(!item) return;
    if((item.skaits||0) < iss.qty){ alert('Nepietiek krājumu.'); return; }
    mutateStock(iss.itemId, -iss.qty);
    addMove({
      id:uid(), ts:nowTs(), kind:'IZDOTS', itemId:iss.itemId, qty:+iss.qty,
      partnerType:iss.partnerType,
      personId: iss.partnerType==='INSTRUKTORS' || iss.partnerType==='JAUNSARGS' ? (iss.personId||undefined) : undefined,
      partnerName: iss.partnerType==='CITS' ? (iss.partnerName?.trim() || undefined) : undefined
    });
    setShowIssue(false);
  };

  const handleReturn = ()=>{
    if(!ret.itemId || ret.qty<=0) return;
    mutateStock(ret.itemId, +ret.qty);
    addMove({
      id:uid(), ts:nowTs(), kind:'ATGRIEZTS', itemId:ret.itemId, qty:+ret.qty,
      partnerType:ret.partnerType,
      personId: ret.partnerType==='INSTRUKTORS' || ret.partnerType==='JAUNSARGS' ? (ret.personId||undefined) : undefined,
      partnerName: ret.partnerType==='CITS' ? (ret.partnerName?.trim() || undefined) : undefined
    });
    setShowReturn(false);
  };

  // ===== Palīgfunkcijas displejam =====
  const pName  = (id?:string)=> id ? (per.find(x=>x.id===id) ? `${per.find(x=>x.id===id)!.vards} ${per.find(x=>x.id===id)!.uzvards}` : '—') : '—';
  const iName  = (id:string)=> inv.find(x=>x.id===id)?.nosaukums || '—';
  const fmt    = (ts:number)=> new Date(ts).toLocaleString('lv-LV');
  const ptLabel:Record<PartnerType,string> = {
    JAUNSARDZES_CENTRS:'Jaunsardzes centrs',
    VALIC:'VALIC',
    INSTRUKTORS:'Instruktors',
    JAUNSARGS:'Jaunsargs',
    CITS:'Cits'
  };

  // ====== UI ======
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
          <Link href="/" className="active">Pārskats</Link>
          <Link href="/inventars">Noliktavas katalogs</Link>
          <Link href="/personas">Personas</Link>
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
            <input placeholder="Meklēt noliktavā… (vienums/persona/partneris)" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <button className="btn" onClick={()=>setShowRecv(true)}>📦 Saņemt</button>
          <button className="btn" onClick={()=>setShowIssue(true)}>📤 Izdot</button>
          <button className="btn" onClick={()=>setShowReturn(true)}>📥 Atgriezt</button>
          <div className="avatar">JE</div>
        </div>

        {/* Content */}
        <div className="container">
          <div className="cards">
            {/* KPI */}
            <div className="card cols-4">
              <div className="label">Kopējais atlikums (gab.)</div>
              <div className="kpi">
                <div className="value">{totalQty.toLocaleString('lv-LV')}</div>
                <span className="pill up">saņemts {sumQty('SAŅEMTS')}</span>
              </div>
            </div>
            <div className="card cols-4">
              <div className="label">SKU skaits • Zems atlikums</div>
              <div className="kpi">
                <div className="value">{totalSKU}</div>
                <span className="pill down">{lowCount} vienumiem zems atlikums</span>
              </div>
            </div>
            <div className="card cols-4">
              <div className="label">Izsniegumi / Atgrieztie</div>
              <div className="kpi">
                <div className="value">{sumQty('IZDOTS')}</div>
                <span className="pill up">atgriezti {sumQty('ATGRIEZTS')}</span>
              </div>
            </div>

            {/* Filtri */}
            <div className="card cols-12" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="actions" style={{gap:12}}>
                <div className="segment" role="tablist" aria-label="periods">
                  {(['7d','30d','90d','all'] as const).map(v=>
                    <button key={v} className={range===v?'active':''} onClick={()=>setRange(v)}>
                      {v==='all'?'Visi laiki':v}
                    </button>
                  )}
                </div>
                <div className="segment" role="tablist" aria-label="kategorija">
                  {(['VISI','SAŅEMTS','IZDOTS','ATGRIEZTS'] as const).map(v=>
                    <button key={v} className={kindF===v?'active':''} onClick={()=>setKindF(v as any)}>{v}</button>
                  )}
                </div>
                <select
                  value={partnerF}
                  onChange={e=>setPartnerF(e.target.value as PartnerType|'VISI')}
                  style={{background:'#0a0f0b',border:'1px solid var(--border)',color:'var(--text)',borderRadius:10,padding:'8px 12px'}}
                >
                  <option value="VISI">Visi partneri</option>
                  <option value="JAUNSARDZES_CENTRS">Jaunsardzes centrs</option>
                  <option value="VALIC">VALIC</option>
                  <option value="INSTRUKTORS">Instruktors</option>
                  <option value="JAUNSARGS">Jaunsargs</option>
                  <option value="CITS">Cits</option>
                </select>
              </div>
              <button className="btn primary">Filtrs</button>
            </div>

            {/* Pēdējās darbības */}
            <div className="card cols-12">
              <div className="label">Pēdējās darbības</div>
              <table className="table">
                <thead>
                  <tr><th>Laiks</th><th>Tips</th><th>Partneris</th><th>Vienums</th><th>Daudzums</th></tr>
                </thead>
                <tbody>
                  {filtered.length ? filtered.map(m=>(
                    <tr key={m.id}>
                      <td>{fmt(m.ts)}</td>
                      <td>{m.kind}</td>
                      <td>
                        {m.personId ? pName(m.personId) : (m.partnerName || ptLabel[m.partnerType])}
                      </td>
                      <td>{iName(m.itemId)}</td>
                      <td>{m.qty}</td>
                    </tr>
                  )) : <tr><td colSpan={5} style={{opacity:.7}}>Nav ierakstu atbilstoši filtriem.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Modālie logi: Saņemt / Izdot / Atgriezt ===== */}
      {showRecv && (
        <Modal title="Saņemt noliktavā" onClose={()=>setShowRecv(false)}>
          <div style={{display:'grid',gap:10,gridTemplateColumns:'2fr 1fr'}}>
            <select value={recv.itemId} onChange={e=>setRecv({...recv,itemId:e.target.value})}>
              <option value="">— Izvēlies vienumu —</option>
              {inv.map(i=><option key={i.id} value={i.id}>{i.nosaukums}</option>)}
            </select>
            <input type="number" min={1} value={recv.qty} onChange={e=>setRecv({...recv,qty:Number(e.target.value)})} placeholder="Daudzums" />
            <select value={recv.partnerType} onChange={e=>setRecv({...recv,partnerType:e.target.value as PartnerType})}>
              <option value="JAUNSARDZES_CENTRS">Jaunsardzes centrs</option>
              <option value="VALIC">VALIC</option>
              <option value="CITS">Cits</option>
            </select>
            <input placeholder="Partnera nosaukums (ja Cits)" value={recv.partnerName} onChange={e=>setRecv({...recv, partnerName:e.target.value})}/>
          </div>
          <div className="hr" />
          <div className="actions"><button className="btn primary" onClick={handleRecv}>Apstiprināt</button></div>
        </Modal>
      )}

      {showIssue && (
        <Modal title="Izdot no noliktavas" onClose={()=>setShowIssue(false)}>
          <div style={{display:'grid',gap:10,gridTemplateColumns:'2fr 1fr'}}>
            <select value={iss.itemId} onChange={e=>setIss({...iss,itemId:e.target.value})}>
              <option value="">— Izvēlies vienumu —</option>
              {inv.map(i=><option key={i.id} value={i.id}>{i.nosaukums} (pieejams: {i.skaits})</option>)}
            </select>
            <input type="number" min={1} value={iss.qty} onChange={e=>setIss({...iss,qty:Number(e.target.value)})} placeholder="Daudzums" />
            <select value={iss.partnerType} onChange={e=>setIss({...iss,partnerType:e.target.value as PartnerType})}>
              <option value="JAUNSARGS">Jaunsargs</option>
              <option value="INSTRUKTORS">Instruktors</option>
              <option value="CITS">Cits</option>
            </select>
            {(iss.partnerType==='JAUNSARGS' || iss.partnerType==='INSTRUKTORS') ? (
              <select value={iss.personId} onChange={e=>setIss({...iss,personId:e.target.value})}>
                <option value="">— Persona —</option>
                {per.map(p=><option key={p.id} value={p.id}>{p.vards} {p.uzvards}</option>)}
              </select>
            ) : (
              <input placeholder="Saņēmējs (ja Cits)" value={iss.partnerName} onChange={e=>setIss({...iss, partnerName:e.target.value})}/>
            )}
          </div>
          <div className="hr" />
          <div className="actions"><button className="btn primary" onClick={handleIssue}>Apstiprināt</button></div>
        </Modal>
      )}

      {showReturn && (
        <Modal title="Atgriešana noliktavā" onClose={()=>setShowReturn(false)}>
          <div style={{display:'grid',gap:10,gridTemplateColumns:'2fr 1fr'}}>
            <select value={ret.itemId} onChange={e=>setRet({...ret,itemId:e.target.value})}>
              <option value="">— Izvēlies vienumu —</option>
              {inv.map(i=><option key={i.id} value={i.id}>{i.nosaukums}</option>)}
            </select>
            <input type="number" min={1} value={ret.qty} onChange={e=>setRet({...ret,qty:Number(e.target.value)})} placeholder="Daudzums" />
            <select value={ret.partnerType} onChange={e=>setRet({...ret,partnerType:e.target.value as PartnerType})}>
              <option value="JAUNSARGS">Jaunsargs</option>
              <option value="INSTRUKTORS">Instruktors</option>
              <option value="CITS">Cits</option>
            </select>
            {(ret.partnerType==='JAUNSARGS' || ret.partnerType==='INSTRUKTORS') ? (
              <select value={ret.personId} onChange={e=>setRet({...ret,personId:e.target.value})}>
                <option value="">— Persona —</option>
                {per.map(p=><option key={p.id} value={p.id}>{p.vards} {p.uzvards}</option>)}
              </select>
            ) : (
              <input placeholder="Atdevējs (ja Cits)" value={ret.partnerName} onChange={e=>setRet({...ret,partnerName:e.target.value})}/>
            )}
          </div>
          <div className="hr" />
          <div className="actions"><button className="btn primary" onClick={handleReturn}>Apstiprināt</button></div>
        </Modal>
      )}
    </div>
  );
}
