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
    shift_group: ''
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

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${6 + Math.random() * 4}s`;

        container.appendChild(particle);
      }

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'emerald-particle';

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        particle.style.animationDuration = `${8 + Math.random() * 4}s`;

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

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      shift_group: role === 'admin' ? formData.shift_group : ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (formData.role === 'admin' && !formData.shift_group) {
      setError('Shift wajib dipilih untuk Admin');
      return;
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL + "/api";

      await axios.post(`${API_BASE}/register`, {
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        shift_group: formData.role === 'admin' ? formData.shift_group : null
      });

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

          {error && <div className="error-container">{error}</div>}
          {success && <div className="success-container">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input-register"
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
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Role</label>
              <div className="role-selection">
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`role-button admin-role ${formData.role === 'admin' ? 'active' : ''}`}
                >
                  <div className="font-semibold">Admin</div>
                  <div className="text-xs mt-1 opacity-80">Shift Based Access</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('supervisor')}
                  className={`role-button supervisor-role ${formData.role === 'supervisor' ? 'active' : ''}`}
                >
                  <div className="font-semibold">Supervisor</div>
                  <div className="text-xs mt-1 opacity-80">All Shift Access</div>
                </button>
              </div>
            </div>

            {/* SHIFT DROPDOWN */}
            {formData.role === 'admin' && (
              <div className="form-group">
                <label className="form-label">Select Shift Group</label>
                <select
                  name="shift_group"
                  value={formData.shift_group}
                  onChange={handleChange}
                  className="form-input-register"
                  required
                >
                  <option value="">-- Select Shift --</option>
                  {[
                    "1A","1B","1C","1D",
                    "2A","2B","2C","2D",
                    "3A","3B","3C","3D"
                  ].map(shift => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
        </div>
      </div>
    </>
  );
};

export default Register;