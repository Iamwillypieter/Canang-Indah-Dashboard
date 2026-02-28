import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const createParticles = () => {
      const container = document.querySelector('.register-container');
      if (!container) return;

      const existingParticles = container.querySelectorAll('.gold-particle, .emerald-particle');
      existingParticles.forEach(p => p.remove());

      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 6 + Math.random() * 4;
        
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        container.appendChild(particle);
      }

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'emerald-particle';
        
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 8 + Math.random() * 4;
        
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        container.appendChild(particle);
      }
    };

    createParticles();
    
    return () => {
      const particles = document.querySelectorAll('.gold-particle, .emerald-particle');
      particles.forEach(p => p.remove());
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi client-side
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL + "/api";;
      
      const response = await axios.post(`${API_BASE}/register`, formData);
      
      setSuccess('Registrasi berhasil! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Register error:', err.response?.data);
      
      if (err.response?.data?.details) {
        const detailMessage = err.response.data.details.join('\n');
        setError(`${err.response.data.error}:\n${detailMessage}`);
      } else {
        setError(err.response?.data?.error || 'Registrasi gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return null;
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <>
      <div className="luxury-background"></div>
      
      <div className="register-container">
        <div className="luxury-card">
          <div className="register-header">
            <h1 className="register-title">Create Account</h1>
          </div>

          {error && (
            <div className="error-container">
              {error}
            </div>
          )}

          {success && (
            <div className="success-container">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input-register"
                placeholder="Choose a unique username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input-register"
                placeholder="Create a secure password"
                required
                minLength="8"
              />
              
              
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input-register"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Role</label>
              <div className="role-selection">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'admin'})}
                  className={`role-button admin-role ${formData.role === 'admin' ? 'active' : ''}`}
                >
                  <div className="font-semibold">Admin</div>
                  <div className="text-xs mt-1 opacity-80">Full Access</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'supervisor'})}
                  className={`role-button supervisor-role ${formData.role === 'supervisor' ? 'active' : ''}`}
                >
                  <div className="font-semibold">Supervisor</div>
                  <div className="text-xs mt-1 opacity-80">Limited Access</div>
                </button>
              </div>
              <input type="hidden" name="role" value={formData.role} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <span className="loading-text">Creating Account...</span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="login-section">
            <p className="login-text">
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Sign In
              </Link>
            </p>
          </div>

          <div className="role-info-section">
            <p className="role-info-title">Role Permissions:</p>
            <p className="role-info-description">
              <span>Admin:</span> Full access to all features<br />
              <span>Supervisor:</span> Limited access to specific modules
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;