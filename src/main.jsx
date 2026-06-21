import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import ClinicalTrialIntelligenceAssistant from "./pages/products/ClinicalTrialIntelligenceAssistant.jsx";
import LabLoop from "./pages/products/LabLoop.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route
            path="products/clinical-trial-intelligence-assistant"
            element={<ClinicalTrialIntelligenceAssistant />}
          />
          <Route path="products/labloop" element={<LabLoop />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
