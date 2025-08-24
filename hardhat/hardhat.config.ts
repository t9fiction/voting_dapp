import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const { PRIVATE_KEY, PRIVATE_KEY_LOCAL_NODE, ETHERSCAN_API_KEY, API_URL_SEPOLIA } = process.env;

if (!PRIVATE_KEY) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}
if(!ETHERSCAN_API_KEY){
  throw new Error("Please set your ETHERSCAN_API_KEY in a .env file");
}
if(!API_URL_SEPOLIA){
  throw new Error("Please set your API_URL_SEPOLIA in a .env file");
}
if(!PRIVATE_KEY_LOCAL_NODE){
  throw new Error("Please set your PRIVATE_KEY_LOCAL_NODE in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // localhost: {
    //   url: "http://127.0.0.1:8545",
    //   chainId: 31337,
    // },
    sepolia:{
      url: API_URL_SEPOLIA,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    }
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }  
};

export default config;
