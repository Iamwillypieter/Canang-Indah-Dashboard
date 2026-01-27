import { Link, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const location = useLocation();
  const [showLabPBSubmenu, setShowLabPBSubmenu] = useState(false);

  // Tutup submenu saat ganti halaman
  useEffect(() => {
    if (!location.pathname.startsWith('/lab/pb')) {
      setShowLabPBSubmenu(false);
    }
  }, [location.pathname]);

  const isLabPBPage = location.pathname.startsWith('/lab/pb');

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-icon">⚙️</span>
          <span>PT CANANG INDAH</span>
        </div>

        <div className="title">Laboratory Dashboard</div>
        <div className="user-info">
          <span>👤 Willy Situmorang</span>
          <span className="role">Super Lab User</span>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <ul>
              <li className={location.pathname === '/' ? 'active' : ''}>
                <Link to="/">
                  <span className="menu-icon">🏠</span>
                  <span className="menu-text">Home</span>
                </Link>
              </li>

              {/* Lab PB with Submenu */}
              <li className={`menu-parent ${isLabPBPage ? 'active' : ''}`}>
                {/* 🔥 Bungkus dalam Link ke halaman default */}
                <Link 
                  to="/lab/pb/admin1" 
                  className="menu-toggle"
                  onClick={(e) => {
                    e.preventDefault(); // ← cegah navigasi saat klik parent
                    setShowLabPBSubmenu(!showLabPBSubmenu);
                  }}
                >
                  <span className="menu-icon">🧪</span>
                  <span className="menu-text">Lab PB</span>
                  <span className="arrow">{showLabPBSubmenu ? '▲' : '▼'}</span>
                </Link>
                
                {showLabPBSubmenu && (
                  <ul className="submenu">
                    <li className={location.pathname === '/lab/pb/admin1' ? 'active' : ''}>
                      <Link to="/lab/pb/admin1">
                        <span className="menu-icon">👤</span>
                        <span className="menu-text">Admin 1</span>
                      </Link>
                    </li>
                    <li className={location.pathname === '/lab/pb/admin2' ? 'active' : ''}>
                      <Link to="/lab/pb/admin2">
                        <span className="menu-icon">👥</span>
                        <span className="menu-text">Admin 2</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              {/* Tambahkan menu lain jika perlu */}
              <li className={location.pathname.startsWith('/lab/mdf') ? 'active' : ''}>
                <Link to="/lab/mdf">
                  <span className="menu-icon">🧱</span>
                  <span className="menu-text">Lab MDF</span>
                </Link>
              </li>
              <li className={location.pathname.startsWith('/supervisor') ? 'active' : ''}>
                <Link to="/supervisor">
                  <span className="menu-icon">👨‍💼</span>
                  <span className="menu-text">Supervisor</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}