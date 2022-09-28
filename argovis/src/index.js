import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout";
import ArgovisExplore from "./pages/explore"
import HM from "./pages/heatmap"
import Grids from "./pages/grids"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ArgovisExplore />} />
          <Route path="heatmap" element={<HM />} />
          <Route path="grids" element={<Grids />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);