import SampleTable from '../components/SampleTable.jsx';

export default function DataUtamaSection({ 
  formData, 
  samples, 
  onChange, 
  onSamplesChange,
  tagName,           // 👈 Tambahkan prop tagName
  onTagNameChange    // 👈 Tambahkan prop handler khusus (opsional)
}) {
  
  // Helper: Handle tagName change (bisa pakai onChange biasa atau custom)
  const handleTagNameChange = (e) => {
    if (onTagNameChange) {
      onTagNameChange(e.target.value);
    } else {
      onChange(e); // Fallback ke onChange biasa
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">⚙️ Data Utama</h3>
      
      {/* 👑 TAG NAME - Identitas Utama Dokumen */}
      <div className="form-group tag-name-group">
        <label className="form-label required">🏷️ Tag Name Document:</label>
        <input 
          type="text" 
          name="tagName"
          value={tagName || formData.tagName || ""}
          onChange={handleTagNameChange} 
          placeholder="Ex: 0001 1A"
          className="form-input tag-name-input"
          required
          style={{ 
            fontWeight: '600',
            borderColor: '#0ea5e9',
            backgroundColor: '#f0f9ff'
          }}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Timestamp:</label>
          <input 
            type="datetime-local" 
            name="timestamp" 
            value={formData.timestamp} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Board No:</label>
          <input 
            name="board_no" 
            value={formData.board_no} 
            onChange={onChange} 
            required 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Set Weight:</label>
          <input 
            type="number" 
            step="0.1" 
            name="set_weight" 
            value={formData.set_weight} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Shift/Group:</label>
          <select 
            name="shift_group" 
            value={formData.shift_group} 
            onChange={onChange} 
            className="form-select"
          >
            <option value="">Shift</option>
            {[1, 2, 3].map((num) => (
              ['A', 'B', 'C', 'D'].map((char) => (
                <option key={`${num}${char}`} value={`${num}${char}`}>
                  {`${num}${char}`}
                </option>
              ))
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tested By:</label>
          <input 
            name="tested_by" 
            value={formData.tested_by} 
            onChange={onChange} 
            required 
            className="form-input"
          />
        </div>
      </div>

      <h4 className="sub-section-title">🔧 Spesifikasi Teknis</h4>
      <div className="form-grid-small">
        <div className="form-group">
          <label className="form-label">Density Min:</label>
          <input 
            type="number" 
            step="0.01" 
            name="density_min" 
            value={formData.density_min} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Density Max:</label>
          <input 
            type="number" 
            step="0.01" 
            name="density_max" 
            value={formData.density_max} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Board Type:</label>
          <input 
            name="board_type" 
            value={formData.board_type} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Glue SL:</label>
          <input 
            type="text" 
            name="glue_sl" 
            value={formData.glue_sl} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Glue CL:</label>
          <input 
            type="text" 
            name="glue_cl" 
            value={formData.glue_cl} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Thick Min:</label>
          <input 
            type="number" 
            step="0.1" 
            name="thick_min" 
            value={formData.thick_min} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Thick Max:</label>
          <input 
            type="number" 
            step="0.1" 
            name="thick_max" 
            value={formData.thick_max} 
            onChange={onChange} 
            className="form-input"
          />
        </div>
      </div>

      <h4 className="sub-section-title">📊 Data Sample (24 pcs)</h4>
      <SampleTable
        samples={samples}
        onSamplesChange={onSamplesChange}
      />
    </div>
  );
}