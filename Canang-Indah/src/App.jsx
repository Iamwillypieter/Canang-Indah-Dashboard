// App.jsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout.jsx";

// Pages
import LabPBAdmin1 from "./pages/sub_menu/LabPBAdmin1.jsx";

// Forms
import QCAnalisaForm from "./forms/QCAnalisaForm.jsx";
import ResinInspectionForm from "./forms/ResinInspectionForm.jsx";
import FlakesForm from "./forms/FlakesForm.jsx";
import LabPBForm from "./forms/LabPBForm.jsx";

// Views
import QCAnalisaView from "./forms/QCAnalisaView.jsx";
import ResinInspectionView from "./forms/ResinInspectionView.jsx";
import FlakesFormView from "./forms/FlakesFormView.jsx";

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

          {/* RESIN */}
          <Route path="resin" element={<ResinInspectionForm />} />
          <Route path="resin/:id" element={<ResinInspectionView />} />

          {/* FLAKES */}
          {/* Flakes Routes */}
          <Route path="flakes" element={<FlakesForm />} />
          <Route path="flakes/:id" element={<FlakesForm />} />
          <Route path="flakes/:id/edit" element={<FlakesForm isEditMode={true} />} />

          {/* LabPBForm */}
          <Route path="moisture" element={<LabPBForm />} />

          {/* DOKUMEN */}
          <Route path="dokumen" element={<DokumenList />} />
        </Route>

      </Route>
    </Routes>
  );
}
