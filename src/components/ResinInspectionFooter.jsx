export default function ResinInspectionFooter({ comment_by, createdBy, onChange }) {
  return (
    <table>
      <tbody>
        <tr>
          <td>Komentar</td>
          <td>
            <input name="comment_by" value={comment_by} onChange={onChange} />
          </td>
        </tr>
        <tr>
          <td>Dibuat oleh</td>
          <td>
            <input name="createdBy" value={createdBy} onChange={onChange} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
