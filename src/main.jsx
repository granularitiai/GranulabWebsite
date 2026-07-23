import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Resources from "./pages/Resources.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import "./styles.css";

const ClinicalTrialIntelligenceAssistant = lazy(() =>
  import("./pages/products/ClinicalTrialIntelligenceAssistant.jsx"),
);
const ClinicalDataVisualizationAssistant = lazy(() =>
  import("./pages/products/ClinicalDataVisualizationAssistant.jsx"),
);
const LabLoop = lazy(() => import("./pages/products/LabLoop.jsx"));

function productPage(Component) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-ink px-5 py-16 text-center text-slate-300">
          Loading product...
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="resources" element={<Resources />} />
          <Route path="services/:serviceSlug" element={<ServiceDetail />} />
          <Route
            path="products/clinical-trial-intelligence-assistant"
            element={productPage(ClinicalTrialIntelligenceAssistant)}
          />
          <Route path="products/labloop" element={productPage(LabLoop)} />
          <Route
            path="products/clinical-data-visualization"
            element={productPage(ClinicalDataVisualizationAssistant)}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
