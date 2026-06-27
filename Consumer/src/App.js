import {BrowserRouter, Routes, Route} from "react-router-dom";

import "./App.css";
import ConsumerPage from "./pages/ConsumerPage";


function App() {

  return (

    <BrowserRouter>

      <div className="container mt-4">

        <Routes>

          <Route
          path="/"
          element={<ConsumerPage />}
          />

          <Route
            path="/verify"
            element={<ConsumerPage />}
          />

          <Route
            path="/verify/:productId/:batchNumber"
            element={<ConsumerPage />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;