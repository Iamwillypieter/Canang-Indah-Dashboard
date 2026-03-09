export default function ResinInspectionHeader({ 
  tagName,
  date, 
  shift, 
  group, 
  onChange 
}) {
  return (
    <table style={styles.table}>
      <tbody>

        {/* TAG NAME AUTO */}
        <tr>
          <td style={styles.label}>
            <strong>Tag Name</strong>
          </td>

          <td colSpan="4">
            <input 
              type="text"
              value={tagName || ""}
              readOnly
              placeholder="Auto generated"
              style={styles.tagNameInput}
            />
          </td>
        </tr>

        {/* DATE */}
        <tr>
          <td style={styles.label}>Date</td>

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

        {/* SHIFT */}
        <tr>
          <td style={styles.label}>Shift</td>

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

        {/* GROUP */}
        <tr>
          <td style={styles.label}>Group</td>

          <td colSpan="4">
            <input 
              name="group"
              value={group || ""}
              onChange={onChange}
              placeholder="A / B / C / D"
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
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    cursor: 'not-allowed',
    boxSizing: 'border-box'
  }
};