export default function QCAnalisaStandardRow({ type }) {
  const standards = {
    ABSL: {
      label: 'STANDARD ABSL',
      values: ['0', '0-1', '0-5', '0-10', '0.5-20', '15-45', '25-60', '<20']
    },
    ABCL: {
      label: 'STANDARD ABCL',
      values: ['0-5', '0-10', '2-20', '15-35', '20-50', '18-40', '3-10', '<5']
    }
  };

  const standard = standards[type];
  
  return (
    <tr style={styles.standardRow}>
      <td colSpan="5" style={styles.standardLabel}>{standard.label}</td>
      {standard.values.map((value, index) => (
        <td key={index}>{value}</td>
      ))}
      <td colSpan="3"></td>
    </tr>
  );
}

const styles = {
  standardRow: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
    fontSize: '11px',
    textAlign: 'center',
    color: '#475569'
  },
  standardLabel: {
    padding: '8px'
  }
};