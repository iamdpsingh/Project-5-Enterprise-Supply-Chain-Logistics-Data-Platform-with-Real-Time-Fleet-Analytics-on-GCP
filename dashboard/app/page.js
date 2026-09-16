"use client";

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement, BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Package, Truck, AlertTriangle, DollarSign, Activity, MapPin, Database, Zap, Clock, Users, Building, AlertCircle
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, shipRes, fleetRes] = await Promise.all([
          fetch('/api/kpis'),
          fetch('/api/shipments'),
          fetch('/api/fleet')
        ]);
        
        setKpis(await kpiRes.json());
        setShipments(await shipRes.json());
        setFleetData(await fleetRes.json());
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Enterprise Control Tower...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 className="heading-gradient" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Control Tower</h1>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18} />}>Executive Overview</TabButton>
            <TabButton active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={<Package size={18} />}>Logistics & Supply</TabButton>
            <TabButton active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} icon={<Truck size={18} />}>Real-Time Fleet</TabButton>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <GcpBadge source={kpis?.metadata?.source} time={kpis?.metadata?.executionTimeMs} size={kpis?.metadata?.bytesProcessed} color="var(--accent-primary)" icon={<Database size={14} />} />
          <GcpBadge source={fleetData?.metadata?.source} time={fleetData?.metadata?.executionTimeMs} isLive color="var(--status-warning)" icon={<Zap size={14} />} />
        </div>
      </header>
      
      {activeTab === 'overview' && <OverviewTab kpis={kpis?.metrics} shipments={shipments} fleetStats={fleetData?.stats} />}
      {activeTab === 'logistics' && <LogisticsTab kpis={kpis?.metrics} shipments={shipments} />}
      {activeTab === 'fleet' && <FleetTab fleet={fleetData?.vehicles} stats={fleetData?.stats} />}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
      `}} />
    </>
  );
}

// ==========================================
// TABS
// ==========================================

function OverviewTab({ kpis, shipments, fleetStats }) {
  const chartData = {
    labels: shipments.map(s => s.dispatch_date),
    datasets: [
      {
        label: 'Total Shipments',
        data: shipments.map(s => s.total),
        borderColor: '#1a73e8', // Google Blue
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#5f6368' } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#5f6368' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <KpiCard title="Total Shipments" value={kpis?.totalShipments?.toLocaleString()} icon={<Package size={20} color="var(--accent-primary)" />} />
        <KpiCard title="On-Time Delivery" value={`${kpis?.onTimeDeliveryRate}%`} icon={<Activity size={20} color="var(--status-success)" />} trend="+1.2%" />
        <KpiCard title="Active Fleet" value={fleetStats?.active?.toLocaleString()} icon={<Truck size={20} color="var(--status-info)" />} subtitle={`Avg ${fleetStats?.avgSpeed} km/h`} />
        <KpiCard title="Logistics Revenue" value={`$${(kpis?.totalRevenue / 1000000).toFixed(1)}M`} icon={<DollarSign size={20} color="var(--status-warning)" />} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Delivery Volume Trends</h3>
          <div style={{ minHeight: '300px' }}><Line data={chartData} options={options} /></div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Critical Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertRow icon={<AlertTriangle color="var(--status-danger)" />} text={`${kpis?.delayedShipments?.toLocaleString()} Shipments at risk of delay`} time="Just now" />
            <AlertRow icon={<AlertCircle color="var(--status-warning)" />} text={`${fleetStats?.maintenance} Vehicles requiring immediate maintenance`} time="5m ago" />
            <AlertRow icon={<Users color="var(--status-info)" />} text="Warehouse 4 capacity exceeding 92%" time="12m ago" />
          </div>
        </div>
      </section>
    </div>
  );
}

function LogisticsTab({ kpis, shipments }) {
  // Bar chart for delayed vs on time
  const chartData = {
    labels: shipments.map(s => s.dispatch_date).slice(-7),
    datasets: [
      { label: 'On Time', data: shipments.slice(-7).map(s => s.total - s.delayed), backgroundColor: 'rgba(16, 185, 129, 0.8)' },
      { label: 'Delayed', data: shipments.slice(-7).map(s => s.delayed), backgroundColor: 'rgba(239, 68, 68, 0.8)' }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <KpiCard title="Active Suppliers" value={kpis?.activeSuppliers} icon={<Building size={20} color="var(--status-info)" />} />
        <KpiCard title="Delayed Shipments" value={kpis?.delayedShipments?.toLocaleString()} icon={<AlertTriangle size={20} color="var(--status-danger)" />} isDanger />
        <KpiCard title="Avg Warehouse Capacity" value="84%" icon={<Database size={20} color="var(--status-warning)" />} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Shipments at Risk (Data Table)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>Order ID</th>
                <th>Dispatch</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-primary)', fontWeight: '500' }}>ORD_{Math.floor(Math.random()*90000)+10000}</td>
                  <td style={{ color: 'var(--text-muted)' }}>2026-09-{10+i}</td>
                  <td style={{ color: 'var(--text-primary)' }}>Warehouse {i}</td>
                  <td><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(217, 48, 37, 0.1)', color: 'var(--status-danger)' }}>Delayed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Last 7 Days (Status)</h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </div>
      </section>
    </div>
  );
}

function FleetTab({ fleet, stats }) {
  const doughData = {
    labels: ['Active', 'Maintenance'],
    datasets: [{
      data: [stats?.active, stats?.maintenance],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)'],
      borderWidth: 0
    }]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Simulated Map Area */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', zIndex: 2 }}>Live Telemetry Map (US Region)</h3>
          <div style={{ flex: 1, minHeight: '400px', position: 'relative', background: '#e8eaed', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {/* Simple scatter plot representation for map */}
            {fleet?.map((v, i) => {
              // Normalize lat/lon to percentages for simple plotting
              const top = `${100 - ((v.latitude - 25) / 24) * 100}%`;
              const left = `${((v.longitude - -125) / 58) * 100}%`;
              const isSpeeding = v.speed_kmh > 100;
              return (
                <div key={i} style={{ position: 'absolute', top, left, width: '8px', height: '8px', borderRadius: '50%', background: isSpeeding ? 'var(--status-danger)' : 'var(--accent-primary)', transform: 'translate(-50%, -50%)', boxShadow: `0 0 6px ${isSpeeding ? 'var(--status-danger)' : 'var(--accent-primary)'}` }} title={`${v.id} - ${v.speed_kmh}km/h`}></div>
              )
            })}
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', marginRight: '6px' }}></span> Normal 
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--status-danger)', borderRadius: '50%', margin: '0 6px 0 12px' }}></span> Speeding
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Fleet Status</h3>
            <div style={{ height: '200px' }}>
              <Doughnut data={doughData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }} />
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Speeding Vehicles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fleet?.filter(v => v.speed_kmh > 100).slice(0, 5).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '4px', borderLeft: '2px solid var(--status-danger)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{v.id}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--status-danger)', fontWeight: '600' }}>{v.speed_kmh} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

function TabButton({ active, onClick, children, icon }) {
  return (
    <button onClick={onClick} style={{ 
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: 'none', border: 'none', padding: '0.5rem 0',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
      cursor: 'pointer', fontSize: '1rem', fontWeight: '500', transition: 'all 0.2s'
    }}>
      {icon} {children}
    </button>
  );
}

function KpiCard({ title, value, icon, trend, isDanger, subtitle }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: isDanger ? '2px solid var(--status-danger)' : '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{title}</h4>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</h2>
        {trend && <p style={{ fontSize: '0.875rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{trend}</p>}
        {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function GcpBadge({ source, time, size, isLive, color, icon }) {
  if (!source) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ color, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>{icon} {source}</span>
      <span style={{ color: 'var(--border-highlight)' }}>|</span>
      {size && <><span style={{ color: 'var(--text-secondary)' }}>{size}</span><span style={{ color: 'var(--border-highlight)' }}>|</span></>}
      <span style={{ color: 'var(--text-secondary)' }}>{time}ms</span>
      {isLive && (
        <>
          <span style={{ color: 'var(--border-highlight)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-success)', fontWeight: '500' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)', animation: 'pulse-dot 1.5s infinite' }}></div>
            Live
          </span>
        </>
      )}
    </div>
  );
}

function AlertRow({ icon, text, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon}
        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>{text}</span>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{time}</span>
    </div>
  );
}
