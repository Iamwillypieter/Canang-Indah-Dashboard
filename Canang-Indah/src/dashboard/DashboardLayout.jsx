// dashboard/DashboardLayout.jsx
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from "../assets/logo.png";
import './DashboardLayout.css';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLabPBSubmenu, setShowLabPBSubmenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);

  // Get user role
  const userRole = userData?.role;

  // Tutup submenu klo ganti halaman
  useEffect(() => {
    if (!location.pathname.startsWith('/lab/pb')) {
      setShowLabPBSubmenu(false);
    }
  }, [location.pathname]);

  const isLabPBPage = location.pathname.startsWith('/lab/pb');

  //   Logout
  const handleLogout = () => {
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar?');
    
    if (confirmLogout) {
      setIsLoggingOut(true);
      
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuth');
        
        navigate('/login', { replace: true });
        setIsLoggingOut(false);
        
        console.log('✅ Logout berhasil');
      }, 500); 
    }
  };

  // ✅ Ambil data user dari localStorage
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

  // useEffect untuk cek token validity
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        navigate('/login', { replace: true });
        return;
      }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isAuth');
          alert('Session expired. Please login again.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuth');
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
          <img src={logo} alt="PT Canang Indah Logo" className="logo-image" />
        </div>

        <div className="title-dashboard">Laboratory Dashboard</div>
        
        {/* User Info */}
        <div className="user-info">
          <div className="user-avatar">
            👤
          </div>
          <div className="user-details">
            <span className="username">{userData?.username || 'User'}</span>
            <span className="role">
              {userRole === 'admin' ? 'Admin' : 
               userRole === 'supervisor' ? 'Supervisor' : 'User'}
            </span>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <ul>
              {/* 🏠 HOME - ALL ROLES */}
              <li className={location.pathname === '/' ? 'active' : ''}>
                <Link to="/">
                  <span className="menu-icon">🏠</span>
                  <span className="menu-text">Home</span>
                </Link>
              </li>

              {/* 🔒 LAB PB - ADMIN ONLY */}
              {userRole === 'admin' && (
                <li className={`menu-parent ${isLabPBPage ? 'active' : ''}`}>
                  <Link 
                    to="/lab/pb/admin1" 
                    className="menu-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLabPBSubmenu(!showLabPBSubmenu);
                    }}
                  >
                    <span className="menu-icon">🅿️🅱️</span>
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
                      <li className="disabled">
                        <Link to="/lab/pb/admin2">
                          <span className="menu-icon">👥</span>
                          <span className="menu-text">Admin 2</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )}

              {/* 🔒 LAB MDF - ADMIN ONLY (DISABLED) */}
              {userRole === 'admin' && (
                <li className="disabled">
                  <Link to="/lab/mdf">
                    <span className="menu-icon">Ⓜ️🇩🇫</span>
                    <span className="menu-text">Lab MDF</span>
                  </Link>
                </li>
              )}

              {/* 👨‍💼 SUPERVISOR - SUPERVISOR ONLY */}
              {userRole === 'supervisor' && (
                <li className={location.pathname.startsWith('/supervisor') ? 'active' : ''}>
                  <Link to="/supervisor">
                    <span className="menu-icon">🧑‍💼</span>
                    <span className="menu-text">Supervisor</span>
                  </Link>
                </li>
              )}

            </ul>

            {/* Logout Button */}
            <div className="sidebar-footer">
              <button 
                onClick={handleLogout} 
                className="logout-button-sidebar"
                title="Logout"
              >
                <span className="logout-icon-sidebar">🔚</span>
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