import { useState } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";

function RetailerLoginPage() {

  const [retailerId, setRetailerId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {

    try {

      const response =
        await axios.post(
          "http://localhost:5000/retailer-login",
          {
            retailerId,
            password
          }
        );

      if (
        response.data.success
      ) {

        localStorage.setItem(
          "retailer",
          JSON.stringify(
            response.data.retailer
          )
        );

        navigate("/retailer");

      } else {

        alert(
          "Invalid Username or Password"
        );

      }

    } catch (error) {

      console.error(error);

      alert(
        "Login Failed"
      );

    }

  };

  return (
<>
    <header
        style={{
            width: "100%",
            height: "70px",
            background: "linear-gradient(90deg, #E8A5B8 0%, #E5A0B4 100%)",
            display: "flex",
            alignItems: "center",
            padding: "0 35px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000
        }}
    >
        <span
            style={{
                color: "#FFFFFF",
                fontSize: "18px",
                fontWeight: "500",
                letterSpacing: "1px",
                fontFamily: "Poppins, sans-serif"
            }}
        >
            COUNTERFEIT SKINCARE IDENTIFICATION SYSTEM
        </span>

    </header>

    <div
        className="d-flex justify-content-center align-items-center"
        style={{
            minHeight: "calc(100vh - 75px)"
        }}
    >

        <div
            className="card shadow-lg p-5"
            style={{
                width: "430px",
                borderRadius: "20px",
                border: "none"
            }}
        >

            <div className="text-center mb-4">

                <h2
                    style={{
                        color: "#E08CA0",
                        fontWeight: "500"
                    }}
                >
                    Retailer Login
                </h2>

                <p className="text-muted mb-0">
                    Sign in to access the retailer dashboard.
                </p>

            </div>

            <div className="mb-3">

                <label className="form-label fw-semibold">
                    Retailer ID
                </label>

                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your retailer ID"
                    value={retailerId}
                    onChange={(e) =>
                        setRetailerId(
                            e.target.value.toUpperCase()
                        )
                    }
                />

            </div>

            <div className="mb-4">

                <label className="form-label fw-semibold">
                    Password
                </label>

                <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                        setPassword(
                            e.target.value
                        )
                    }
                />

            </div>

            <button
                className="btn btn-primary w-100"
                onClick={handleLogin}
            >
                Login
            </button>

        </div>

    </div>

</>
);

}

export default RetailerLoginPage;