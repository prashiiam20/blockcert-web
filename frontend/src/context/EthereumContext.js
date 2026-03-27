import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORKS } from '../config/contracts';
import CertificateRegistryABI from '../contracts/CertificateRegistry.json';

export const EthereumContext = createContext();

export const EthereumProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState('localhost');
  const [userRole, setUserRole] = useState(0);
  const [loading, setLoading] = useState(false);

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUserRole(0);
    localStorage.setItem('blockcert_disconnected', 'true');
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setLoading(true);
      
      // Clear manual disconnect flag when explicitly connecting
      localStorage.removeItem('blockcert_disconnected');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setAccount(address);

      // Get network
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      
      let networkName = 'localhost';
      Object.entries(NETWORKS).forEach(([key, value]) => {
        if (value.chainId === chainId) {
          networkName = key;
        }
      });
      setNetwork(networkName);

      // Load contract
      loadContract(signer, networkName, address);

      setLoading(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
      setLoading(false);
    }
  };

  const loadContract = async (signer, networkName, address) => {
    try {
      const contractAddress = NETWORKS[networkName].contractAddress;
      const contract = new ethers.Contract(
        contractAddress,
        CertificateRegistryABI.abi,
        signer
      );

      setContract(contract);

      // Get user role using the provided address since React state 'account' may be stale
      if (address) {
        const role = await contract.roles(address);
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const switchNetwork = async (networkName) => {
    try {
      const networkConfig = NETWORKS[networkName];
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });

      setNetwork(networkName);
      if (signer) {
        loadContract(signer, networkName);
      }
    } catch (error) {
      if (error.code === 4902) {
        // Network not added, add it
        await addNetwork(networkName);
      } else {
        console.error('Error switching network:', error);
      }
    }
  };

  const addNetwork = async (networkName) => {
    const networkConfig = NETWORKS[networkName];
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: networkConfig.chainId,
          chainName: networkConfig.name,
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : null
        }]
      });
    } catch (error) {
      console.error('Error adding network:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        // Auto-connect if already authorized
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const isManuallyDisconnected = localStorage.getItem('blockcert_disconnected') === 'true';
          
          if (accounts.length > 0 && !isManuallyDisconnected) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = accounts[0];
            
            setProvider(provider);
            setSigner(signer);
            setAccount(address);
            
            const network = await provider.getNetwork();
            const chainId = '0x' + network.chainId.toString(16);
            let networkName = 'localhost';
            Object.entries(NETWORKS).forEach(([key, value]) => {
              if (value.chainId === chainId) networkName = key;
            });
            setNetwork(networkName);
            
            loadContract(signer, networkName, address);
          }
        } catch (e) {
          console.error('Auto-connect failed', e);
        }

        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) setAccount(null);
          window.location.reload();
        });

        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    };
    init();
  }, []);

  return (
    <EthereumContext.Provider value={{
      account,
      provider,
      signer,
      contract,
      network,
      userRole,
      loading,
      connectWallet,
      disconnectWallet,
      switchNetwork
    }}>
      {children}
    </EthereumContext.Provider>
  );
};