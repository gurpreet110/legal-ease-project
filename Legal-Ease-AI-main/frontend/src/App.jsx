import { BrowserRouter, Routes, Route } from "react-router-dom";
import LegalEase from "./pages/LegalEase.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<LegalEase />} />
      </Routes>
    </BrowserRouter>
  );
}
