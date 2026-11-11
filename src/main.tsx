import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Ponto de entrada: monta o componente App dentro do <div id="root"> do index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
