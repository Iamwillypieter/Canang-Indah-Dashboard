export default function ResinInspectionHeader({ date, shift, group, onChange }) {
  return (
    <table>
      <tbody>
        <tr>
          <td className="label">Date</td>
          <td colSpan="4">
            <input type="date" name="date" value={date} onChange={onChange} />
          </td>
        </tr>
        <tr>
          <td className="label">Shift</td>
          <td colSpan="4">
            <input name="shift" value={shift} onChange={onChange} />
          </td>
        </tr>
        <tr>
          <td className="label">Group</td>
          <td colSpan="4">
            <input name="group" value={group} onChange={onChange} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
