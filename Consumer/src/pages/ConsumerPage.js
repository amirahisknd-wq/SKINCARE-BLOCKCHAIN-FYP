import axios from "axios";
import { useState } from "react";
import { connectReadOnlyContract } from "../utils/contract";
import { Html5Qrcode } from "html5-qrcode";
import { useParams} from "react-router-dom";
import { useEffect } from "react";

function ConsumerPage() {

  const [verificationResult, setVerificationResult] =
    useState("");

  const [productInfo, setProductInfo] =
    useState(null);

  const [isScanning, setIsScanning] =
    useState(false);

  const [scanner, setScanner] =
    useState(null);

  const [reportReason, setReportReason] =
    useState("");

  const [showReport, setShowReport] =
    useState(false);
  
  const [scannedProductId, setScannedProductId] =
    useState("");

  const [scannedBatchNumber, setScannedBatchNumber] =
    useState("");

  const { 
    productId: urlProductId,
    batchNumber: urlBatchNumber
  } = useParams();

  const startScanner = async () => {

      setVerificationResult("");
      setProductInfo(null);

      setIsScanning(true);

      setTimeout(async () => {

        try {

          const html5QrCode =
            new Html5Qrcode("reader");

          setScanner(html5QrCode);

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: 250
            },

          async (decodedText) => {

          try {

            await html5QrCode.stop();

            setScanner(null);
            setIsScanning(false);

            let productId;
            let batchNumber;

            if (
              decodedText.includes("/verify/")
            ) {

            const parts = decodedText.split("/");

            productId = parts[parts.length - 2];

            batchNumber = parts[parts.length - 1];

            } else {

              [
                productId,
                batchNumber
              ] = decodedText.split("|");
            }

            setScannedProductId(productId);
            setScannedBatchNumber(batchNumber);

            const contract =
              await connectReadOnlyContract();

            const verified =
              await contract.verifyProduct(
                productId,
                batchNumber
              );

            if (verified) {

              const product =
                await contract.getProduct(
                  productId,
                  batchNumber
            );

            console.log(product);

          setProductInfo(product);

          setVerificationResult(
            "GENUINE PRODUCT"
          );

          } else {

          setVerificationResult(
            "PRODUCT NOT VERIFIED"
        );

          setProductInfo(null);
        }

          } catch (error) {

            console.error( error);

            setVerificationResult(
              "VERIFICATION FAILED"
            );
          }
        },

        (errorMessage) => {}
        );

      } catch (error) {

        console.error(error);

        setVerificationResult(
          "CAMERA ACCESS FAILED"
        );
      }

    }, 100);
  };

    const reportProduct = async () => {

      console.log("reportProduct called");

      if (
        !scannedProductId ||
        !scannedBatchNumber
      ) {

        alert(
          "Please scan a product first."
        );

        return;
      }

      if (!reportReason.trim()) {

        alert(
          "Please enter the reason for your report."
        );

        return;
      }

      try {

    const response =
      await axios.post(
        `${process.env.REACT_APP_API_URL}/report-product`,
        {
          productId:
            scannedProductId,

          batchNumber:
            scannedBatchNumber,

          reason:
            reportReason
        }
      );

    if (
      response.data.success
    ) {

      alert(
        "Report Submitted Successfully"
      );

      setReportReason("");
    }

  } catch (error) {

    console.error(error);

    alert(
      "Failed To Submit Report"
    );
  }
};

  const stopScanner = async () => {

  try {

    if (scanner) {

      await scanner.stop();

      setIsScanning(false);

      setScanner(null);
    }

  } catch (error) {

    console.error(error);
  }
};

useEffect(() => {

  const verifyFromUrl = async () => {

    if (
      !urlProductId ||
      !urlBatchNumber
    ) {
      return;
    }

    try {

      const contract =
        await connectReadOnlyContract();

      const productId =
        decodeURIComponent(urlProductId)
          .trim()
          .toUpperCase();

      const batchNumber =
        decodeURIComponent(urlBatchNumber)
          .trim()
          .toUpperCase();

      const verified =
        await contract.verifyProduct(
          productId,
          batchNumber
        );

      if (verified) {

        const product =
          await contract.getProduct(
            productId,
            batchNumber
          );

          console.log(product);

        setProductInfo(product);

        setScannedProductId(urlProductId);
        setScannedBatchNumber(urlBatchNumber);

        setVerificationResult(
          "GENUINE PRODUCT"
        );

      } else {

        setVerificationResult(
          "PRODUCT NOT VERIFIED"
        );

        setProductInfo(null);
      }

    } catch (error) {

      console.error(error);

      setVerificationResult(
        "VERIFICATION FAILED"
      );
    }
  };

  verifyFromUrl();

}, [
  urlProductId,
  urlBatchNumber
]);

return (

  <div className="container">

    <div
      className="card shadow-lg p-4 mx-auto"
      style={{
        maxWidth: "700px"
      }}
    >
    
    <div 
      className="d-flex justify-content-end mb-4 ">

</div>
      <h2
        className="text-center mb-4"
        style={{
          color: "#E08CA0"
        }}
      >
        Consumer Verification
      </h2>

      <p className="text-center text-muted">
        Scan the product QR code to verify its authenticity.
      </p>

      <div className="d-grid gap-2 mb-4">

  {!isScanning ? (

    <button
      className="btn btn-primary"
      onClick={startScanner}
    >
      Scan Product QR Code
    </button>
  ) : (

    <button
      className="btn btn-danger"
      onClick={stopScanner}
    >
      Stop Scanner
    </button>

  )}

  {isScanning && (

        <div className="alert alert-info text-center">

          📷 Camera is scanning QR code...

        </div>

      )}

  {isScanning && (

    <div
      id="reader"
      className="mx-auto mt-3"
    ></div>

  )}

    </div>

    {verificationResult && (

      <div
        className={`mt-3 ${
          verificationResult.includes("GENUINE")
            ? "alert alert-success"
            : "alert alert-danger"
        }`}
      >

        <h4 className="mb-2">
          {verificationResult}
        </h4>

        {
          verificationResult ===
          "GENUINE PRODUCT" && (

            <small>
              Product record successfully verified on blockchain.
            </small>

          )
        }
    
      </div>

    )}

    {productInfo && (

      <div
        className="card shadow-lg mt-2 p-4"
      >

        <h3
          className="mb-4"
          style={{
            color: "#E08CA0"
          }}
        >
          Verified Product Information
        </h3>

        <div className="row">

          <div className="col-md-6">

            <p>
              <strong>Product ID</strong>
              <br />
              {productInfo[0]}
            </p>

            <p>
              <strong>Product Name</strong>
              <br />
              {productInfo[1]}
            </p>

            <p>
              <strong>Batch Number</strong>
              <br />
              {productInfo[2]}
            </p>

          </div>

          <div className="col-md-6">

            <p>
              <strong>Manufacturing Date</strong>
              <br />
              {productInfo[3]}
            </p>

            <p>
              <strong>Manufacturer</strong>
              <br />
              {productInfo[4]}
            </p>

            <p>
              <strong>NPRA Registration Number</strong>
              <br />
              {productInfo[5]}
            </p>

            <p>
              <strong>Product Status</strong>
              <br />
              {
                productInfo[7]
                  ? "Purchased by Consumer"
                  : "Available for Purchase"
              }
            </p>

            <p>
              <strong>Blockchain Traceability</strong>
              <br />
              {
                productInfo[7]
                  ? "Ownership Registered"
                  : "Ownership Not Yet Registered"
              }
            </p>

          </div>

        </div>

      </div>

    )}

    <button
        className="btn btn-secondary mt-2"
        onClick={() =>
          setShowReport(
            !showReport
          )
        }
      >
        {showReport
          ? "Hide Report Form"
          : "Report Form"}
      </button>

      {showReport && (

      <div
        className="card shadow-lg mt-4 p-4"
      >

        <h3
          className="mb-4"
          style={{
            color: "#E08CA0"
          }}
        >
          Report Suspicious Product
        </h3>

        <div className="mb-3">

          <label>
            Product ID
          </label>

          <input
            className="form-control"
            value={scannedProductId}
            readOnly
          />

        </div>

        <div className="mb-3">

          <label>
            Batch Number
          </label>

          <input
            className="form-control"
            value={scannedBatchNumber}
            readOnly
          />

        </div>

        <textarea
          className="form-control mb-3"
          rows="4"
          placeholder="Describe why you suspect this product is counterfeit..."
          value={reportReason}
          onChange={(e) =>
            setReportReason(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-danger w-100"
          onClick={reportProduct}
        >
          Submit Report
        </button>

      </div>

    )}

    </div>

  </div>

);

}
export default ConsumerPage;