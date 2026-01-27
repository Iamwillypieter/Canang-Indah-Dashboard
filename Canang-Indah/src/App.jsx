import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout.jsx";
import LabPBAdmin1 from "./pages/sub_menu/LabPBAdmin1.jsx";
import QCAnalisaForm from "./forms/QCAnalisaForm.jsx";
import DokumenList from "./forms/DokumenList.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>

        {/* ADMIN 1 */}
        <Route path="lab/pb/admin1">
          <Route index element={<LabPBAdmin1 />} />
          <Route path="analisa" element={<QCAnalisaForm />} />
          <Route path="dokumen" element={<DokumenList />} />
          {/* <Route path="moisture" element={<LabPBForm />} />
          <Route path="flakes" element={<FlakesForm />} />
          <Route path="resin" element={<ResinInspectionForm />} /> */}
        </Route>

        {/* ADMIN 2 */}
        {/* <Route path="lab/pb/admin2" element={<Supervisor />} /> */}

      </Route>
    </Routes>
  );
}
