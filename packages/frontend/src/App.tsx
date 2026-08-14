import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import Jobs from "./pages/Jobs";
import Exports from "./pages/Exports";
import Settings from "./pages/Settings";
import BaseResumeVariants from "./pages/BaseResumeVariants";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/exports" element={<Exports />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/base-resume/:id/variants"
            element={<BaseResumeVariants />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
