import { useState, type ChangeEvent } from "react";
import { connectWallet, switchToSepolia } from "../lib/wallet";
import { getContractAddresses } from "../lib/blockchain";
import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";

type ErrorWithMessage = {
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
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
    <div style={{ padding: 24 }}>
      <h2>Owner Demo</h2>

      <div style={{ marginBottom: 16 }}>
        <button onClick={handleConnect}>Connect Wallet</button>
      </div>

      <p>
        <strong>Owner Address:</strong> {address || "Not connected"}
      </p>

      <p>
        <strong>GDMRegistry:</strong> {GDMREGISTRY_ADDRESS}
      </p>

      <p>
        <strong>SGDNFT:</strong> {SGDNFT_ADDRESS}
      </p>

      <div style={{ marginBottom: 16 }}>
        <label>
          Token ID:{" "}
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(Number(e.target.value))}
          />
        </label>
      </div>

      <div style={{ marginTop: 20, marginBottom: 16 }}>
        <label>
          Demo Plaintext
          <br />
          <textarea
            rows={6}
            style={{ width: "100%", maxWidth: 700 }}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
          Select SGD File: <input type="file" onChange={handleFileChange} />
        </label>
      </div>

      <p>
        <strong>Selected File:</strong> {selectedFileName || "-"}
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={handlePrepareTacoEncrypt}>Prepare TACo Encrypt</button>
        <button onClick={handleClearServerMessageKit}>Clear Stored MessageKit</button>
      </div>

      <p style={{ marginTop: 16 }}>
        <strong>Status:</strong> {status}
      </p>

      <p>
        <strong>MessageKit Ready:</strong> {messageKitReady ? "Yes" : "No"}
      </p>

      <div style={{ marginTop: 24 }}>
        <h3>Planned TACo Flow</h3>
        <ol>
          <li>Owner encrypts SGD with TACo policy</li>
          <li>Encrypted SGD is stored on server temporarily for demo</li>
          <li>Buyer purchases access</li>
          <li>Buyer loads encrypted payload from server</li>
          <li>Buyer decrypts with TACo using a different wallet</li>
        </ol>
      </div>
    </div>
  );
}