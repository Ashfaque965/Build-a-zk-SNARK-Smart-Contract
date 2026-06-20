import React, { useState } from 'react';
import { ethers } from 'ethers';
import './WalletConnect.css';

function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install it to continue.');
        setLoading(false);
        return;
      }

      // Request account connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const account = accounts[0];
      
      // Request network switch to localhost/testnet (optional)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }], // Hardhat network ID
        });
      } catch (switchError) {
        // Network doesn't exist yet, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x539',
                  chainName: 'Hardhat Local Network',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'Hardhat ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
          } catch (addError) {
            console.warn('Could not add network:', addError);
          }
        }
      }

      onConnect(account);
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection request was rejected by user.');
      } else {
        setError(`Error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-connect">
      <button 
        onClick={connectWallet} 
        disabled={loading}
        className="connect-button"
      >
        {loading ? (
          <>
            <span className="spinner"></span> Connecting...
          </>
        ) : (
          <>
            <span className="wallet-icon">🦊</span> Connect MetaMask
          </>
        )}
      </button>
      {error && <div className="error-message">{error}</div>}
      <p className="wallet-info">
        💡 You need MetaMask installed to interact with the smart contract
      </p>
    </div>
  );
}

export default WalletConnect;
