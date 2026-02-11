// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout.jsx";
import RequireAuth, { RequireRole } from "./utils/RequireAuth.jsx";

// Auth
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";

// Pages
import HomePage from "./pages/HomePage.jsx";
import LabPBAdmin1 from "./pages/sub_menu/LabPBAdmin1.jsx";
import SupervisorPage from "./pages/SupervisorPage.jsx";

// Forms
import QCAnalisaForm from "./forms/QCAnalisaForm.jsx";
import ResinInspectionForm from "./forms/ResinInspectionForm.jsx";
import FlakesForm from "./forms/FlakesForm.jsx";
import LabPBForm from "./forms/LabPBForm.jsx";

// Views
import QCAnalisaView from "./forms/QCAnalisaView.jsx";
import ResinInspectionView from "./forms/ResinInspectionView.jsx";
import FlakesFormView from "./forms/FlakesFormView.jsx";
import LabPBFormView from "./forms/LabPBFormView.jsx";

// Shared
import DokumenList from "./forms/DokumenList.jsx";

export default function App() {
  return (
    <Routes>

      {/* ===== AUTH ===== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ===== PROTECTED ===== */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardLayout />}>

          {/*  HOME PAGE - ALL ROLES */}
          <Route index element={<HomePage />} />

          {/* LAB PB - ADMIN ONLY */}
          <Route element={<RequireRole allowedRoles={['admin']} />}>
            <Route path="lab/pb/admin1">
              <Route index element={<LabPBAdmin1 />} />

              <Route path="analisa" element={<QCAnalisaForm />} />
              <Route path="analisa/:id" element={<QCAnalisaView mode="view" />} />
              <Route path="analisa/:id/edit" element={<QCAnalisaView mode="edit" />} />

              <Route path="resin" element={<ResinInspectionForm />} />
              <Route path="resin/:id" element={<ResinInspectionView />} />
              <Route path="resin/:id/edit" element={<ResinInspectionView isEditing />} />

              <Route path="flakes" element={<FlakesForm />} />
              <Route path="flakes/:id" element={<FlakesFormView mode="view" />} />
              <Route path="flakes/:id/edit" element={<FlakesFormView mode="edit" />} />

              <Route path="moisture" element={<LabPBForm />} />
              <Route path="lab-pb-form/:id" element={<LabPBFormView mode="view" />} />
              <Route path="lab-pb-form/:id/edit" element={<LabPBFormView mode="edit" />} />

              <Route path="dokumen" element={<DokumenList />} />
            </Route>
          </Route>

          {/* VIEW DOKUMEN - ADMIN & SUPERVISOR */}
          <Route element={<RequireRole allowedRoles={['admin', 'supervisor']} />}>
            <Route path="view">
              <Route path="qc/:id" element={<QCAnalisaView mode="view" />} />
              <Route path="resin/:id" element={<ResinInspectionView mode="view" />} />
              <Route path="flakes/:id" element={<FlakesFormView mode="view" />} />
              <Route path="lab-pb/:id" element={<LabPBFormView mode="view" />} />
            </Route>
          </Route>

          {/* SUPERVISOR PAGE - SUPERVISOR ONLY */}
          <Route element={<RequireRole allowedRoles={['supervisor']} />}>
            <Route path="supervisor" element={<SupervisorPage />} />
          </Route>

        </Route>
      </Route>

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}