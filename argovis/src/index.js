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
import ArgoPlots from "./pages/argoPlots"
import TCPlots from "./pages/tcPlots"
import DrifterPlots from "./pages/drifterPlots"

export default function App() {
  useEffect(() => {    
    // refresh iff query string changed onpopstate, so the back button works in a relatively reasonable manner
    window.onpopstate = function(event){
      if(window.argoPrevious !== window.location.search){
        window.argoPrevious = window.location.search
        window.location.reload() 
      }
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
          <Route path="plots/argo" element={<ArgoPlots />} />
          <Route path="plots/tc" element={<TCPlots />} />
          <Route path="plots/drifters" element={<DrifterPlots />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);