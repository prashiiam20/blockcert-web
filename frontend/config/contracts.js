export const NETWORKS = {
    localhost: {
      name: "Ganache (Local)",
      chainId: "1337", // 1337 in hex
      rpcUrl: "http://127.0.0.1:8545",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      blockExplorer: null
    },
    amoy: {
      name: "Polygon Amoy",
      chainId: "0x13882", // 80002 in hex
      rpcUrl: "https://rpc-amoy.polygon.technology/",
      contractAddress: "PASTE_YOUR_AMOY_CONTRACT_ADDRESS",
      blockExplorer: "https://amoy.polygonscan.com"
    },
    sepolia: {
      name: "Ethereum Sepolia",
      chainId: "0xaa36a7", // 11155111 in hex
      rpcUrl: "https://sepolia.infura.io/v3/",
      contractAddress: "PASTE_YOUR_SEPOLIA_CONTRACT_ADDRESS",
      blockExplorer: "https://sepolia.etherscan.io"
    }
  };
  
  export const ROLES = {
    NONE: 0,
    GOVERNMENT: 1,
    REGULATORY: 2,
    INSTITUTION: 3,
    STUDENT: 4,
    RECRUITER: 5
  };
  
  export const ROLE_NAMES = {
    0: "None",
    1: "Government",
    2: "Regulatory Authority",
    3: "Institution",
    4: "Student",
    5: "Recruiter"
  };