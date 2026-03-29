import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'badge-yellow', confirmado: 'badge-green', entregado: 'badge-green', cancelado: 'badge-red'
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const load = () => axios.get(`${API}/pedidos`, { headers: headers() }).then(r => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, estado: string) => {
    await axios.put(`${API}/pedidos/${id}/estado`, { estado }, { headers: headers() }).catch(() => {});
    load();
  };

  const filtered = orders.filter(o =>
    !filter || o.estado === filter || String(o.id).includes(filter)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Pedidos</h1><p style={{ color: 'var(--muted)', fontSize: 14 }}>Todos los pedidos</p></div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>Cliente ID</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
          <tbody>
            {filtered.map((o: any) => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace', color: '#25D366' }}>#{o.id}</td>
                <td style={{ color: 'var(--muted)' }}>{o.cliente_id}</td>
                <td style={{ fontWeight: 600 }}>S/ {o.total?.toFixed(2)}</td>
                <td><span className={`badge ${STATUS_COLORS[o.estado] || 'badge-gray'}`}>{o.estado}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString('es-PE')}</td>
                <td>
                  <select value={o.estado} onChange={e => updateStatus(o.id, e.target.value)} style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Sin pedidos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
