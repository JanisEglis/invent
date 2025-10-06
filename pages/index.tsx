import Link from 'next/link';
import { useState } from 'react';

export default function Dashboard(){
  const [period, setPeriod] = useState<'daily'|'weekly'>('daily');

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
          <Link href="/" className="active"><span className="icon dots" /> Insights</Link>
          <Link href="/inventars">Inventory</Link>
          <Link href="/personas">People</Link>
          <Link href="/izsniegumi">Issues</Link>
          <a href="#" onClick={e=>e.preventDefault()}>Reports</a>
          <a href="#" onClick={e=>e.preventDefault()}>Settings</a>
          <a href="/api/logout" style={{marginTop:6,opacity:.85}}>↩ Izrakstīties</a>
        </nav>
      </aside>

      {/* Main */}
      <section className="main">
        {/* Top bar */}
        <div className="topbar">
          <div className="search">
            <span>🔎</span>
            <input placeholder="Search anything…" />
          </div>
          <button className="btn">⚙️</button>
          <button className="btn">🔔</button>
          <div className="avatar">JE</div>
        </div>

        {/* Content */}
        <div className="container">
          {/* KPI cards */}
          <div className="cards">
            <div className="card cols-4">
              <div className="label">Items in stock</div>
              <div className="kpi">
                <div className="value">1 036</div>
                <span className="pill up">+2.1%</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <div className="segment" role="tablist" aria-label="forecast">
                  <button className="active" onClick={()=>{}}>7d</button>
                  <button onClick={()=>{}}>30d</button>
                  <button onClick={()=>{}}>90d</button>
                </div>
                <a className="btn" href="#" onClick={e=>e.preventDefault()}>View details</a>
              </div>
            </div>

            <div className="card cols-4">
              <div className="label">Average issue per person</div>
              <div className="kpi">
                <div className="value">2.4</div>
                <span className="pill down">−0.7%</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <Link href="/izsniegumi" className="btn">Open issues</Link>
              </div>
            </div>

            <div className="card cols-4">
              <div className="label">Potential savings</div>
              <div className="kpi">
                <div className="value">$1 870</div>
                <span className="pill up">+5.9%</span>
              </div>
              <div className="hr" />
              <div className="actions">
                <Link href="/inventars" className="btn">Optimize stock</Link>
              </div>
            </div>

            {/* Filters row */}
            <div className="card cols-12" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="actions" style={{gap:12}}>
                <div className="segment" role="tablist" aria-label="timeframe">
                  <button className={period==='daily'?'active':''} onClick={()=>setPeriod('daily')}>Daily</button>
                  <button className={period==='weekly'?'active':''} onClick={()=>setPeriod('weekly')}>Weekly</button>
                </div>
                <div className="segment" role="tablist" aria-label="range">
                  <button className="active">Last 4 weeks</button>
                  <button>Last 3 months</button>
                </div>
              </div>
              <button className="btn primary">Filter</button>
            </div>

            {/* Recent activity table (no chart) */}
            <div className="card cols-12">
              <div className="label">Recent activity</div>
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Person</th><th>Item</th><th>Qty</th></tr>
                </thead>
                <tbody>
                  <tr><td>2025-07-01</td><td>Issue</td><td>Anna B.</td><td>Kompass M52</td><td>1</td></tr>
                  <tr><td>2025-07-01</td><td>Return</td><td>Jānis E.</td><td>Radio stacija</td><td>1</td></tr>
                  <tr><td>2025-06-30</td><td>Stock in</td><td>—</td><td>Pirmās palīdzības soma</td><td>5</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
