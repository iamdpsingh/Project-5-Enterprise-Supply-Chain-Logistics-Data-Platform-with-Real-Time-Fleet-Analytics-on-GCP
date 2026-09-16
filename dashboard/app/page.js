"use client";

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Package, Truck, AlertTriangle, DollarSign, Activity, MapPin 
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Home() {
  const [kpis, setKpis] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fleet, setFleet] = useState([]);
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
        setFleet(await fleetRes.json());
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Live sync every 30s
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: shipments.map(s => s.dispatch_date),
    datasets: [
      {
        label: 'Total Shipments',
        data: shipments.map(s => s.total),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Delayed Shipments',
        data: shipments.map(s => s.delayed),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8' } },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Control Tower Data...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Executive Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time metrics from BigQuery and Firestore</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)', animation: 'pulse-dot 2s infinite' }}></div>
          Live Sync Active
        </div>
      </header>
      
      {/* KPI Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <KpiCard title="Total Shipments" value={kpis?.totalShipments?.toLocaleString()} icon={<Package size={20} color="var(--accent-primary)" />} />
        <KpiCard title="On-Time Delivery" value={`${kpis?.onTimeDeliveryRate}%`} icon={<Activity size={20} color="var(--status-success)" />} trend="+1.2%" />
        <KpiCard title="Delayed Shipments" value={kpis?.delayedShipments?.toLocaleString()} icon={<AlertTriangle size={20} color="var(--status-danger)" />} isDanger />
        <KpiCard title="Logistics Revenue" value={`$${(kpis?.totalRevenue / 1000000).toFixed(1)}M`} icon={<DollarSign size={20} color="var(--status-warning)" />} />
      </section>
      
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1 }}>
        {/* Main Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Delivery Performance Trends (14 Days)</h3>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Fleet Tracking Sidebar */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Active Fleet Status</h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {fleet.length} Vehicles
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {fleet.map((v, i) => (
              <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '6px' }}>
                    <Truck size={16} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{v.id}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={10} /> {v.latitude}, {v.longitude}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: v.speed_kmh > 100 ? 'var(--status-warning)' : 'var(--text-primary)' }}>{v.speed_kmh} km/h</p>
                  <p style={{ fontSize: '0.7rem', color: v.status === 'Active' ? 'var(--status-success)' : 'var(--status-danger)' }}>{v.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
      `}} />
    </>
  );
}

function KpiCard({ title, value, icon, trend, isDanger }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: isDanger ? '2px solid var(--status-danger)' : '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{title}</h4>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</h2>
        {trend && <p style={{ fontSize: '0.875rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{trend} vs last month</p>}
      </div>
    </div>
  );
}
