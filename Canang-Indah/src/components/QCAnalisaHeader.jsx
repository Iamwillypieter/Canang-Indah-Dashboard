export default function QCAnalisaHeader() {
  return (
    <div style={styles.headerContainer}>
      <h2 style={styles.title}>🔍 Quality Control Particleboard</h2>
      <p style={styles.subtitle}>ANALISA SCREEN</p>
    </div>
  );
}

const styles = {
  headerContainer: {
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '4px'
  }
};