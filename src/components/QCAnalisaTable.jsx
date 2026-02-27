import QCAnalisaTableRow from "./QCAnalisaTableRow";
import QCAnalisaStandardRow from "./QCAnalisaStandardRow";

export default function QCAnalisaTable({ rows, onChange }) {
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} style={{...styles.th, ...header.style}}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <QCAnalisaStandardRow type="ABSL" />
          <QCAnalisaStandardRow type="ABCL" />
          
          {rows.map((row, index) => (
            <QCAnalisaTableRow 
              key={index} 
              row={row} 
              index={index} 
              onChange={onChange} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headers = [
  { label: 'No', style: { width: '40px' } },
  { label: 'Jam', style: { width: '80px' } },
  { label: 'Tanggal', style: { width: '130px' } },
  { label: 'Shift Group', style: { width: '100px' } },
  { label: 'Material', style: { width: '150px' } },
  { label: 'Fraksi >8' },
  { label: 'Fraksi >4' },
  { label: 'Fraksi >3.15' },
  { label: 'Fraksi >2' },
  { label: 'Fraksi >1' },
  { label: 'Fraksi 0.5' },
  { label: 'Fraksi 0.25' },
  { label: 'Fraksi <0.25' },
  { label: 'Total (gr)' },
  { label: 'Keterangan' },
  { label: 'Pemeriksa' }
];

const styles = {
  tableContainer: {
    overflowX: 'auto',
    maxHeight: '70vh',
    border: '1px solid #cbd5e1',
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1600px'
  },
  th: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontWeight: '600',
    fontSize: '12px',
    padding: '10px 5px',
    border: '1px solid #cbd5e1',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10
  }
};