import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import { AdminProvider } from "./context/AdminContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AdminProvider>
  </React.StrictMode>,
);
