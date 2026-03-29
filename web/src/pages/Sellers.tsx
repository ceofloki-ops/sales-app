import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface Seller { id: number; nombre: string; email: string; activo: boolean; created_at: string; }

export default function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [showForm, setShowForm] = useState(false);

  const load = () => axios.get(`${API}/vendedores`, { headers: headers() }).then(r => setSellers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/vendedores`, form, { headers: headers() }).catch(() => {});
    setForm({ nombre: '', email: '', password: '' }); setShowForm(false); load();
  };

  const toggle = async (id: number, activo: boolean) => {
    await axios.put(`${API}/vendedores/${id}`, { activo: !activo }, { headers: headers() }).catch(() => {});
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Vendedores</h1><p style={{ color: 'var(--muted)', fontSize: 14 }}>Gestión del equipo de ventas</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo vendedor</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Nuevo vendedor</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[['nombre', 'Nombre'], ['email', 'Email'], ['password', 'Contraseña']].map(([f, l]) => (
              <div key={f}><label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{l}</label>
                <input type={f === 'password' ? 'password' : 'text'} value={(form as any)[f]}
                  onChange={e => setForm({ ...form, [f]: e.target.value })} /></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={create}>Crear</button>
            <button className="btn" style={{ background: 'var(--surface2)', color: 'var(--muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Estado</th><th>Desde</th><th></th></tr></thead>
          <tbody>
            {sellers.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                <td style={{ color: 'var(--muted)' }}>{s.email}</td>
                <td><span className={`badge ${s.activo ? 'badge-green' : 'badge-gray'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(s.created_at).toLocaleDateString('es-PE')}</td>
                <td>
                  <button className={`btn btn-sm ${s.activo ? 'btn-danger' : ''}`}
                    style={!s.activo ? { background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' } : {}}
                    onClick={() => toggle(s.id, s.activo)}>
                    {s.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {sellers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Sin vendedores</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
