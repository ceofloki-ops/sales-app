import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface Product { id: number; sku: string; nombre: string; precio: number; unidad: string; categoria: string; activo: boolean; }

const empty = { sku: '', nombre: '', precio: 0, unidad: 'UND', categoria: '', activo: true };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => axios.get(`${API}/productos`, { headers: headers() }).then(r => setProducts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) await axios.put(`${API}/productos/${editing}`, form, { headers: headers() });
    else await axios.post(`${API}/productos`, form, { headers: headers() });
    setForm(empty); setEditing(null); setShowForm(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar producto?')) return;
    await axios.delete(`${API}/productos/${id}`, { headers: headers() });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Productos</h1><p style={{ color: 'var(--muted)', fontSize: 14 }}>Catálogo de productos</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}>+ Agregar</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>{editing ? 'Editar' : 'Nuevo'} producto</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {['sku', 'nombre', 'categoria'].map(f => (
              <div key={f}><label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{f.toUpperCase()}</label>
                <input value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} /></div>
            ))}
            <div><label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>PRECIO</label>
              <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: parseFloat(e.target.value) })} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>UNIDAD</label>
              <input value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={save}>Guardar</button>
            <button className="btn" style={{ background: 'var(--surface2)', color: 'var(--muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Unidad</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', color: '#25D366' }}>{p.sku}</td>
                <td>{p.nombre}</td>
                <td style={{ color: 'var(--muted)' }}>{p.categoria}</td>
                <td>S/ {p.precio?.toFixed(2)}</td>
                <td style={{ color: 'var(--muted)' }}>{p.unidad}</td>
                <td><span className={`badge ${p.activo ? 'badge-green' : 'badge-gray'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--surface2)', color: '#fff' }} onClick={() => { setForm(p); setEditing(p.id); setShowForm(true); }}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(p.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
