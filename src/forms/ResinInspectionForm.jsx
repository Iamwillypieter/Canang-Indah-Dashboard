import "./ResinInspectionForm.css";
import { useResinInspectionForm } from "../hooks/useResinInspectionForm.js";
import ResinInspectionHeader from "../components/ResinInspectionHeader.jsx";
import InspectionTable from "../components/InspectionTable.jsx";
import SolidsContentTable from "../components/SolidsContentTable.jsx";
import ResinInspectionFooter from "../components/ResinInspectionFooter.jsx";

export default function ResinInspectionForm() {
  const {
    formData,
    handleChange,
    handleInspectionChange,
    handleSolidChange,
    handleSubmit
  } = useResinInspectionForm();

  return (
    <div className="form-wrapper">
      <h2>RAW RESIN INSPECTION 🛠️</h2>

      <form onSubmit={handleSubmit}>
        {/* 👇 Tambahkan prop tagName */}
        <ResinInspectionHeader
          tagName={formData.tagName}  // 👈 Oper tagName ke Header
          date={formData.date}
          shift={formData.shift}
          group={formData.group}
          onChange={handleChange}
        />

        <InspectionTable
          inspection={formData.inspection}
          onChange={handleInspectionChange}
        />

        <SolidsContentTable
          solidContent={formData.solidContent}
          onChange={handleSolidChange}
        />

        <ResinInspectionFooter
          comment_by={formData.comment_by}
          createdBy={formData.createdBy}
          onChange={handleChange}
        />

        <button className="submit" type="submit">Kirim</button>
      </form>
    </div>
  );
}