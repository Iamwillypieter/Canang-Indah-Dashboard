import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout.jsx";

// Pages
import LabPBAdmin1 from "./pages/sub_menu/LabPBAdmin1.jsx";

// Forms
import QCAnalisaForm from "./forms/QCAnalisaForm.jsx";
import ResinInspectionForm from "./forms/ResinInspectionForm.jsx";

// Views
import QCAnalisaView from "./forms/QCAnalisaView.jsx";
import ResinInspectionView from "./forms/ResinInspectionView.jsx";

// Shared
import DokumenList from "./forms/DokumenList.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>

        {/* ================= ADMIN 1 ================= */}
        <Route path="lab/pb/admin1">
          <Route index element={<LabPBAdmin1 />} />

          {/* QC ANALISA */}
          <Route path="analisa" element={<QCAnalisaForm />} />
          <Route path="analisa/:id" element={<QCAnalisaView />} />

          {/* RESIN INSPECTION */}
          <Route path="resin" element={<ResinInspectionForm />} />
          <Route path="resin/:id" element={<ResinInspectionView />} />

          {/* DOKUMEN LIST (GABUNGAN) */}
          <Route path="dokumen" element={<DokumenList />} />
        </Route>

        {/* ================= ADMIN 2 (SUPERVISOR – NANTI) ================= */}
        {/*
        <Route path="lab/pb/admin2">
          <Route index element={<SupervisorDashboard />} />
        </Route>
        */}

      </Route>
    </Routes>
  );
}
