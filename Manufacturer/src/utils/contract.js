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
      process.env.REACT_APP_ALCHEMY_RPC
    );

  const contract =
    new ethers.Contract(
      config.contractAddress,
      abi,
      provider
    );

  return contract;
};