import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSeedData } from "./data/seed";

initializeSeedData();

createRoot(document.getElementById("root")!).render(<App />);
