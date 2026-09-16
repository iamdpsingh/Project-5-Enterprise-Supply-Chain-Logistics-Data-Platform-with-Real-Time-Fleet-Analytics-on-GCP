"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
import {
  LayoutDashboard, Package, Truck, Activity, Database,
  AlertTriangle, Zap, TrendingUp, TrendingDown, DollarSign,
  Clock, Server, RefreshCw, Building2, Users
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const ORDERS      = ['ORD-82451','ORD-63014','ORD-17890','ORD-44327','ORD-99102','ORD-55611'];
const DESTINATIONS = ['Chicago, IL','Dallas, TX','Miami, FL','Seattle, WA','Phoenix, AZ','Boston, MA'];

// ─── Global vehicle seed coords spread across continents ─────────────────────
const GLOBAL_SEEDS = [
  { region: 'North America', lat: 40.7,  lon: -74.0  },
  { region: 'North America', lat: 34.0,  lon: -118.2 },
  { region: 'North America', lat: 51.5,  lon: -113.9 },
  { region: 'North America', lat: 29.7,  lon: -95.4  },
  { region: 'North America', lat: 41.9,  lon: -87.6  },
  { region: 'Europe',        lat: 51.5,  lon: -0.12  },
  { region: 'Europe',        lat: 48.8,  lon: 2.35   },
  { region: 'Europe',        lat: 52.5,  lon: 13.4   },
  { region: 'Europe',        lat: 55.7,  lon: 37.6   },
  { region: 'Europe',        lat: 41.0,  lon: 29.0   },
  { region: 'Asia Pacific',  lat: 35.7,  lon: 139.7  },
  { region: 'Asia Pacific',  lat: 22.3,  lon: 114.2  },
  { region: 'Asia Pacific',  lat: 1.3,   lon: 103.8  },
  { region: 'Asia Pacific',  lat: 28.6,  lon: 77.2   },
  { region: 'Asia Pacific',  lat: 31.2,  lon: 121.5  },
  { region: 'South America', lat: -23.5, lon: -46.6  },
  { region: 'South America', lat: -34.6, lon: -58.4  },
  { region: 'South America', lat: -12.0, lon: -77.0  },
  { region: 'Middle East & Africa', lat: -26.2, lon: 28.0 },
  { region: 'Middle East & Africa', lat: 25.2,  lon: 55.3 },
  { region: 'Middle East & Africa', lat: 30.0,  lon: 31.2 },
  { region: 'Middle East & Africa', lat: 6.5,   lon: 3.4  },
];

const REGION_BOUNDS = {
  'Global':              { latMin: -60,  latMax: 75,  lonMin: -175, lonMax: 175  },
  'North America':       { latMin: 15,   latMax: 72,  lonMin: -168, lonMax: -52  },
  'Europe':              { latMin: 35,   latMax: 72,  lonMin: -25,  lonMax: 45   },
  'Asia Pacific':        { latMin: -10,  latMax: 55,  lonMin: 60,   lonMax: 155  },
  'South America':       { latMin: -60,  latMax: 15,  lonMin: -82,  lonMax: -34  },
  'Middle East & Africa':{ latMin: -35,  latMax: 38,  lonMin: -20,  lonMax: 60   },
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab]             = useState('overview');
  const [kpis, setKpis]           = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fleet, setFleet]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [kr, sr, fr] = await Promise.all([
        fetch('/api/kpis'),
        fetch('/api/shipments'),
        fetch('/api/fleet'),
      ]);
      setKpis(await kr.json());
      setShipments(await sr.json());
      setFleet(await fr.json());
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const NAV = [
    { id: 'overview',  label: 'Overview',       Icon: LayoutDashboard },
    { id: 'logistics', label: 'Logistics',       Icon: Package, badge: kpis?.metrics?.delayedShipments },
    { id: 'fleet',     label: 'Fleet Tracking',  Icon: Truck },
    { id: 'health',    label: 'Pipeline Health', Icon: Database },
  ];

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">Control Tower</div>
            <div className="logo-sub">Enterprise Platform</div>
          </div>
        </div>

        <div className="nav-section-label">Platform</div>
        {NAV.map(({ id, label, Icon, badge }) => (
          <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={16} /> {label}
            {badge > 0 && <span className="nav-badge">{badge}</span>}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: '.5rem' }}>System</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Server size={16} /> GCP BigQuery
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '.65rem' }}>Live</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Zap size={16} /> Pub/Sub Stream
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '.65rem' }}>Active</span>
        </div>

        <div className="sidebar-footer">
          <div className="status-dot"></div>
          <div className="status-txt">
            <strong>All Systems OK</strong><br />
            Updated {lastUpdated || '--:--:--'}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{NAV.find(n => n.id === tab)?.label}</div>
          <div className="topbar-meta">
            <div className="live-badge"><div className="live-dot"></div> Real-Time</div>
            <button onClick={fetchAll} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '.4rem .8rem', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <span className="timestamp">{lastUpdated}</span>
          </div>
        </div>

        <div className="content-area">
          {loading ? <Loader /> : (
            <>
              {tab === 'overview'  && <OverviewTab  kpis={kpis}  shipments={shipments} fleet={fleet} />}
              {tab === 'logistics' && <LogisticsTab kpis={kpis}  shipments={shipments} />}
              {tab === 'fleet'     && <FleetTab     fleet={fleet} />}
              {tab === 'health'    && <HealthTab />}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,.08)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--txt2)', fontSize: '.875rem' }}>Connecting to GCP pipelines…</p>
    </div>
  );
}

// ─── Chart options ────────────────────────────────────────────────────────────
const chartOpts = (stacked = false) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#111827', titleColor: '#f4f4f5', bodyColor: '#a1a1aa', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, cornerRadius: 8, padding: 10 },
  },
  scales: {
    x: { stacked, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#52525b', font: { size: 11 } } },
    y: { stacked, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#52525b', font: { size: 11 } } },
  },
});

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ kpis, shipments, fleet }) {
  const m = kpis?.metrics ?? {};
  const s = fleet?.stats  ?? {};

  const lineData = {
    labels: shipments.map(d => d.dispatch_date),
    datasets: [{ data: shipments.map(d => d.total), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5 }],
  };
  const doughData = {
    labels: ['On Time', 'Delayed'],
    datasets: [{ data: [m.totalShipments - m.delayedShipments, m.delayedShipments], backgroundColor: ['rgba(16,185,129,.75)', 'rgba(239,68,68,.75)'], borderWidth: 0 }],
  };
  const doughOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 10, padding: 14, font: { size: 11 } } }, tooltip: chartOpts().plugins.tooltip },
  };

  const KPIS = [
    { label: 'Total Shipments',  value: m.totalShipments?.toLocaleString(), icon: <Package size={18} />,   color: 'var(--blue)',  bg: 'rgba(59,130,246,.12)',  trend: '+4.1%',  up: true },
    { label: 'On-Time Delivery', value: `${m.onTimeDeliveryRate}%`,         icon: <TrendingUp size={18} />, color: 'var(--green)', bg: 'rgba(16,185,129,.12)', trend: '+1.2%',  up: true },
    { label: 'Active Vehicles',  value: s.active?.toLocaleString(),         icon: <Truck size={18} />,     color: 'var(--cyan)',  bg: 'rgba(6,182,212,.12)',  trend: `Avg ${s.avgSpeed} km/h`, up: null },
    { label: 'Total Revenue',    value: `$${((m.totalRevenue ?? 0)/1e6).toFixed(1)}M`, icon: <DollarSign size={18} />, color: 'var(--amber)', bg: 'rgba(245,158,11,.12)', trend: `${m.delayedShipments} at risk`, up: false },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="kpi-grid">
        {KPIS.map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value ?? '—'}</div>
            <div className={`kpi-trend ${k.up === true ? 'up' : k.up === false ? 'down' : 'neu'}`}>
              {k.up === true && <TrendingUp size={13} />}{k.up === false && <TrendingDown size={13} />}{k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="section col-21">
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title"><Activity size={14} /> Shipment Volume Trend</div>
          <div style={{ height: 240 }}><Line data={lineData} options={chartOpts()} /></div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title"><Package size={14} /> Delivery Status</div>
          <div style={{ height: 240 }}><Doughnut data={doughData} options={doughOpts} /></div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><AlertTriangle size={14} /> Active Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <AlertRow icon={<AlertTriangle size={16} color="var(--red)" />}  severity="badge-red"   label="Critical" text={`${m.delayedShipments?.toLocaleString()} shipments flagged at-risk of delay by BigQuery ML`} time="Just now" />
          <AlertRow icon={<Truck size={16} color="var(--amber)" />}       severity="badge-amber" label="Warning"  text={`${fleet?.stats?.maintenance} vehicles require immediate maintenance scheduling`} time="8m ago" />
          <AlertRow icon={<Building2 size={16} color="var(--blue)" />}    severity="badge-blue"  label="Info"     text="Warehouse-04 inventory capacity at 92% — reorder threshold exceeded" time="21m ago" />
          <AlertRow icon={<Users size={16} color="var(--cyan)" />}        severity="badge-blue"  label="Info"     text="Supplier SLA compliance dropped 2.1% below monthly target" time="1h ago" />
        </div>
      </div>
    </div>
  );
}

// ─── Logistics Tab ────────────────────────────────────────────────────────────
function LogisticsTab({ kpis, shipments }) {
  const m = kpis?.metrics ?? {};
  const barData = {
    labels: shipments.slice(-8).map(d => d.dispatch_date),
    datasets: [
      { label: 'On Time', data: shipments.slice(-8).map(d => d.total - d.delayed), backgroundColor: 'rgba(16,185,129,.7)', borderRadius: 4 },
      { label: 'Delayed', data: shipments.slice(-8).map(d => d.delayed),            backgroundColor: 'rgba(239,68,68,.7)',  borderRadius: 4 },
    ],
  };
  const lineData = {
    labels: shipments.map(d => d.dispatch_date),
    datasets: [{ data: shipments.map(d => d.delayed), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.07)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 }],
  };
  const atRisk = ORDERS.map((id, i) => ({ id, dest: DESTINATIONS[i], delay: `${i + 1}d`, status: i < 2 ? 'Critical' : 'At Risk' }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="section col-3">
        {[
          { label: 'Active Suppliers',     value: m.activeSuppliers,                  color: 'var(--blue)',  bg: 'rgba(59,130,246,.12)', icon: <Building2 size={18} /> },
          { label: 'Delayed Shipments',    value: m.delayedShipments?.toLocaleString(), color: 'var(--red)',   bg: 'rgba(239,68,68,.12)',  icon: <AlertTriangle size={18} /> },
          { label: 'Avg Warehouse Fill',   value: '84%',                               color: 'var(--amber)', bg: 'rgba(245,158,11,.12)', icon: <Database size={18} /> },
        ].map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="section col-21">
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title"><Activity size={14} /> Last 8-Day Shipment Breakdown</div>
          <div style={{ height: 240 }}><Bar data={barData} options={chartOpts(true)} /></div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title"><TrendingUp size={14} /> Delay Volume Trend</div>
          <div style={{ height: 240 }}><Line data={lineData} options={chartOpts()} /></div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><AlertTriangle size={14} /> Shipments at Risk</div>
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Destination</th><th>Delay Risk</th><th>ML Prediction</th><th>Status</th></tr>
          </thead>
          <tbody>
            {atRisk.map((r, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--txt2)' }}>{r.id}</td>
                <td>{r.dest}</td>
                <td style={{ color: 'var(--red)', fontWeight: 600 }}>{r.delay}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99 }}>
                      <div style={{ width: `${65 + i * 5}%`, height: '100%', background: 'var(--red)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '.72rem', color: 'var(--txt2)' }}>{65 + i * 5}%</span>
                  </div>
                </td>
                <td><span className={`badge ${r.status === 'Critical' ? 'badge-red' : 'badge-amber'}`}>● {r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fleet Tab — Global Interactive ──────────────────────────────────────────
function FleetTab({ fleet }) {
  const rawVehicles = fleet?.vehicles ?? [];
  const stats       = fleet?.stats   ?? {};
  const [region, setRegion]   = useState('Global');
  const [selected, setSelected] = useState(null);

  // Merge real API coords with global seeds fallback
  const vehicles = rawVehicles.length > 0
    ? rawVehicles.map((v, i) => ({
        ...v,
        latitude:  v.latitude !== undefined && v.latitude !== null ? parseFloat(v.latitude) : GLOBAL_SEEDS[i % GLOBAL_SEEDS.length].lat,
        longitude: v.longitude !== undefined && v.longitude !== null ? parseFloat(v.longitude) : GLOBAL_SEEDS[i % GLOBAL_SEEDS.length].lon,
        region:    v.region || GLOBAL_SEEDS[i % GLOBAL_SEEDS.length].region,
        speed_kmh: parseInt(v.speed_kmh, 10) || 70,
        fuel_level_pct: parseInt(v.fuel_level_pct, 10) || 60,
      }))
    : GLOBAL_SEEDS.map((g, i) => ({
        id: `VH-${1000 + i}`, speed_kmh: 55 + (i * 17) % 75,
        fuel_level_pct: 15 + (i * 23) % 80,
        engine_status: i % 6 === 0 ? 'WARNING' : 'OK',
        latitude: g.lat, longitude: g.lon, region: g.region,
      }));

  const r        = REGION_BOUNDS[region];
  const filtered = region === 'Global' ? vehicles : vehicles.filter(v => v.region === region);
  const speeding = filtered.filter(v => v.speed_kmh > 100);
  const lowFuel  = filtered.filter(v => v.fuel_level_pct < 20);
  const warning  = filtered.filter(v => v.engine_status === 'WARNING');

  const toPos = (lat, lon) => ({
    top:  `${100 - ((lat - r.latMin) / (r.latMax - r.latMin)) * 100}%`,
    left: `${((lon - r.lonMin)  / (r.lonMax  - r.lonMin))  * 100}%`,
  });

  // Speed distribution chart
  const speedBarData = {
    labels: ['0–40', '41–70', '71–100', '>100'],
    datasets: [{
      label: 'Vehicles', borderRadius: 6,
      data: [
        filtered.filter(v => v.speed_kmh <= 40).length,
        filtered.filter(v => v.speed_kmh > 40  && v.speed_kmh <= 70).length,
        filtered.filter(v => v.speed_kmh > 70  && v.speed_kmh <= 100).length,
        filtered.filter(v => v.speed_kmh > 100).length,
      ],
      backgroundColor: ['rgba(16,185,129,.75)','rgba(59,130,246,.75)','rgba(245,158,11,.75)','rgba(239,68,68,.75)'],
    }],
  };

  // Fuel distribution chart
  const fuelBarData = {
    labels: ['Critical', 'Low', 'Normal', 'Full'],
    datasets: [{
      label: 'Vehicles', borderRadius: 6,
      data: [
        filtered.filter(v => v.fuel_level_pct < 20).length,
        filtered.filter(v => v.fuel_level_pct >= 20 && v.fuel_level_pct < 40).length,
        filtered.filter(v => v.fuel_level_pct >= 40 && v.fuel_level_pct < 70).length,
        filtered.filter(v => v.fuel_level_pct >= 70).length,
      ],
      backgroundColor: ['rgba(239,68,68,.75)','rgba(245,158,11,.75)','rgba(59,130,246,.75)','rgba(16,185,129,.75)'],
    }],
  };

  // Region distribution chart
  const regionCounts = Object.keys(REGION_BOUNDS).filter(k => k !== 'Global').map(k => ({
    label: k, count: vehicles.filter(v => v.region === k).length,
  }));
  const regionBarData = {
    labels: regionCounts.map(r => r.label),
    datasets: [{
      label: 'Vehicles', borderRadius: 6,
      data: regionCounts.map(r => r.count),
      backgroundColor: ['rgba(59,130,246,.75)','rgba(139,92,246,.75)','rgba(6,182,212,.75)','rgba(245,158,11,.75)','rgba(16,185,129,.75)'],
    }],
  };

  // Engine status doughnut
  const doughData = {
    labels: ['OK', 'Warning'],
    datasets: [{ data: [filtered.length - warning.length, warning.length], backgroundColor: ['rgba(59,130,246,.75)','rgba(245,158,11,.75)'], borderWidth: 0 }],
  };
  const doughOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 10, padding: 12, font: { size: 11 } } }, tooltip: chartOpts().plugins.tooltip },
  };
  const barOpts = { ...chartOpts(), plugins: { ...chartOpts().plugins, legend: { display: false } } };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header row: KPI pills + region dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Fleet in View',  value: filtered.length,  color: 'var(--txt1)',  icon: <Truck size={15} />,         bg: 'rgba(255,255,255,.07)' },
            { label: 'Speeding',       value: speeding.length,  color: 'var(--red)',   icon: <AlertTriangle size={15} />, bg: 'rgba(239,68,68,.12)' },
            { label: 'Low Fuel',       value: lowFuel.length,   color: 'var(--amber)', icon: <Zap size={15} />,           bg: 'rgba(245,158,11,.12)' },
            { label: 'Engine Warning', value: warning.length,   color: 'var(--red)',   icon: <Activity size={15} />,      bg: 'rgba(239,68,68,.12)' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: '.8rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: '.65rem', color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Region Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--txt2)', fontWeight: 500 }}>Region</span>
          <select
            value={region}
            onChange={e => { setRegion(e.target.value); setSelected(null); }}
            style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              color: 'var(--txt1)', borderRadius: 8, padding: '.45rem 2rem .45rem .9rem',
              fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              outline: 'none', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right .6rem center',
            }}
          >
            {Object.keys(REGION_BOUNDS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Global Map */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Truck size={14} /> Live Vehicle Telemetry — {region}</div>
        <div className="map-canvas" style={{ height: 370, position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
          <MapComponent 
            vehicles={filtered} 
            regionBounds={r} 
            selected={selected} 
            setSelected={setSelected} 
          />

          {/* Selected vehicle tooltip */}
          {selected && (
            <div style={{ position: 'absolute', top: 12, left: 12, width: 220, background: 'rgba(8,10,20,.94)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '1rem', zIndex: 10000 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue)', fontSize: '.9rem' }}>{selected.id}</span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, zIndex: 10000 }}>✕</button>
              </div>
              {[
                { l: 'Speed',    v: `${selected.speed_kmh} km/h`,       c: selected.speed_kmh > 100 ? 'var(--red)' : 'var(--green)' },
                { l: 'Fuel',     v: `${selected.fuel_level_pct}%`,       c: selected.fuel_level_pct < 20 ? 'var(--red)' : 'var(--amber)' },
                { l: 'Engine',   v: selected.engine_status ?? 'OK',      c: selected.engine_status === 'WARNING' ? 'var(--red)' : 'var(--green)' },
                { l: 'Region',   v: selected.region ?? region,           c: 'var(--txt2)' },
                { l: 'Position', v: `${selected.latitude?.toFixed(2)}°, ${selected.longitude?.toFixed(2)}°`, c: 'var(--txt2)' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.35rem' }}>
                  <span style={{ color: 'var(--txt3)' }}>{row.l}</span>
                  <span style={{ color: row.c, fontWeight: 600 }}>{row.v}</span>
                </div>
              ))}
              {/* Mini fuel bar */}
              <div style={{ marginTop: '.65rem', paddingTop: '.65rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.68rem', color: 'var(--txt3)' }}>
                  <span>Fuel Level</span><span>{selected.fuel_level_pct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99 }}>
                  <div style={{ width: `${selected.fuel_level_pct}%`, height: '100%', background: selected.fuel_level_pct < 20 ? 'var(--red)' : selected.fuel_level_pct < 40 ? 'var(--amber)' : 'var(--green)', borderRadius: 99, transition: 'width .4s' }} />
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '.35rem .65rem', fontSize: '.68rem', display: 'flex', gap: '.65rem' }}>
            {[['var(--blue)','Normal'],['var(--red)','Speeding'],['var(--amber)','Alert']].map(([c,l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--txt2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 4px ${c}` }} />{l}
              </span>
            ))}
            <span style={{ color: 'var(--txt3)' }}>· Click a dot</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts — 4 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="section-title" style={{ fontSize: '.7rem' }}><Activity size={12} /> Speed Distribution</div>
          <div style={{ height: 160 }}><Bar data={speedBarData} options={barOpts} /></div>
        </div>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="section-title" style={{ fontSize: '.7rem' }}><Zap size={12} /> Fuel Levels</div>
          <div style={{ height: 160 }}><Bar data={fuelBarData} options={barOpts} /></div>
        </div>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="section-title" style={{ fontSize: '.7rem' }}><TrendingUp size={12} /> Engine Status</div>
          <div style={{ height: 160 }}><Doughnut data={doughData} options={doughOpts} /></div>
        </div>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="section-title" style={{ fontSize: '.7rem' }}><Database size={12} /> Fleet by Region</div>
          <div style={{ height: 160 }}><Bar data={regionBarData} options={{ ...barOpts, indexAxis: 'y', scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#52525b', font: { size: 9 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#52525b', font: { size: 9 } } } } }} /></div>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Server size={14} /> Telemetry Data — {region} ({filtered.length} vehicles) <span style={{ fontSize: '.65rem', color: 'var(--txt3)', fontWeight: 400 }}>Click row to highlight on map</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Vehicle ID</th><th>Region</th><th>Speed</th><th>Fuel Level</th><th>Engine</th><th>Coordinates</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 12).map((v, i) => (
                <tr
                  key={i}
                  onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  style={{ cursor: 'pointer', background: selected?.id === v.id ? 'rgba(59,130,246,.08)' : '' }}
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: selected?.id === v.id ? 'var(--blue)' : 'var(--txt1)' }}>{v.id}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: '.65rem' }}>{v.region}</span></td>
                  <td style={{ color: v.speed_kmh > 100 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{v.speed_kmh} km/h</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}>
                        <div style={{ width: `${v.fuel_level_pct}%`, height: '100%', background: v.fuel_level_pct < 20 ? 'var(--red)' : v.fuel_level_pct < 40 ? 'var(--amber)' : 'var(--green)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: '.72rem', color: 'var(--txt2)' }}>{v.fuel_level_pct}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${v.engine_status === 'OK' ? 'badge-green' : 'badge-red'}`}>● {v.engine_status ?? 'OK'}</span></td>
                  <td style={{ color: 'var(--txt2)', fontSize: '.78rem', fontFamily: 'monospace' }}>{v.latitude?.toFixed(2)}°, {v.longitude?.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Health Tab ──────────────────────────────────────────────────────
function HealthTab() {
  const layers = [
    { domain: 'Orders',        format: 'CSV',        bronze: '500,000', silver: '500,000', gold: '500,000',    pct: 100 },
    { domain: 'Order Items',   format: 'CSV',        bronze: '750,000', silver: '750,000', gold: 'Joined',     pct: 100 },
    { domain: 'Shipments',     format: 'CSV',        bronze: '500,000', silver: '500,000', gold: '500,000',    pct: 100 },
    { domain: 'IoT Telemetry', format: 'NDJSON',     bronze: '1.06M+',  silver: '1.06M+',  gold: 'Aggregated', pct: 100 },
    { domain: 'Master Data',   format: 'CSV / SCD2', bronze: '62,000',  silver: '62,000',  gold: 'SCD Dims',   pct: 100 },
  ];
  const checks = [
    { name: 'orders_no_nulls',                  table: 'silver.orders' },
    { name: 'shipments_no_nulls',               table: 'silver.shipments' },
    { name: 'telemetry_valid_speed',            table: 'silver.iot_telemetry' },
    { name: 'telemetry_valid_fuel',             table: 'silver.iot_telemetry' },
    { name: 'telemetry_valid_coords',           table: 'silver.iot_telemetry' },
    { name: 'orders_no_duplicates',             table: 'silver.orders' },
    { name: 'shipments_delivery_after_dispatch',table: 'silver.shipments' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="section col-3">
        {[
          { label: 'Records Processed', value: '2.81M+',  color: 'var(--blue)',  bg: 'rgba(59,130,246,.12)', icon: <Database size={18} /> },
          { label: 'Quality Pass Rate', value: '100%',    color: 'var(--green)', bg: 'rgba(16,185,129,.12)', icon: <Activity size={18} /> },
          { label: 'Avg Batch Latency', value: '~14 min', color: 'var(--txt1)',  bg: 'rgba(255,255,255,.07)', icon: <Clock size={18} /> },
        ].map(k => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <div className="kpi-value" style={{ color: k.color, fontSize: '1.6rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Database size={14} /> Medallion Architecture — Data Lineage</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th><th>Format</th>
                <th style={{ color: 'var(--amber)' }}>● Bronze</th>
                <th style={{ color: 'var(--blue)'  }}>● Silver</th>
                <th style={{ color: 'var(--green)' }}>● Gold</th>
                <th>Completeness</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {layers.map(r => (
                <tr key={r.domain}>
                  <td style={{ fontWeight: 600 }}>{r.domain}</td>
                  <td><span className="badge badge-blue">{r.format}</span></td>
                  <td style={{ color: 'var(--amber)' }}>{r.bronze}</td>
                  <td style={{ color: 'var(--blue)'  }}>{r.silver}</td>
                  <td style={{ color: 'var(--green)' }}>{r.gold}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}>
                        <div style={{ width: `${r.pct}%`, height: '100%', background: 'var(--green)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: '.72rem', color: 'var(--txt2)' }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td><span className="badge badge-green">✓ Synced</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Activity size={14} /> Data Quality Checks — Last Run</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem' }}>
          {checks.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.65rem .85rem', background: 'rgba(255,255,255,.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--green)', fontSize: '1rem' }}>✓</span>
              <div>
                <div style={{ fontSize: '.8rem', fontFamily: 'monospace', color: 'var(--txt1)', fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--txt3)' }}>{c.table}</div>
              </div>
              <span className="badge badge-green" style={{ marginLeft: 'auto' }}>PASS</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function AlertRow({ icon, severity, label, text, time }) {
  return (
    <div className="alert-row">
      {icon}
      <div className="alert-row-text">{text}</div>
      <span className={`badge ${severity}`}>{label}</span>
      <div className="alert-row-time"><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{time}</div>
    </div>
  );
}
