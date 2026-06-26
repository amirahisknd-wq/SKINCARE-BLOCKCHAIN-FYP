import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ManufacturerPage from "./pages/ManufacturerPage";
import "./App.css";

function App() {

  return (

    <BrowserRouter>

      <div className="container mt-4">

        <Routes>

          <Route
            path="/"
            element={<LoginPage />}
        />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/manufacturer"
            element={<ManufacturerPage />}
          />

        </Routes>

      </div>

    </BrowserRouter>

  );
}

export default App;