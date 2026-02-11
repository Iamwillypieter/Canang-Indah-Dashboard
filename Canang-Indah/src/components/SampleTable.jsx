import { useState } from 'react';

export default function SampleTable({ samples = [], onSamplesChange }) {
  // const [samples, setSamples,] = useState(
  //   Array(24).fill().map((_, i) => ({
  //     no: i + 1,
  //     weight_gr: '',
  //     thickness_mm: '',
  //     length_mm: autoFill.length || '',
  //     width_mm: autoFill.width || ''
  //   }))
  // );
  if (!Array.isArray(samples)) {
    return <p>⚠️ Data sample tidak valid</p>;
  }

  const handleInputChange = (index, field, value) => {
    const updatedSamples = samples.map((sample, i) =>
      i === index
        ? { ...sample, [field]: value }
        : sample
    );

    onSamplesChange(updatedSamples);
  };

  return (
    <table
      border="1"
      cellPadding="8"
      style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}
    >
      <thead>
        <tr>
          <th>No Sample</th>
          <th>Berat (gr)</th>
          <th>Tebal (mm)</th>
          <th>Panjang (mm)</th>
          <th>Lebar (mm)</th>
        </tr>
      </thead>
      <tbody>
        {samples.map((sample, i) => (
          <tr key={sample.no}>
            <td>{sample.no}</td>

            <td>
              <input
                type="number"
                step="0.1"
                value={sample.weight_gr}
                onChange={(e) =>
                  handleInputChange(i, 'weight_gr', e.target.value)
                }
              />
            </td>

            <td>
              <input
                type="number"
                step="0.1"
                value={sample.thickness_mm}
                onChange={(e) =>
                  handleInputChange(i, 'thickness_mm', e.target.value)
                }
              />
            </td>

            <td>
              <input
                type="number"
                value={sample.length_mm}
                onChange={(e) =>
                  handleInputChange(i, 'length_mm', e.target.value)
                }
              />
            </td>

            <td>
              <input
                type="number"
                value={sample.width_mm}
                onChange={(e) =>
                  handleInputChange(i, 'width_mm', e.target.value)
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}