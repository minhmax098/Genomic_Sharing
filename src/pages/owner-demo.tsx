// import { useState, type ChangeEvent } from "react";
// import { connectWallet, switchToSepolia } from "../lib/wallet";
// import { getContractAddresses } from "../lib/blockchain";
// import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";

// type ErrorWithMessage = {
//   message?: string;
// };

// function getErrorMessage(error: unknown, fallback: string) {
//   if (
//     typeof error === "object" &&
//     error !== null &&
//     "message" in error
//   ) {
//     return (error as ErrorWithMessage).message || fallback;
//   }

//   return fallback;
// }

// export default function OwnerDemo() {
//   const [address, setAddress] = useState("");
//   const [plaintext, setPlaintext] = useState("Hello SGD from Owner A");
//   const [selectedFileName, setSelectedFileName] = useState("");
//   const [status, setStatus] = useState("");
//   const [tokenId, setTokenId] = useState(1);
//   const [messageKitReady, setMessageKitReady] = useState(false);

//   const { GDMREGISTRY_ADDRESS, SGDNFT_ADDRESS } = getContractAddresses();

//   const handleConnect = async () => {
//     try {
//       await switchToSepolia();
//       const { address } = await connectWallet();
//       setAddress(address);
//       setStatus("Owner wallet connected");
//     } catch (error: unknown) {
//       setStatus(getErrorMessage(error, "Failed to connect owner wallet"));
//     }
//   };

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     setSelectedFileName(file ? file.name : "");
//   };

//   const handlePrepareTacoEncrypt = async () => {
//     try {
//       if (!address) {
//         setStatus("Connect owner wallet first");
//         return;
//       }

//       setStatus("Preparing TACo encryption...");

//       const kit = await tacoEncryptPlaintext({
//         plaintext,
//         registryAddress: GDMREGISTRY_ADDRESS,
//         tokenId,
//       });

//       await fetch("http://localhost:3001/demo/messagekit", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(kit),
//       });

//       setMessageKitReady(true);
//       setStatus("TACo encryption successful and stored on server");
//     } catch (error: unknown) {
//       setStatus(getErrorMessage(error, "Failed to prepare TACo encryption"));
//     }
//   };

//   const handleClearServerMessageKit = async () => {
//     try {
//       await fetch("http://localhost:3001/demo/messagekit", {
//         method: "DELETE",
//       });

//       setMessageKitReady(false);
//       setStatus("Stored messageKit cleared from server");
//     } catch (error: unknown) {
//       setStatus(getErrorMessage(error, "Failed to clear stored messageKit"));
//     }
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Owner Demo</h2>

//       <div style={{ marginBottom: 16 }}>
//         <button onClick={handleConnect}>Connect Wallet</button>
//       </div>

//       <p>
//         <strong>Owner Address:</strong> {address || "Not connected"}
//       </p>

//       <p>
//         <strong>GDMRegistry:</strong> {GDMREGISTRY_ADDRESS}
//       </p>

//       <p>
//         <strong>SGDNFT:</strong> {SGDNFT_ADDRESS}
//       </p>

//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Token ID:{" "}
//           <input
//             type="number"
//             value={tokenId}
//             onChange={(e) => setTokenId(Number(e.target.value))}
//           />
//         </label>
//       </div>

//       <div style={{ marginTop: 20, marginBottom: 16 }}>
//         <label>
//           Demo Plaintext
//           <br />
//           <textarea
//             rows={6}
//             style={{ width: "100%", maxWidth: 700 }}
//             value={plaintext}
//             onChange={(e) => setPlaintext(e.target.value)}
//           />
//         </label>
//       </div>

//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Select SGD File: <input type="file" onChange={handleFileChange} />
//         </label>
//       </div>

//       <p>
//         <strong>Selected File:</strong> {selectedFileName || "-"}
//       </p>

//       <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
//         <button onClick={handlePrepareTacoEncrypt}>Prepare TACo Encrypt</button>
//         <button onClick={handleClearServerMessageKit}>Clear Stored MessageKit</button>
//       </div>

//       <p style={{ marginTop: 16 }}>
//         <strong>Status:</strong> {status}
//       </p>

//       <p>
//         <strong>MessageKit Ready:</strong> {messageKitReady ? "Yes" : "No"}
//       </p>

//       <div style={{ marginTop: 24 }}>
//         <h3>Planned TACo Flow</h3>
//         <ol>
//           <li>Owner encrypts SGD with TACo policy</li>
//           <li>Encrypted SGD is stored on server temporarily for demo</li>
//           <li>Buyer purchases access</li>
//           <li>Buyer loads encrypted payload from server</li>
//           <li>Buyer decrypts with TACo using a different wallet</li>
//         </ol>
//       </div>
//     </div>
//   );
// }

import { useState, type ChangeEvent } from "react";
import { connectWallet, switchToSepolia } from "../lib/wallet";
import { getContractAddresses } from "../lib/blockchain";
import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";

type ErrorWithMessage = {
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as ErrorWithMessage).message || fallback;
  }

  return fallback;
}

export default function OwnerDemo() {
  const [address, setAddress] = useState("");
  const [plaintext, setPlaintext] = useState("Hello SGD from Owner A");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState(1);
  const [messageKitReady, setMessageKitReady] = useState(false);

  const { GDMREGISTRY_ADDRESS, SGDNFT_ADDRESS } = getContractAddresses();

  const handleConnect = async () => {
    try {
      await switchToSepolia();
      const { address } = await connectWallet();
      setAddress(address);
      setStatus("Owner wallet connected");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to connect owner wallet"));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file ? file.name : "");
  };

  const handlePrepareTacoEncrypt = async () => {
    try {
      if (!address) {
        setStatus("Connect owner wallet first");
        return;
      }

      setStatus("Preparing TACo encryption...");

      const kit = await tacoEncryptPlaintext({
        plaintext,
        registryAddress: GDMREGISTRY_ADDRESS,
        tokenId,
      });

      await fetch("http://localhost:3001/demo/messagekit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(kit),
      });

      setMessageKitReady(true);
      setStatus("TACo encryption successful and stored on server");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to prepare TACo encryption"));
    }
  };

  const handleClearServerMessageKit = async () => {
    try {
      await fetch("http://localhost:3001/demo/messagekit", {
        method: "DELETE",
      });

      setMessageKitReady(false);
      setStatus("Stored messageKit cleared from server");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to clear stored messageKit"));
    }
  };

  return (
    <div className="demo-page">
      <div className="demo-header">
        <div>
          <p className="section-tag">Owner workspace</p>
          <h2>Prepare encrypted SGD package</h2>
          <p className="section-copy">
            Connect the owner wallet, choose a token, prepare TACo encryption,
            and store the encrypted payload on the demo server.
          </p>
        </div>

        <button className="primary-btn" onClick={handleConnect}>
          {address ? "Wallet Connected" : "Connect Wallet"}
        </button>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <span>Owner address</span>
          <strong className="mono-text">{address || "Not connected"}</strong>
        </div>

        <div className="info-card">
          <span>GDMRegistry</span>
          <strong className="mono-text">{GDMREGISTRY_ADDRESS}</strong>
        </div>

        <div className="info-card">
          <span>SGDNFT</span>
          <strong className="mono-text">{SGDNFT_ADDRESS}</strong>
        </div>
      </div>

      <div className="demo-grid">
        <section className="card">
          <div className="field-group">
            <label className="field-label">Token ID</label>
            <input
              className="text-input"
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(Number(e.target.value))}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Demo Plaintext</label>
            <textarea
              className="text-area"
              rows={6}
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Select SGD File</label>
            <input className="text-input" type="file" onChange={handleFileChange} />
            <p className="helper-text">
              Selected file: {selectedFileName || "No file selected"}
            </p>
          </div>

          <div className="action-row">
            <button className="primary-btn" onClick={handlePrepareTacoEncrypt}>
              Prepare TACo Encrypt
            </button>
            <button className="secondary-btn" onClick={handleClearServerMessageKit}>
              Clear Stored MessageKit
            </button>
          </div>

          <div className="status-stack">
            <div className="status-box">
              <span>Current status</span>
              <strong>{status || "Waiting for action"}</strong>
            </div>

            <div className={`pill ${messageKitReady ? "success" : "muted"}`}>
              {messageKitReady ? "MessageKit Ready" : "MessageKit Not Ready"}
            </div>
          </div>
        </section>

        <aside className="card">
          <h3>Planned TACo flow</h3>
          <ol className="flow-list">
            <li>Owner encrypts SGD using TACo policy</li>
            <li>Encrypted SGD is stored temporarily on the demo server</li>
            <li>Buyer purchases full access on-chain</li>
            <li>Buyer loads encrypted payload from the backend</li>
            <li>Buyer decrypts only after satisfying access condition</li>
          </ol>

          <div className="mini-note">
            This layout is presentation-friendly: your professor can clearly
            see connection status, contract addresses, user inputs, and action
            flow without the page looking crowded.
          </div>
        </aside>
      </div>
    </div>
  );
}