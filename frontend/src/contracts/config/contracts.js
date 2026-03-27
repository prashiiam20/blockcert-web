export const NETWORKS = {
    localhost: {
      name: "Ganache (Local)",
      chainId: "0x539", // 1337 in hex
      rpcUrl: "http://127.0.0.1:8545",
      contractAddress: "0x0E696947A06550DEf604e82C26fd9E493e576337",
      blockExplorer: null
    },
    amoy: {
      name: "Polygon Amoy",
      chainId: "80002", // 80002 in hex
      rpcUrl: "https://rpc-amoy.polygon.technology/",
      contractAddress: "0x7dd506b0b06f19d2f029fe432cdac54dd93126dad45916415c1472ef3b8d36b8",
      blockExplorer: "https://amoy.polygonscan.com"
    },
    sepolia: {
      name: "Ethereum Sepolia",
      chainId: "11155111", // 11155111 in hex
      rpcUrl: "https://sepolia.infura.io/v3/",
      contractAddress: "0x4200000000000000000000000000000000000006",
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