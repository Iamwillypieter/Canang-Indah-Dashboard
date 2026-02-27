// src/pages/LabPBPage.jsx
import { Outlet } from 'react-router-dom';

export default function LabPBPage() {
  console.log('✅ LabPBPage dirender!');
  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Submenu */}
      <div style={{ width: '200px', borderRight: '1px solid #ddd', padding: '16px' }}>
        <h4>Pilih Admin</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="admin1">👤 Admin 1</Link></li>
          <li><Link to="admin2">👤 Admin 2</Link></li>
        </ul>
      </div>

      {/* Konten Form */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}