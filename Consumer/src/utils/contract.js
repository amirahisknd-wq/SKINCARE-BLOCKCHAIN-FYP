import { ethers } from "ethers";
import abi from "../abi.json";
import config from "../config";

export const connectContract = async () => {

  if (!window.ethereum) {
    alert("Please install MetaMask");
    return null;
  }

  await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  const provider = new ethers.BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    config.contractAddress,
    abi,
    signer
  );

  return contract;
};

export const connectReadOnlyContract =
async () => {

  const provider =
    new ethers.JsonRpcProvider(
      "https://eth-sepolia.g.alchemy.com/v2/y5VUjTR8FpX5bWzSVAftj"
    );

  const contract =
    new ethers.Contract(
      config.contractAddress,
      abi,
      provider
    );

  return contract;
};