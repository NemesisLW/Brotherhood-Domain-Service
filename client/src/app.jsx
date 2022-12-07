import React, { useEffect, useState } from "react";
import "./styles/App.css";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";

import { networks } from "./utils/networks";
import { ethers } from "ethers";
import abi from "./utils/Domains.json";

const tld = ".ac";
const CONTRACT_ADDRESS = "0xfFE93e0CF56402ddE5eE3f1fB96601367d9CbA9F";
const contractABI = abi.abi;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [network, setNetwork] = useState("");

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [mints, setMints] = useState([]);

  const checkIfWalletConnected = async () => {
    const getEthereumObject = () => window.ethereum;
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        console.error("Make sure you have metamask!");
        return null;
      }
      console.log("We have the ethereum object", ethereum);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      setNetwork(networks[chainId]);

      const mumbaiChainId = "0x13881";

      ethereum.on("chainChanged", handleChainChanged);

      // Reload the page when they change networks
      function handleChainChanged(_chainId) {
        window.location.reload();
      }

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        fetchMints();
        return account;
      } else {
        console.error("No authorized account found");
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  // Function to render if wallet is not connected yet
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect Wallet
    </button>
  );

  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="connect-wallet-container">
          <p className="please" onClick={switchNetwork}>
            Please connect to the Polygon Mumbai Testnet
          </p>
        </div>
      );
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="Ezio Auditore da Firenze"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder="Oath to the Creed."
          onChange={(e) => setRecord(e.target.value)}
        />

        {editing ? (
          <div className="button-container">
            <button
              className="cta-button connect-wallet-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set Record
            </button>
            <button
              className="cta-button connect-wallet-button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // If editing is not true, the mint button will be returned instead
          <div className="button-container">
            <button
              className="cta-button connect-wallet-button"
              disabled={null}
              onClick={mintDomain}
            >
              Mint
            </button>
          </div>
        )}
      </div>
    );
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }

    const price =
      domain.length === 3
        ? "0.05"
        : domain.length === 4
        ? "0.03"
        : domain.length <= 10
        ? "0.01"
        : `${domain.length} * 0.01`;
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        let domains = await contract.getAllNames();

        let mintRecords = await Promise.all(
          domains.map(async (domain) => {
            const mintRecord = await contract.getRecord(domain);
            const owner = await contract.getAddress(domain);

            return {
              id: domains.indexOf(domain),
              name: domain,
              record: mintRecord,
              owner: owner,
            };
          })
        );
        console.log(mintRecords);
        setMints(mintRecords);
        console.log(mints);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Render Mints
  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="recent"> Recent Novices</p>
          <div className="mint-list">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="underlined">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name)}
                      >
                        <img
                          className="edit-icon"
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p> {mint.record} </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  // Edit Functionality
  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  };

  useEffect(() => {
    checkIfWalletConnected();
    fetchMints();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <div className="icons8-assassins-creed-logo"></div>
              <p className="title">Brotherhood Name Service</p>
              <p className="subtitle">
                Laa shay'a waqi'un mutlaq bale kouloun moumkin.
              </p>
            </div>
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>
        <div className="connect-wallet-container">
          <img
            src="https://media0.giphy.com/media/vQP4vlHXiM0TKzHFxn/giphy.gif"
            alt="Initiation"
          />
          {!currentAccount && renderNotConnectedContainer()}
        </div>

        {currentAccount && renderInputForm()}

        {mints && renderMints()}

        <div className="footer-container">
          <div className="badge-container grow">
            <a
              href="https://twitter.com/Arghyad18"
              target="_blank"
              rel="noreferrer"
            >
              <div className="badge">
                <p>build by Arghya</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
