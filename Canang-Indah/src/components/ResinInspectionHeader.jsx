export default function ResinInspectionHeader({ 
  tagName,    // 👈 Tambahkan prop tagName
  date, 
  shift, 
  group, 
  onChange 
}) {
  return (
    <table style={styles.table}>
      <tbody>
        <tr>
          <td className="label" style={styles.label}>
            <strong>Tag Name</strong>
          </td>
          <td colSpan="4">
            <input 
              type="text" 
              name="tagName" 
              value={tagName || ""} 
              onChange={onChange} 
              placeholder="ex: 0001 1A"
              style={styles.tagNameInput}
            />
          </td>
        </tr>

        <tr>
          <td className="label" style={styles.label}>Date</td>
          <td colSpan="4">
            <input 
              type="date" 
              name="date" 
              value={date || ""} 
              onChange={onChange} 
              style={styles.input}
            />
          </td>
        </tr>

        <tr>
          <td className="label" style={styles.label}>Shift</td>
          <td colSpan="4">
            <input 
              name="shift" 
              value={shift || ""} 
              onChange={onChange} 
              placeholder="1 / 2 / 3"
              style={styles.input}
            />
          </td>
        </tr>

        <tr>
          <td className="label" style={styles.label}>Group</td>
          <td colSpan="4">
            <input 
              name="group" 
              value={group || ""} 
              onChange={onChange} 
              placeholder="Group A / B / C / D"
              style={styles.input}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px'
  },
  label: {
    width: '120px',
    fontWeight: '600',
    color: '#334155',
    padding: '8px 4px',
    verticalAlign: 'top'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  tagNameInput: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #0ea5e9',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#f0f9ff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  }
};