import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const container = document.querySelector('.login-container');
    if (!container) return;

    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'gold-particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 5}s`;
      p.style.animationDuration = `${6 + Math.random() * 4}s`;
      container.appendChild(p);
    }

    return () => {
      document.querySelectorAll('.gold-particle').forEach(p => p.remove());
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:3001/api/login',
        formData
      );

      const { token, user } = res.data;

      // ===== AUTH STORAGE =====
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuth', 'true'); // 🔥 penting

      // ===== REDIRECT KE ROOT =====
      navigate('/', { replace: true });

    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="luxury-background"></div>

      <div className="login-container">
        <div className="luxury-card">

          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in to your exclusive account
            </p>
          </div>

          {error && <div className="error-container">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input-login"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input-login"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="register-section">
            <p className="register-text">
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;
