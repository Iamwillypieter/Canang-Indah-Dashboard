import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLabPBSubmenu, setShowLabPBSubmenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Tutup submenu saat ganti halaman
  useEffect(() => {
    if (!location.pathname.startsWith('/lab/pb')) {
      setShowLabPBSubmenu(false);
    }
  }, [location.pathname]);

  const isLabPBPage = location.pathname.startsWith('/lab/pb');

  // ✅ Fungsi Logout
  const handleLogout = () => {
    // Konfirmasi logout
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar?');
    
    if (confirmLogout) {
      // Aktifkan loading bar
      setIsLoggingOut(true);
      
      // Simulasi delay untuk efek loading (opsional)
      setTimeout(() => {
        // Hapus data auth dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect ke login
        navigate('/login', { replace: true });
        
        // Matikan loading bar
        setIsLoggingOut(false);
        
        console.log('✅ Logout berhasil');
      }, 500); // Delay 0.5 detik untuk efek loading
    }
  };

  // ✅ Ambil data user dari localStorage
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Tambahkan useEffect untuk cek token validity
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        // Redirect ke login jika tidak ada auth
        navigate('/login', { replace: true });
        return;
      }
      
      // Optional: Cek token expired (decode JWT)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Session expired. Please login again.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        // Token invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-icon">⚙️</span>
          <span>PT CANANG INDAH</span>
        </div>

        <div className="title-dashboard">Laboratory Dashboard</div>
        
        {/* User Info tanpa dropdown */}
        <div className="user-info">
          <div className="user-avatar">
            👤
          </div>
          <div className="user-details">
            <span className="username">{userData?.username || 'User'}</span>
            <span className="role">{userData?.role === 'admin' ? 'Administrator' : 'Supervisor'}</span>
          </div>
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
                <Link 
                  to="/lab/pb/admin1" 
                  className="menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
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

            {/* Logout Button di Sidebar Bottom */}
            <div className="sidebar-footer">
              <button 
                onClick={handleLogout} 
                className="logout-button-sidebar"
                title="Logout"
              >
                <span className="logout-icon-sidebar">🚪</span>
                <span className="logout-text-sidebar">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Loading Overlay */}
      {isLoggingOut && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Logging out...</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}