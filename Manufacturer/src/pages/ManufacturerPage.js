import { useState } from "react";
import { connectContract } from "../utils/contract";
import { QRCodeCanvas } from "qrcode.react";
import {Navigate, useNavigate} from "react-router-dom";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import jsPDF from "jspdf";
import QRCode from "qrcode";

function ManufacturerPage() {

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    batchNumber: "",
    manufacturingDate: "",
    manufacturerName: "",
    npraRegistrationNumber: ""
  });

  const [registeredProduct, setRegisteredProduct] = useState(null);

  const navigate = useNavigate();

  const [qrData, setQrData] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [products, setProducts] =
    useState([]);

  const [showProducts, setShowProducts] =
    useState(false);

  const [showDistributions, setShowDistributions] =
    useState(false);

  const [distributionRecords, setDistributionRecords] =
    useState([]);

  const [retailers, setRetailers] =
    useState([]);

  const [showRetailers, setShowRetailers] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("product");

  const [retailerData, setRetailerData] =
    useState({
      retailerId: "",
      retailerName: "",
      walletAddress: ""
    });

  const [retailerPassword, setRetailerPassword] =
    useState("");

  const [distributionData, setDistributionData] =
    useState({
      productId: "",
      batchNumber: "",
      retailerId: ""
    });

  const [isScanningDistribution, setIsScanningDistribution] =
    useState(false);

  const [distributionScanner, setDistributionScanner] =
    useState(null);

  const [connectedWallet, setConnectedWallet] = useState("");
  const [contractOwner, setContractOwner] = useState("");
  const [walletStatus, setWalletStatus] = useState("Not Connected");
  const [walletConnected, setWalletConnected] = useState(false);

  const handleChange = (e) => {

  const upperCaseFields = [
    "productId",
    "batchNumber",
    "npraRegistrationNumber"
  ];

  setFormData({
    ...formData,
    [e.target.name]:
      upperCaseFields.includes(e.target.name)
        ? e.target.value.toUpperCase()
        : e.target.value
  });

};

  const registerProduct = async () => {

    if (
      !formData.productId ||
      !formData.productName ||
      !formData.batchNumber ||
      !formData.manufacturingDate ||
      !formData.manufacturerName ||
      !formData.npraRegistrationNumber
    ) {

      alert("Please fill in all fields.");

      return;
    }

    const npraRegex =
      /^NOT\d{8}[A-Z]$/;

    if (
      !npraRegex.test(
        formData.npraRegistrationNumber
    )
  ) {
    alert(
      "Invalid NPRA format. Example: NOT26050001K"
    );

    return;
  }

    try {

      const contract =
        await connectContract();

      const tx =
        await contract.registerProduct(
          formData.productId,
          formData.productName,
          formData.batchNumber,
          formData.manufacturingDate,
          formData.manufacturerName,
          formData.npraRegistrationNumber
        );

      await tx.wait();

      setRegisteredProduct({
        productId: formData.productId,
        batchNumber: formData.batchNumber,
        productName: formData.productName,
        manufacturerName: formData.manufacturerName,
        npraRegistrationNumber: formData.npraRegistrationNumber
      });

      const qrContent =
        `https://skincare-blockchain-fyp.vercel.app/verify/${formData.productId}/${formData.batchNumber}`;
      setQrData(qrContent);

      setSuccessMessage(
        "✅ Product successfully registered on blockchain."
      );

      setFormData({
        productId: "",
        productName: "",
        batchNumber: "",
        manufacturingDate: "",
        manufacturerName: "",
        npraRegistrationNumber: ""
      });

    } catch (error) {

      console.error(error);

      setQrData("");

      if (error.reason) {

        alert(error.reason);

      } else {

        alert("Registration Failed");
      }
    }
  };

  const handleRetailerChange = (e) => {

    const upperCaseFields = [
      "retailerId"
    ];

    setRetailerData({
      ...retailerData,
      [e.target.name]:
        upperCaseFields.includes(e.target.name)
          ? e.target.value.toUpperCase()
          : e.target.value
    });

  };

  const handleDistributionChange = (e) => {

    const upperCaseFields = [
      "productId",
      "batchNumber",
      "retailerId"
    ];

    setDistributionData({
      ...distributionData,
      [e.target.name]: 
        upperCaseFields.includes(e.target.name)
        ? e.target.value.toUpperCase()
        : e.target.value
    });

  };

  const addRetailer = async () => {

    if (
      !retailerData.retailerId ||
      !retailerData.retailerName ||
      !retailerData.walletAddress ||
      !retailerPassword
    ) {

      alert("Please fill in all fields.");
      return;
    }

    try {

      const contract =
        await connectContract();

      const tx =
        await contract.addRetailer(
          retailerData.retailerId,
          retailerData.retailerName,
          retailerData.walletAddress
        );

      await tx.wait();

      await axios.post(
        "http://localhost:5000/register-retailer",
        {
          retailerId:
            retailerData.retailerId.toUpperCase(),

            retailerName:
              retailerData.retailerName,

          password:
            retailerPassword
        }
      );

      alert(
        "Retailer successfully added."
      );

      setRetailerData({
        retailerId: "",
        retailerName: "",
        walletAddress: ""
      });

setRetailerPassword("");

    } catch (error) {

      alert(
        error.reason ||
        error.shortMessage ||
        error.message ||
        "Failed to add retailer."
      );
    }

  };

  const assignRetailer = async () => {

    if (
      !distributionData.productId ||
      !distributionData.batchNumber ||
      !distributionData.retailerId
    ) {

      alert(
        "Please scan a product and enter a retailer ID."
      );

      return;
    }

    try {

      const contract =
        await connectContract();

      const tx =
        await contract.assignRetailer(
          distributionData.productId,
          distributionData.batchNumber,
          distributionData.retailerId
        );

      await tx.wait();

      alert(
        "Retailer assigned successfully."
      );

      setDistributionData({
        productId: "",
        batchNumber: "",
        retailerId: ""
      });

    } catch (error) {

      console.error(error);

      alert(
        error.reason ||
        error.shortMessage ||
        "Assignment failed."
      );

    }

  };

  const startDistributionScanner = async () => {
    setIsScanningDistribution(true);
    setTimeout(async () => {
      try {
        const html5QrCode =
          new Html5Qrcode(
            "distribution-reader"
          );
        setDistributionScanner(
          html5QrCode
        );
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250
          },
          async (decodedText) => {

            await html5QrCode.stop();

            setDistributionScanner(null);

            setIsScanningDistribution(false);

            const parts =
              decodedText.split("/");

            const productId =
              parts[
                parts.length - 2
              ];

            const batchNumber =
              parts[
                parts.length - 1
              ];

            setDistributionData({
              ...distributionData,
              productId,
              batchNumber
            });

          }

        );

      } catch (error) {

        console.error(error);

        alert(
          "Camera failed."
        );

      }

    }, 100);

  };

  const stopDistributionScanner =
    async () => {

    if (
      distributionScanner
    ) {

      await distributionScanner.stop();

      setDistributionScanner(
        null
      );

    }

    setIsScanningDistribution(
      false
    );

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

        productList.push(product);
      }

      setProducts(productList);

      setShowProducts(true);

    } catch (error) {

      console.error(error);

      alert(
        error.message
      );
    }
  };

  const loadRetailers = async () => {

    if (showRetailers) {

      setShowRetailers(false);

      return;

    }


    try {

      const contract =
        await connectContract();

      const total =
        await contract.getTotalRetailers();

      const retailerList = [];

      for (
        let i = 0;
        i < Number(total);
        i++
      ) {

        const retailer =
          await contract.getRetailerByIndex(i);

        retailerList.push(retailer);

      }

      setRetailers(retailerList);

      setShowRetailers(true);

    } catch (error) {

      console.error(error);

    }

  };

  const loadDistributionRecords = async () => {

    if (showDistributions) {

      setShowDistributions(false);

      return;

    }

    try {

      const contract =
        await connectContract();

      const total =
        await contract.getTotalProducts();

      const records = [];

      for (
        let i = 0;
        i < Number(total);
        i++
      ) {

        const product =
          await contract.getProductByIndex(i);

        if (
          product[6] &&
          product[6] !== ""
        ) {

          records.push({
            productId: product[0],
            batchNumber: product[2],
            retailerId: product[6]
          });

        }

      }

      setDistributionRecords(
        records
      );

      setShowDistributions(true);

    } catch (error) {

      console.error(error);

    }

  };

  const downloadCertificate = async (product) => {

  try {

    const qrData = `https://skincare-blockchain-fyp.vercel.app/verify/${product[0]}/${product[2]}`;

    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2
    });

    const pdf = new jsPDF("p", "mm", "a4");

    // ===== Border =====
    pdf.setDrawColor(233, 147, 166);
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, 190, 277);

    // ===== Title =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);

    pdf.setTextColor(224, 140, 160);

    pdf.text(
      "BLOCKCHAIN PRODUCT",
      105,
      25,
      { align: "center" }
    );

    pdf.text(
      "REGISTRATION CERTIFICATE",
      105,
      35,
      { align: "center" }
    );

    // Divider
    pdf.setDrawColor(224, 140, 160);

    pdf.line(
      20,
      42,
      190,
      42
    );

    // ===== QR =====
    pdf.addImage(
      qrImage,
      "PNG",
      70,
      48,
      66,
      66
    );

    // ===== Product Information =====

    let y = 123;

    // Section Heading
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(224, 140, 160);

    pdf.text("Product Information", 20, y);

    y += 5;

    // Divider
    pdf.setDrawColor(224, 140, 160);
    pdf.setLineWidth(0.3);
    pdf.line(20, y - 4, 190, y - 4);

    // Reset font
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    // Labels and Values
    y += 9;

    const info = [
      ["Product ID", product[0]],
      ["Product Name", product[1]],
      ["Batch Number", product[2]],
      ["Manufacturing Date", product[3]],
      ["Manufacturer", product[4]],
      ["NPRA Registration Number", product[5]]
    ];

    info.forEach(([label, value]) => {

      pdf.setFont("helvetica", "bold");
      pdf.text(`${label}:`, 20, y);

      pdf.setFont("helvetica", "normal");
      const labelX = 20;
      const colonX = 78;
      const valueX = 85;

      pdf.setFont("helvetica", "bold");
      pdf.text(label, labelX, y);

      pdf.setFont("helvetica", "normal");
      pdf.text(":", colonX, y);

      pdf.text(String(value), valueX, y);

      y += 11;

    });

    // ===== Blockchain Status =====

    y += 5;

    pdf.setFillColor(232, 245, 233);
    pdf.roundedRect(20, y - 5, 170, 12, 3, 3, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(34, 139, 34);

    pdf.text(
      "Successfully Registered on Blockchain",
      25,
      y + 3
    );

    pdf.setTextColor(0, 0, 0);

    // ===== Footer =====

    y += 20;

    pdf.setDrawColor(224, 140, 160);
    pdf.line(20, y, 190, y);

    y += 10;

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);

    pdf.setTextColor(120, 120, 120);

    y += 10;

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);

    pdf.text(
      `Certificate Generated: ${new Date().toLocaleDateString()}`,
      20,
      y
    );

    pdf.text(
      "Blockchain-Based Skincare Product Identification System",
      55,
      y + 5,
      {
        align: "center"
      }
    );
    pdf.save(`${product[0]}-Certificate.pdf`);

  } catch (error) {

    console.error(error);

    alert("Failed to generate PDF.");

  }

};

const manufacturer =
  JSON.parse(
    localStorage.getItem("manufacturer")
  );

  if (!manufacturer) {
    return <Navigate to="/login" />;
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const wallet = accounts[0];

      setConnectedWallet(wallet);
      setWalletConnected(true);

      const contract = await connectContract();

      const owner = await contract.manufacturer();

      setContractOwner(owner);

      if (wallet.toLowerCase() === owner.toLowerCase()) {
        setWalletStatus("Authorized");
      } else {
        setWalletStatus("Unauthorized");
      }

    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet.");
    }
  };

  return (

    <div className="container">

      <div
        className="card shadow-lg p-4 mx-auto"
        style={{
          maxWidth: "900px"
        }}
      >
    <div 
        
        className="d-flex justify-content-end mb-4">

      <button
        className="btn btn-outline-danger"
        onClick={() => {

          localStorage.removeItem("manufacturer");

          navigate("/login", { replace: true });

        }}
      >
        Logout
      </button>

    </div>

        <h2
          
          className="text-center mb-4"
          style={{
            color: "#E08CA0"
          }}
        >
          
          Manufacturer Dashboard

        </h2>

        <div className="card shadow-sm mb-4">
          <div className="card-body">

            <h4 className="mb-4">Manufacturer Information</h4>

            <p>
              <strong>Connected Wallet:</strong><br />
              {walletConnected
                ? `${connectedWallet.substring(0, 6)}...${connectedWallet.substring(connectedWallet.length - 4)}`
                : "Not Connected"}
            </p>

            <p>
              <strong>Contract Owner:</strong><br />
              {contractOwner
                ? `${contractOwner.substring(0, 6)}...${contractOwner.substring(contractOwner.length - 4)}`
                : "-"}
            </p>

            <p>
              <strong>Wallet Status:</strong>{" "}
              <span
                className={`badge ${
                  walletStatus === "Authorized"
                    ? "bg-success"
                    : walletStatus === "Unauthorized"
                    ? "bg-danger"
                    : "bg-secondary"
                }`}
              >
                {walletStatus}
              </span>
            </p>

            <button
              className="btn btn-primary"
              onClick={connectWallet}
            >
              Connect MetaMask Wallet
            </button>

          </div>
        </div>

        <div className="d-flex justify-content-center gap-3 mb-4">

          <button
            className={
              activeSection === "product"
                ? "btn btn-primary"
                : "btn btn-outline-primary"
            }
            onClick={() =>
              setActiveSection("product")
            }
          >
            Product Registration
          </button>

          <button
            className={
              activeSection === "retailer"
                ? "btn btn-primary"
                : "btn btn-outline-primary"
            }
            onClick={() =>
              setActiveSection("retailer")
            }
          >
            Retailer Registration
          </button>

          <button
            className={
              activeSection === "distribution"
                ? "btn btn-primary"
                : "btn btn-outline-primary"
            }
            onClick={() =>
              setActiveSection("distribution")
            }
          >
           Product Distribution 
          </button>

        </div>
        {activeSection === "product" && (

        <p
          className="text-center text-muted mb-4"
        >
          Register skincare products and generate blockchain verification QR codes.
        </p>

        )}

        {activeSection === "product" && (

          <>  

        <div className="mb-3">

          <label className="form-label">
            Product ID
          </label>

          <input
            className="form-control"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
        />

        </div>

        <div className="mb-3">

          <label className="form-label">
            Product Name
          </label>

          <input
            className="form-control"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
          />

        </div>

        <div className="mb-3">

          <label className="form-label">
            Batch Number
          </label>

          <input
            className="form-control"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
        />

        </div>

        <div className="mb-3">

          <label className="form-label">
            Manufacturing Date
          </label>

          <input
            className="form-control"
            type="date"
            name="manufacturingDate"
            value={formData.manufacturingDate}
            onChange={handleChange}
          />

        </div>

        <div className="mb-3">

          <label className="form-label">
            Manufacturer Name
          </label>

          <input
            className="form-control"
            name="manufacturerName"
            value={formData.manufacturerName}
            onChange={handleChange}
          />

        </div>

        <div className="mb-4">

          <label className="form-label">
            NPRA Registration Number
          </label>

          <input
            className="form-control"
            name="npraRegistrationNumber"
            value={formData.npraRegistrationNumber}
            onChange={handleChange}
        />

          <small className="text-muted">
            Format Example: NOT20241234K
          </small>

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={registerProduct}
        >
          Register Product
        </button>

        {successMessage && (

          <div
            className="alert alert-success mt-3"
          >
            {successMessage}
          </div>

        )}

        {activeSection === "product" && qrData && (

        <div
          className="card shadow-lg mt-4 p-4 mx-auto text-center"
          style={{
            maxWidth: "700px"
          }}
        >
          <h3
            style={{
              color: "#E08CA0"
            }}
          >
            Generated Product QR Code
          </h3>

          <div className="my-3">

            <QRCodeCanvas
              value={qrData}
              size={250}
            />

          </div>

          <p>
            <strong>Product ID:</strong>{" "}
            {registeredProduct?.productId}
          </p>

          <p>
            <strong>Batch Number:</strong>{" "}
            {registeredProduct?.batchNumber}
          </p>

          <p>
            <strong>NPRA Registration:</strong>{" "}
            {registeredProduct?.npraRegistrationNumber}
          </p>

        </div>

      )}

        <button
          className="btn btn-secondary w-100 mt-2"
          onClick={loadProducts}
        >
          {showProducts
            ? "Hide Registered Products"
            : "View Registered Products"}
        </button>

        {activeSection === "product" && 
      showProducts && 
      products.length > 0 && (

        <div
          className="card shadow-lg mt-4 p-4"
        >

          <h3
            className="mb-4"
            style={{
              color: "#E08CA0"
            }}
          >
            Registered Products
          </h3>

          <table
            className="table table-striped"
          >

            <thead>

              <tr>

                <th>QR Code</th>
                <th>ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>NPRA</th>
                <th>Manufacturer Name</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {products.map(
                (product, index) => (

                  <tr key={index}>

                    <td>

                    <QRCodeCanvas
                      id={`qr-${index}`}
                      value={`https://skincare-blockchain-fyp.vercel.app/verify/${product[0]}/${product[2]}`}
                      size={70}
                    />

                    </td>

                    <td>{product[0]}</td>

                    <td>{product[1]}</td>

                    <td>{product[2]}</td>

                    <td>{product[5]}</td>

                    <td>{product[4]}</td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          downloadCertificate(product)
                        }
                      >
                        Download
                      </button>
                    </td>

                    <td></td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

        </>
      )}

      {activeSection === "retailer" && (

  <div>

    <h4 className="mb-4">
      Retailer Management
    </h4>

    <div className="mb-3">

      <label className="form-label">
        Retailer ID
      </label>

      <input
        className="form-control"
        name="retailerId"
        value={retailerData.retailerId}
        onChange={handleRetailerChange}
      />

    </div>

    <div className="mb-3">

      <label className="form-label">
        Retailer Name
      </label>

      <input
        className="form-control"
        name="retailerName"
        value={retailerData.retailerName}
        onChange={handleRetailerChange}
      />

    </div>

    <div className="mb-3">

      <label className="form-label">
        Wallet Address
      </label>

      <input
        className="form-control"
        name="walletAddress"
        value={retailerData.walletAddress}
        onChange={handleRetailerChange}
        placeholder="0x..."
      />

    </div>

    <div className="mb-3">

      <label className="form-label">
        Password
      </label>

      <input
        type="password"
        className="form-control"
        value={retailerPassword}
        onChange={(e) =>
          setRetailerPassword(
            e.target.value
          )
        }
      />

    </div>

    <button
      className="btn btn-primary w-100"
      onClick={addRetailer}
    >
      Add Retailer
    </button>

    <button
      className="btn btn-secondary w-100 mt-2"
      onClick={loadRetailers}
>
  {showRetailers
    ? "Hide Retailers"
    : "View Retailers"}
</button>

  </div>

)}

{activeSection === "retailer" &&
 showRetailers &&
 retailers.length > 0 && (

  <div
    className="card shadow-lg mt-4 p-4"
  >

    <h4>
      Registered Retailers
    </h4>

    <table
      className="table table-striped"
    >

      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
           <th>Wallet Address</th>
        </tr>
      </thead>

      <tbody>

        {retailers.map(
          (retailer, index) => (

            <tr key={index}>
              <td>{retailer[0]}</td>
              <td>{retailer[1]}</td>
              <td>{retailer[2]}</td>
            </tr>

          )
        )}

      </tbody>

    </table>

  </div>

)}


{activeSection === "distribution" && (

  <div>

    <h4 className="mb-4">
      Product Distribution 
    </h4>

    <button
      className="btn btn-success w-100 mb-3"
      onClick={
        isScanningDistribution
          ? stopDistributionScanner
          : startDistributionScanner
      }
    >
      {isScanningDistribution
        ? "Stop Scanner"
        : "Scan Product QR"}
    </button>
    
    {isScanningDistribution && (

      <div className="alert alert-info text-center">

          📷 Camera is scanning QR code...

      </div>

      )}

    {isScanningDistribution && (

      <div
        id="distribution-reader"
        className="mx-auto mt-3 mb-3"
      ></div>

    )}

    <div className="mb-3">

      <label className="form-label">
        Product ID
      </label>

      <input
        className="form-control"
        name="productId"
        readOnly
        value={distributionData.productId}
        onChange={handleDistributionChange}
      />

    </div>

    <div className="mb-3">

      <label className="form-label">
        Batch Number
      </label>

      <input
        className="form-control"
        name="batchNumber"
        readOnly
        value={distributionData.batchNumber}
        onChange={handleDistributionChange}
      />

    </div>

    <div className="mb-3">

      <label className="form-label">
        Retailer ID
      </label>

      <input
        className="form-control"
        name="retailerId"
        value={distributionData.retailerId}
        onChange={handleDistributionChange}
      />

    </div>

    <button
      className="btn btn-primary w-100"
      onClick={assignRetailer}
    >
      Assign Retailer
    </button>

    <button
      className="btn btn-secondary w-100 mt-2"
      onClick={loadDistributionRecords}
    >
      {showDistributions
        ? "Hide Distribution Records"
        : "View Distribution Records"}
    </button>

    {showDistributions &&
      distributionRecords.length > 0 && (

        <div
          className="card shadow-lg mt-4 p-4"
        >

          <h4
            className="mb-4"
            style={{
              color: "#E08CA0"
            }}
          >
            Distribution Records
          </h4>

          <table
            className="table table-striped"
          >

            <thead>

              <tr>

                <th>Product ID</th>
                <th>Batch Number</th>
                <th>Retailer ID</th>

              </tr>

            </thead>

            <tbody>

              {distributionRecords.map(
                (record, index) => (

                  <tr key={index}>

                    <td>
                      {record.productId}
                    </td>

                    <td>
                      {record.batchNumber}
                    </td>

                    <td>
                      {record.retailerId}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

  </div>

)}

      </div>

    </div>

  );
}

export default ManufacturerPage;