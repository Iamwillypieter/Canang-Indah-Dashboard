import { useState } from 'react';

export default function QCAnalisaHeader({ onTagChange }) {
  const [tagName, setTagName] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTagName(value);
    
    if (onTagChange) {
      onTagChange(value);
    }
  };

  return (
    <div style={styles.headerContainer}>
      <div style={styles.contentWrapper}>
        {/* Bagian Judul */}
        <div style={styles.titleSection}>
          <h2 style={styles.title}>🔍 Quality Control Particleboard</h2>
          <p style={styles.subtitle}>ANALISA SCREEN</p>
        </div>

        {/* Bagian Input Tag Name */}
        <div style={styles.inputSection}>
          <label style={styles.label}>Tag Name Document</label>
          <input
            type="text"
            style={styles.input}
            placeholder="ex: 0001 1A"
            value={tagName}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  headerContainer: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // Biar agak cantik dikit
  },
  contentWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // Biar responsif di HP
    gap: '20px'
  },
  titleSection: {
    flex: 1,
    minWidth: '250px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1e293b'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '4px',
    margin: 0
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '200px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' // Biar padding gak ngerusak lebar
  }
};