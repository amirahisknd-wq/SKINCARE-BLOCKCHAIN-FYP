import { useState, useEffect } from "react";
import { connectContract } from "../utils/contract";
import { Navigate, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

function RetailerPage() {

const shortenWallet = (wallet) => {

    if (
        typeof wallet !== "string" ||
        !wallet
    ) {
        return "Not Available";
    }

    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

};

const [consumerData, setConsumerData] = useState({
      productId: "",
      batchNumber: "",
      consumerCode: ""
    });

const [productInfo, setProductInfo] = useState(null);

const navigate = useNavigate();

const handleLogout = () => {

    if (scanner) { scanner.stop();
    }

    localStorage.removeItem("retailer");

    setProductInfo(null);

    navigate("/retailer-login", {
        replace: true
    });

};

const [assignedProducts, setAssignedProducts] =
        useState([]);

const [showProducts, setShowProducts] =
    useState(false);

const [isScanning, setIsScanning] =
    useState(false);

const [scanner, setScanner] =
    useState(null);

const [connectedWallet, setConnectedWallet] =
    useState("");

const [walletStatus, setWalletStatus] =
    useState("Checking...");

const [registeredWallet, setRegisteredWallet] =
    useState("");

  const handleChange = (e) => {

    const upperCaseFields = [
        "consumerCode"
    ];

    setConsumerData({
      ...consumerData,
      [e.target.name]: 
      upperCaseFields.includes(e.target.name)
        ? e.target.value.toUpperCase()
        : e.target.value
    });

  };
  const assignConsumer = async () => {

    if (
      !consumerData.productId ||
      !consumerData.batchNumber ||
      !consumerData.consumerCode
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {

      const contract =
        await connectContract();

      const tx =
        await contract.assignConsumer(
          consumerData.productId,
          consumerData.batchNumber,
          consumerData.consumerCode
        );

      await tx.wait();

      alert(
        "Consumer assigned successfully."
        );

      setConsumerData({
        productId: "",
        batchNumber: "",
        consumerCode: ""
      });

      setProductInfo(null);

    } catch (error) {

      console.error(error);

      alert(
        error.reason ||
        error.shortMessage ||
        "Assignment failed."
      );

    }

  };

  const startScanner = async () => {

    setIsScanning(true);

    setTimeout(async () => {

        try {

            const html5QrCode = new Html5Qrcode("retailer-reader");

            setScanner(html5QrCode);

            await html5QrCode.start(

                { facingMode: "environment" },

                {
                    fps: 10,
                    qrbox: 250
                },

                async (decodedText) => {

                    await html5QrCode.stop();

                    setScanner(null);
                    setIsScanning(false);

                    let productId;
                    let batchNumber;

                    if (decodedText.includes("/")) {

                        const parts = decodedText.split("/");

                        productId = parts[parts.length - 2];
                        batchNumber = parts[parts.length - 1];

                    } else {

                        [productId, batchNumber] =
                            decodedText.split("|");

                    }

                    setConsumerData({
                        productId,
                        batchNumber,
                        consumerCode: consumerData.consumerCode
                    });

                    const contract = await connectContract();

                    const product = await contract.getProduct(
                            productId,
                            batchNumber
                        );

                console.log(product);

                    setProductInfo(product);

                },

                () => {
                    // Ignore scan failures while scanning
                }

            );

        } catch (error) {

            console.error("Scanner Error:", error);

            alert(error.message);

            setIsScanning(false);

        }

    }, 100);

};

const stopScanner = async () => {

    if (scanner) {

        await scanner.stop();

        setScanner(null);

    }

    setIsScanning(false);

};

  const loadProducts = async () => {

    if (showProducts) {

        setShowProducts(false);

        return;

    }

    try {

        const contract =
        await connectContract();

        const total =
        await contract.getTotalProducts();

        const productList = [];

        for (
        let i = 0;
        i < Number(total);
        i++
        ) {

        const product =
            await contract.getProductByIndex(i);

        if (
            product[6] === retailer.retailer_id
        ) {

            productList.push(product);

        }

        }

        setAssignedProducts(
        productList
        );

        setShowProducts(true);

    } catch (error) {

        console.error(error);

    }

    };

    const retailer =
        JSON.parse(
            localStorage.getItem("retailer")
        );

  useEffect(() => {

    const loadWallet = async () => {

        try {

            const contract =
                await connectContract();

            const signer =
                contract.runner;

            const address =
                await signer.getAddress();

            setConnectedWallet(address);

            const total =
                await contract.getTotalRetailers();

            for (
                let i = 0;
                i < Number(total);
                i++
            ) {
                const data =
                    await contract.getRetailerByIndex(i);
                if (
                    data[0] === retailer.retailer_id
                ) {
                    setRegisteredWallet(
                        data[2]
                    );
                    if (
                        typeof data[2] === "string" &&
                        data[2].toLowerCase() ===
                        address.toLowerCase()
                    ) {
                        setWalletStatus(
                            "Authorized"
                        );
                    } else {
                        setWalletStatus(
                            "Unauthorized"
                        );
                    }
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    };
    loadWallet();
}, [retailer?.retailer_id]);
    if (!retailer) {
            return (
                <Navigate
                to="/retailer-login"
                />
            );
    }
    return (
    <div className="container">
        <div
            className="card shadow-lg p-4 mx-auto"
            style={{
            maxWidth: "700px"
            }}
        >
        <div className="d-flex justify-content-end mb-4">
            <button
                className="btn btn-outline-danger"
                onClick={handleLogout}
            >
                Logout
            </button>
            </div>
            <h2
                className="text-center mb-2"
                style={{
                    color: "#E08CA0"
                }}
                >
                Retailer Dashboard
                </h2>

                <p
                className="text-center text-muted mb-4"
                >
                Assign product ownership to consumers.
                </p>

                <div className="card mb-4">
                    <div className="card-body">

                        <h5 className="card-title">
                            Retailer Information
                        </h5>

                        <p className="mb-2">
                            <strong>Retailer ID:</strong>{" "}
                            {retailer.retailer_id}
                        </p>

                        <p className="mb-2">
                            <strong>Retailer Name:</strong>{" "}
                            {retailer.retailer_name}
                        </p>

                        <div className="mb-2">
                            <strong>Connected Wallet:</strong><br/>
                            <small>
                                {shortenWallet(connectedWallet)}
                            </small>
                        </div>
                            
                        <div className="mb-2">
                                <strong>Registered Wallet:</strong><br/>
                                <small>
                                    {shortenWallet(registeredWallet)}
                                </small>
                            </div>

                            <div className="mb-2">
                                <strong>Wallet Status:</strong>{" "}

                                {walletStatus === "Authorized" ? (
                                     <span className="badge bg-success">
                                        Authorized
                                    </span>
                                ) : walletStatus === "Unauthorized" ? (
                                    <span className="badge bg-danger">
                                        Unauthorized
                                    </span>
                                ) : (
                                    <span className="badge bg-secondary">
                                        Checking...
                                    </span>
                                )}

                            </div>

                    </div>

                </div>

            <button
                className="btn btn-success w-100 mb-3"
                onClick={
                    isScanning
                    ? stopScanner
                    : startScanner
                }
            >
                {isScanning
                    ? "Stop Scanner"
                    : "Scan Product QR"}
            </button>

            {isScanning && (

                <div className="alert alert-info text-center">

                    📷 Camera is scanning QR code...

                </div>

                )}

            {isScanning && (

            <div
                id="retailer-reader"
                className="mx-auto mt-3 mb-3"
            ></div>

            )}

        <div className="mb-3">

          <label>
            Product ID
          </label>

          <input
            className="form-control"
            name="productId"
            readOnly
            value={consumerData.productId}
            />

        </div>

        <div className="mb-3">

          <label>
            Batch Number
          </label>

          <input
            className="form-control"
            name="batchNumber"
            readOnly
            value={consumerData.batchNumber}
            />

        </div>

        {productInfo && (

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <h5
                        className="card-title"
                        style={{ color: "#E08CA0" }}
                    >
                        Product Information
                    </h5>

                    <div className="row">

                        <div className="col-md-6">

                            <p className="mb-3">
                                <strong>Product ID</strong><br />
                                {productInfo[0]}
                            </p>

                            <p className="mb-3">
                                <strong>Product Name</strong><br />
                                {productInfo[1]}
                            </p>

                        </div>

                        <div className="col-md-6">

                            <p className="mb-3">
                                <strong>Batch Number</strong><br />
                                {productInfo[2]}
                            </p>

                            <p className="mb-3">
                                <strong>Manufacturer</strong><br />
                                {productInfo[4]}
                            </p>

                        </div>

                    </div>

                </div>

            </div>

            )}

        <div className="mb-3">

          <label>
            Consumer Code
          </label>

          <input
            className="form-control"
            name="consumerCode"
            value={consumerData.consumerCode}
            onChange={handleChange}
          />

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={assignConsumer}
          disabled={
            walletStatus !== "Authorized" ||
            !consumerData.productId ||
            !consumerData.batchNumber
            }
        >
          Assign Consumer
        </button>

        <button
            className="btn btn-secondary w-100 mt-2"
            onClick={loadProducts}
            >
            {showProducts
            ? "Hide Assigned Products"
            : "View Assigned Products"}
            </button>

      {showProducts && 
        assignedProducts.length > 0 && (

        <div
            className="card shadow-lg mt-4 p-4"
        >

            <h3
                className="mb-4"
                style={{
                    color: "#E08CA0"
                }}
                >
                Assigned Products
                </h3>

            <table
            className="table table-striped"
            >

            <thead>

                <tr>

                <th>Product ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Consumer</th>

                </tr>

            </thead>

            <tbody>

                {assignedProducts.map(
                (product, index) => (

                    <tr key={index}>

                    <td>{product[0]}</td>

                    <td>{product[1]}</td>

                    <td>{product[2]}</td>

                    <td>{product[7]}</td>

                    </tr>

                )
                )}

            </tbody>

        </table>

    </div>

        )}

        </div>

    </div>

  );

}

export default RetailerPage;