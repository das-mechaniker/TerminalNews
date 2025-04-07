import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title to match app name
document.title = "Terminal News";

createRoot(document.getElementById("root")!).render(<App />);
