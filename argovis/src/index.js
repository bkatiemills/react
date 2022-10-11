import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout";
import ArgovisExplore from "./pages/explore"
import Grids from "./pages/grids"
import ArgoExplore from "./pages/argo"
import TCExplore from "./pages/tc"
import Drifters from "./pages/drifters"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ArgovisExplore />} />
          <Route path="argo" element={<ArgoExplore />} />
          <Route path="tc" element={<TCExplore />} />
          <Route path="grids" element={<Grids />} />
          <Route path="drifters" element={<Drifters />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);