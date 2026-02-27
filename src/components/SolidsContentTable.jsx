export default function SolidsContentTable({ solidContent, onChange }) {
  return (
    <>
      <h3>Solids Content</h3>
      <table>
        <thead>
          <tr>
            <th>Sample</th>
            <th>Alum Foil No</th>
            <th>Wt Alum Foil</th>
            <th>Wt Glue</th>
            <th>Wt + Dry Glue</th>
            <th>Wt Dry Glue</th>
            <th>Solids</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {solidContent.map((sample, sIdx) =>
            sample.rows.map((row, rIdx) => (
              <tr key={`${sIdx}-${rIdx}`}>
                {rIdx === 0 && (
                  <td rowSpan={3}>{sample.sampleTime}</td>
                )}
                {Object.keys(row).map(key => (
                  <td key={key}>
                    <input
                      value={row[key]}
                      onChange={e =>
                        onChange(sIdx, rIdx, key, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
