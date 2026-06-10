import axios from "axios";
import { useState } from "react";
import { connectReadOnlyContract } from "../utils/contract";
import { Html5Qrcode } from "html5-qrcode";
import { Link, useParams} from "react-router-dom";
import { useEffect } from "react";

function ConsumerPage() {

  
  const [verificationResult, setVerificationResult] =
    useState("");

  const [productInfo, setProductInfo] =
    useState(null);
  
  const [verificationCount, setVerificationCount] =
    useState(0);

  const [isScanning, setIsScanning] =
    useState(false);

  const [scanner, setScanner] =
    useState(null);

  const [reportReason, setReportReason] =
    useState("");
  
  const [scannedProductId, setScannedProductId] =
    useState("");

  const [scannedBatchNumber, setScannedBatchNumber] =
    useState("");

  const { 
    productId: urlProductId,
    batchNumber: urlBatchNumber
  } = useParams();

  const startScanner = async () => {

    try {

      setVerificationResult("");
      setProductInfo(null);

      const html5QrCode =
        new Html5Qrcode("reader");
      setScanner(html5QrCode);

      setIsScanning(true);

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

            const parts =
              decodedText.split("/");

            productId =
              parts[parts.length - 2];

            batchNumber =
              parts[parts.length - 1];

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

              await axios.post(
                "http://localhost:5000/log-verification",
                {
                  productId,
                  batchNumber
                }
              );

              const countResponse =
                await axios.get(
                  `http://localhost:5000/verification-count/${productId}/${batchNumber}`
                );

              setVerificationCount(
                countResponse.data.count
              );

              const product =
                await contract.getProduct(
                  productId,
                  batchNumber
            );

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

            console.error(
              "Verification Error:",
              error
          );

            alert(
              error.message
            );

            setVerificationResult(
              "VERIFICATION FAILED"
            );
          }
        },

        (errorMessage) => {
          // ignore scan errors
        }
      );

    } catch (error) {

      console.error(error);

      setVerificationResult(
        "CAMERA ACCESS FAILED"
      );
    }
};

const reportProduct = async () => {

  try {

    const response =
      await axios.post(
        "http://localhost:5000/report-product",
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

      const verified =
        await contract.verifyProduct(
          urlProductId,
          urlBatchNumber
        );

      if (verified) {

        const product =
          await contract.getProduct(
            urlProductId,
            urlBatchNumber
          );

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

    <Link
      to="/"
      className="btn btn-outline-secondary"
    >
      Back to Home
    </Link>

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

</div>

      {isScanning && (

        <div className="alert alert-info text-center">

          📷 Camera is scanning QR code...

        </div>

      )}

      <div
        id="reader"
        className="mx-auto"
      ></div>

    </div>

    {verificationResult && (

      <div
        className={`mt-4 mx-auto ${
          verificationResult.includes("GENUINE")
            ? "alert alert-success"
            : "alert alert-danger"
        }`}
        style={{
          maxWidth: "700px"
        }}
      >

        <h4 className="mb-0">
          {verificationResult}
        </h4>
    
    {
      verificationResult.includes(
        "NOT VERIFIED"
      ) && (

    <div
      className="card p-3 mt-3"
    >

    <h5>
      Report Suspicious Product
    </h5>

  <textarea
    className="form-control mb-3"
    placeholder="Describe why you suspect this product is counterfeit..."
    value={reportReason}
    onChange={(e) =>
      setReportReason(
        e.target.value
      )
    }
  />

  <button
    className="btn btn-danger"
    onClick={reportProduct}
  >
    Submit Report
  </button>

</div>

)}

      </div>

    )}

    {productInfo && (

      <div
        className="card shadow-lg mt-4 p-4 mx-auto"
        style={{
          maxWidth: "700px"
        }}
      >

        <h3
          className="mb-4"
          style={{
            color: "#E08CA0"
          }}
        >
          Product Information
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
              <strong>
                QR Verification Count
              </strong>
              <br />
              {verificationCount}
            </p>

          </div>

        </div>

      </div>

    )}

  </div>

);

}

export default ConsumerPage;