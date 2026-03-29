import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

interface Stats {
  pedidos_hoy: number;
  total_clientes: number;
  total_productos: number;
  total_pedidos: number;
  ventas_hoy: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/stats`)
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Pedidos hoy', value: stats.pedidos_hoy, icon: '📋', color: '#3b82f6' },
    { label: 'Ventas hoy', value: `$${stats.ventas_hoy.toFixed(0)}`, icon: '💰', color: '#25D366' },
    { label: 'Total clientes', value: stats.total_clientes, icon: '👤', color: '#f59e0b' },
    { label: 'Total productos', value: stats.total_productos, icon: '📦', color: '#8b5cf6' },
    { label: 'Total pedidos', value: stats.total_pedidos, icon: '🧾', color: '#ef4444' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Resumen general del negocio</p>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando estadísticas...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: '#1a1a1a',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #2a2a2a',
              borderLeft: `4px solid ${card.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 32 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 12, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
