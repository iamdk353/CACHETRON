import { createRoot } from "react-dom/client";
import "./index.css";

import { Home } from "./components/Home";
createRoot(document.getElementById("root")!).render(
  <div>
    <Home />
  </div>
);
