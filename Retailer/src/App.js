import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";
import RetailerPage from "./pages/RetailerPage";
import RetailerLoginPage from "./pages/RetailerLoginPage";

function App() {

  return (

    <BrowserRouter>

      <div className="container mt-4">

        <Routes>

          <Route
            path="/"
            element={<RetailerLoginPage />}
          />

          <Route
            path="/retailer-login"
            element={<RetailerLoginPage />}
          />

          <Route
            path="/retailer"
            element={<RetailerPage />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;