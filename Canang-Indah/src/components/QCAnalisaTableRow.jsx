export default function QCAnalisaTableRow({ row, index, onChange }) {
  const fractionFields = [
    'fraction_gt_8', 'fraction_gt_4', 'fraction_gt_3_15', 
    'fraction_gt_2', 'fraction_gt_1', 'fraction_0_5', 
    'fraction_0_25', 'fraction_lt_0_25', 'jumlah_gr'
  ];

  return (
    <tr key={index}>
      <td style={{...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9'}}>
        {row.id}
      </td>
      
      <InputCell name="jam" value={row.jam} onChange={onChange} rowIndex={index} />
      <DateCell name="tanggal" value={row.tanggal} onChange={onChange} rowIndex={index} />
      <SelectCell name="shift_group" value={row.shift_group} onChange={onChange} rowIndex={index} />
      <InputCell name="material" value={row.material} onChange={onChange} rowIndex={index} textAlign="left" />
      
      {fractionFields.map((field) => (
        <InputCell 
          key={field} 
          name={field} 
          value={row[field]} 
          onChange={onChange} 
          rowIndex={index} 
        />
      ))}
      
      <InputCell name="keterangan" value={row.keterangan} onChange={onChange} rowIndex={index} textAlign="left" />
      <InputCell name="diperiksa_oleh" value={row.diperiksa_oleh} onChange={onChange} rowIndex={index} textAlign="left" />
    </tr>
  );
}

function InputCell({ name, value, onChange, rowIndex, textAlign = 'center' }) {
  return (
    <td style={styles.td}>
      <input 
        type="text" 
        name={name} 
        value={value} 
        onChange={(e) => onChange(e, rowIndex)} 
        style={{...styles.input, textAlign}}
      />
    </td>
  );
}

function DateCell({ name, value, onChange, rowIndex }) {
  return (
    <td style={styles.td}>
      <input 
        type="date" 
        name={name} 
        value={value} 
        onChange={(e) => onChange(e, rowIndex)} 
        style={styles.input}
      />
    </td>
  );
}

function SelectCell({ name, value, onChange, rowIndex }) {
  return (
    <td style={styles.td}>
      <input 
        type="text"
        name={name} 
        value={value} 
        onChange={(e) => onChange(e, rowIndex)} 
        style={styles.input}
      />
    </td>
  );
}

const styles = {
  td: {
    border: '1px solid #cbd5e1',
    padding: '0'
  },
  input: {
    width: '100%',
    padding: '8px 4px',
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    backgroundColor: 'transparent',
    textAlign: 'center'
  }
};