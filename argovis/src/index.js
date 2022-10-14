import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react'
import Layout from "./pages/layout";
import ArgovisExplore from "./pages/explore"
import Grids from "./pages/grids"
import ArgoExplore from "./pages/argo"
import TCExplore from "./pages/tc"
import DriftersExplore from "./pages/drifters"
import ShipsExplore from "./pages/ships"

export default function App() {
  useEffect(() => {    
     // so the back button works in a relatively reasonable manner
     window.onpopstate = function(event){
      window.location.reload()
     }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ArgovisExplore />} />
          <Route path="argo" element={<ArgoExplore />} />
          <Route path="tc" element={<TCExplore />} />
          <Route path="drifters" element={<DriftersExplore />} />
          <Route path="ships" element={<ShipsExplore />} />
          <Route path="grids" element={<Grids />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);