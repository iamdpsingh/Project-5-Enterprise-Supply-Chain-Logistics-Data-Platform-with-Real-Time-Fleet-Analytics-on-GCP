"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  LayoutDashboard, Package, Truck, Activity, Database,
  AlertTriangle, Zap, TrendingUp, TrendingDown, DollarSign,
  Clock, Server, ChevronRight, RefreshCw, Building2, Users
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Mock data generated deterministically so chart doesn't flicker ──────────
const ORDERS = ['ORD-82451','ORD-63014','ORD-17890','ORD-44327','ORD-99102','ORD-55611'];
const DESTINATIONS = ['Chicago, IL','Dallas, TX','Miami, FL','Seattle, WA','Phoenix, AZ','Boston, MA'];
const VEHICLE_IDS = ['VH-1042','VH-2317','VH-0891','VH-3766','VH-4128'];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab]           = useState('overview');
  const [kpis, setKpis]         = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fleet, setFleet]       = useState(null);
  const [loading, setLoading]   = useState(true);
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
    { id: 'overview',  label: 'Overview',        Icon: LayoutDashboard },
    { id: 'logistics', label: 'Logistics',        Icon: Package,         badge: kpis?.metrics?.delayedShipments },
    { id: 'fleet',     label: 'Fleet Tracking',   Icon: Truck },
    { id: 'health',    label: 'Pipeline Health',  Icon: Database },
  ];

  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────────────────── */}
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
          <button
            key={id}
            className={`nav-item ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
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

      {/* ── Main ────────────────────────────────────── */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="topbar-title">
              {NAV.find(n => n.id === tab)?.label}
            </div>
          </div>
          <div className="topbar-meta">
            <div className="live-badge">
              <div className="live-dot"></div> Real-Time
            </div>
            <button
              onClick={fetchAll}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '.4rem .8rem', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', transition: 'all .2s' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <span className="timestamp">{lastUpdated}</span>
          </div>
        </div>

        {/* Content */}
        <div className="content-area">
          {loading ? <Loader /> : (
            <>
              {tab === 'overview'  && <OverviewTab  kpis={kpis}    shipments={shipments} fleet={fleet} />}
              {tab === 'logistics' && <LogisticsTab kpis={kpis}    shipments={shipments} />}
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

// ─── Loading screen ───────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,.08)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--txt2)', fontSize: '.875rem' }}>Connecting to GCP pipelines…</p>
    </div>
  );
}

// ─── Chart options factory ────────────────────────────────────────────────────
const chartOpts = (stacked = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111827', titleColor: '#f4f4f5', bodyColor: '#a1a1aa', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, cornerRadius: 8, padding: 10 } },
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
    datasets: [{
      data: shipments.map(d => d.total),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,.08)',
      borderWidth: 2, fill: true, tension: 0.4,
      pointRadius: 0, pointHoverRadius: 5,
    }],
  };

  const doughData = {
    labels: ['On Time', 'Delayed'],
    datasets: [{
      data: [m.totalShipments - m.delayedShipments, m.delayedShipments],
      backgroundColor: ['rgba(16,185,129,.75)', 'rgba(239,68,68,.75)'],
      borderWidth: 0,
    }],
  };

  const doughOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 10, padding: 14, font: { size: 11 } } },
      tooltip: chartOpts().plugins.tooltip,
    },
  };

  const KPIS = [
    { label: 'Total Shipments', value: m.totalShipments?.toLocaleString(), icon: <Package size={18} />, color: 'var(--blue)', bg: 'rgba(59,130,246,.12)', trend: '+4.1%', up: true },
    { label: 'On-Time Delivery', value: `${m.onTimeDeliveryRate}%`, icon: <TrendingUp size={18} />, color: 'var(--green)', bg: 'rgba(16,185,129,.12)', trend: '+1.2%', up: true },
    { label: 'Active Vehicles', value: s.active?.toLocaleString(), icon: <Truck size={18} />, color: 'var(--cyan)', bg: 'rgba(6,182,212,.12)', trend: `Avg ${s.avgSpeed} km/h`, up: null },
    { label: 'Total Revenue', value: `$${((m.totalRevenue ?? 0) / 1e6).toFixed(1)}M`, icon: <DollarSign size={18} />, color: 'var(--amber)', bg: 'rgba(245,158,11,.12)', trend: `${m.delayedShipments} at risk`, up: false },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPI Row */}
      <div className="kpi-grid">
        {KPIS.map((k) => (
          <div key={k.label} className="card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value ?? '—'}</div>
            <div className={`kpi-trend ${k.up === true ? 'up' : k.up === false ? 'down' : 'neu'}`}>
              {k.up === true  && <TrendingUp  size={13} />}
              {k.up === false && <TrendingDown size={13} />}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
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

      {/* Alerts */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><AlertTriangle size={14} /> Active Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <AlertRow icon={<AlertTriangle size={16} color="var(--red)" />} severity="badge-red" label="Critical" text={`${m.delayedShipments?.toLocaleString()} shipments flagged as at-risk of delay by BigQuery ML`} time="Just now" />
          <AlertRow icon={<Truck size={16} color="var(--amber)" />} severity="badge-amber" label="Warning" text={`${fleet?.stats?.maintenance} vehicles require immediate maintenance scheduling`} time="8m ago" />
          <AlertRow icon={<Building2 size={16} color="var(--blue)" />} severity="badge-blue" label="Info" text="Warehouse-04 inventory capacity at 92% — reorder threshold exceeded" time="21m ago" />
          <AlertRow icon={<Users size={16} color="var(--cyan)" />} severity="badge-blue" label="Info" text="Supplier SLA compliance dropped 2.1% below monthly target" time="1h ago" />
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
    datasets: [{
      data: shipments.map(d => d.delayed),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,.07)',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
    }],
  };

  const atRisk = ORDERS.map((id, i) => ({
    id, dest: DESTINATIONS[i], delay: `${i + 1}d`, status: i < 2 ? 'Critical' : 'At Risk'
  }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPIs */}
      <div className="section col-3">
        {[
          { label: 'Active Suppliers', value: m.activeSuppliers, icon: <Building2 size={18} />, color: 'var(--blue)',  bg: 'rgba(59,130,246,.12)' },
          { label: 'Delayed Shipments', value: m.delayedShipments?.toLocaleString(), icon: <AlertTriangle size={18} />, color: 'var(--red)',   bg: 'rgba(239,68,68,.12)' },
          { label: 'Avg Warehouse Fill', value: '84%', icon: <Database size={18} />, color: 'var(--amber)', bg: 'rgba(245,158,11,.12)' },
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

      {/* Charts */}
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

      {/* At-Risk Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><AlertTriangle size={14} /> Shipments at Risk</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Destination</th><th>Delay Risk</th><th>ML Prediction</th><th>Status</th>
            </tr>
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

// ─── Fleet Tab ────────────────────────────────────────────────────────────────
function FleetTab({ fleet }) {
  const vehicles = fleet?.vehicles ?? [];
  const stats    = fleet?.stats   ?? {};

  const speeding    = vehicles.filter(v => v.speed_kmh > 100);
  const maintenance = vehicles.filter(v => v.engine_status === 'WARNING' || v.fuel_level_pct < 15);

  const doughData = {
    labels: ['Active', 'In Maintenance'],
    datasets: [{
      data: [stats.active, stats.maintenance],
      backgroundColor: ['rgba(59,130,246,.75)', 'rgba(245,158,11,.75)'],
      borderWidth: 0,
    }],
  };
  const doughOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 10, padding: 12, font: { size: 11 } } },
      tooltip: chartOpts().plugins.tooltip,
    },
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats Row */}
      <div className="section col-3">
        {[
          { label: 'Total Fleet', value: stats.total?.toLocaleString(), color: 'var(--txt1)', icon: <Truck size={18} />, bg: 'rgba(255,255,255,.07)' },
          { label: 'Speeding Now',  value: speeding.length, color: 'var(--red)',   icon: <AlertTriangle size={18} />, bg: 'rgba(239,68,68,.12)' },
          { label: 'Low Fuel Alert', value: maintenance.length, color: 'var(--amber)', icon: <Zap size={18} />, bg: 'rgba(245,158,11,.12)' },
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

      {/* Map + Doughnut */}
      <div className="section col-21">
        {/* Fleet Map */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-title"><Truck size={14} /> Live Vehicle Telemetry — US Region</div>
          <div className="map-canvas" style={{ height: 340 }}>
            {vehicles.map((v, i) => {
              const top  = `${100 - ((v.latitude  - 25)   / 24) * 100}%`;
              const left = `${((v.longitude - (-125)) / 58) * 100}%`;
              const spd  = v.speed_kmh > 100;
              const fuel = v.fuel_level_pct < 15;
              const color = spd ? 'var(--red)' : fuel ? 'var(--amber)' : 'var(--blue)';
              return (
                <div
                  key={i}
                  className="vehicle-dot"
                  title={`${v.id} · ${v.speed_kmh} km/h · Fuel ${v.fuel_level_pct}%`}
                  style={{ top, left, background: color, boxShadow: `0 0 8px ${color}` }}
                />
              );
            })}
            {/* Legend */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.7rem', display: 'flex', gap: '.75rem' }}>
              {[['var(--blue)','Normal'],['var(--red)','Speeding'],['var(--amber)','Low Fuel']].map(([c,l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', color: 'var(--txt2)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 5px ${c}` }} />{l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', flex: '0 0 auto' }}>
            <div className="section-title"><Activity size={14} /> Fleet Status</div>
            <div style={{ height: 180 }}><Doughnut data={doughData} options={doughOpts} /></div>
          </div>
          <div className="card" style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
            <div className="section-title"><AlertTriangle size={14} /> Speeding Vehicles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {(speeding.length > 0 ? speeding : VEHICLE_IDS.map((id, i) => ({ id, speed_kmh: 105 + i * 5 }))).slice(0, 6).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.55rem .75rem', background: 'rgba(239,68,68,.07)', borderRadius: 8, borderLeft: '3px solid var(--red)' }}>
                  <span style={{ fontSize: '.82rem', fontFamily: 'monospace', color: 'var(--txt1)' }}>{v.id}</span>
                  <span className="badge badge-red">{v.speed_kmh} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Server size={14} /> Fleet Telemetry Sample</div>
        <table className="data-table">
          <thead>
            <tr><th>Vehicle</th><th>Speed</th><th>Fuel</th><th>Engine</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(vehicles.length > 0 ? vehicles : VEHICLE_IDS.map((id, i) => ({
              id, speed_kmh: 72 + i * 8, fuel_level_pct: 60 - i * 10, engine_status: i > 2 ? 'WARNING' : 'OK', latitude: 37 + i, longitude: -100 - i,
            }))).slice(0, 8).map((v, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.id}</td>
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
                <td style={{ color: 'var(--txt2)', fontSize: '.78rem' }}>{parseFloat(v.latitude)?.toFixed(2)}°N, {parseFloat(v.longitude)?.toFixed(2)}°W</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pipeline Health Tab ──────────────────────────────────────────────────────
function HealthTab() {
  const layers = [
    { domain: 'Orders',        format: 'CSV',         bronze: '500,000', silver: '500,000', gold: '500,000',   pct: 100 },
    { domain: 'Order Items',   format: 'CSV',         bronze: '750,000', silver: '750,000', gold: 'Joined',     pct: 100 },
    { domain: 'Shipments',     format: 'CSV',         bronze: '500,000', silver: '500,000', gold: '500,000',   pct: 100 },
    { domain: 'IoT Telemetry', format: 'NDJSON',      bronze: '1.06M+',  silver: '1.06M+',  gold: 'Aggregated', pct: 100 },
    { domain: 'Master Data',   format: 'CSV / SCD2',  bronze: '62,000',  silver: '62,000',  gold: 'SCD Dims',   pct: 100 },
  ];

  const checks = [
    { name: 'orders_no_nulls',               status: 'PASS', table: 'silver.orders' },
    { name: 'shipments_no_nulls',            status: 'PASS', table: 'silver.shipments' },
    { name: 'telemetry_valid_speed',          status: 'PASS', table: 'silver.iot_telemetry' },
    { name: 'telemetry_valid_fuel',           status: 'PASS', table: 'silver.iot_telemetry' },
    { name: 'telemetry_valid_coords',         status: 'PASS', table: 'silver.iot_telemetry' },
    { name: 'orders_no_duplicates',           status: 'PASS', table: 'silver.orders' },
    { name: 'shipments_delivery_after_dispatch', status: 'PASS', table: 'silver.shipments' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary KPIs */}
      <div className="section col-3">
        {[
          { label: 'Records Processed', value: '2.81M+', color: 'var(--blue)',  bg: 'rgba(59,130,246,.12)', icon: <Database size={18} /> },
          { label: 'Quality Pass Rate',  value: '100%',   color: 'var(--green)', bg: 'rgba(16,185,129,.12)', icon: <Activity size={18} /> },
          { label: 'Avg Batch Latency',  value: '~14 min', color: 'var(--txt1)', bg: 'rgba(255,255,255,.07)', icon: <Clock size={18} /> },
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

      {/* Medallion Architecture Visual */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="section-title"><Database size={14} /> Medallion Architecture — Data Lineage View</div>
        <div style={{ overflowX: 'auto', paddingBottom: '.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th><th>Source Format</th>
                <th style={{ color: 'var(--amber)' }}>● Bronze (Raw GCS)</th>
                <th style={{ color: 'var(--blue)'  }}>● Silver (Cleaned BQ)</th>
                <th style={{ color: 'var(--green)' }}>● Gold (Modeled BQ)</th>
                <th>Completeness</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {layers.map(r => (
                <tr key={r.domain}>
                  <td style={{ fontWeight: 600 }}>{r.domain}</td>
                  <td><span className="badge badge-blue">{r.format}</span></td>
                  <td style={{ color: 'var(--amber)' }}>{r.bronze} rows</td>
                  <td style={{ color: 'var(--blue)'  }}>{r.silver} rows</td>
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

      {/* Quality Checks */}
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
