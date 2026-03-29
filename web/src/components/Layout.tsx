import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Productos', icon: '📦' },
  { path: '/orders', label: 'Pedidos', icon: '🧾' },
  { path: '/sellers', label: 'Vendedores', icon: '👤' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #25D366, #128C4E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Sales App</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Panel Admin</div>
          </div>
        </div>
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              margin: '2px 8px', borderRadius: 8, textDecoration: 'none', fontSize: 14,
              background: isActive ? 'rgba(37,211,102,0.12)' : 'transparent',
              color: isActive ? '#25D366' : 'var(--muted)',
              fontWeight: isActive ? 600 : 400,
            })}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, padding: 24 }}>
        {children}
      </div>
    </div>
  );
}
