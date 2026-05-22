import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { UsuarioProvider } from './context/usuario.context.jsx'


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <UsuarioProvider>
      <App />
    </UsuarioProvider>
  </BrowserRouter>
);