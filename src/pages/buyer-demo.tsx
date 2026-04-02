import { useState } from "react";
import { connectWallet, switchToBscTestnet } from "../lib/wallet";
import {
  getPublicRecord,
  hasPurchased,
  purchaseFullAccess,
} from "../lib/blockchain";
import { tacoDecryptToString } from "../lib/tacoDecrypt";

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

export default function BuyerDemo() {
  const [address, setAddress] = useState("");
  const [tokenId, setTokenId] = useState(1);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [purchased, setPurchased] = useState("");
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("");
  const [messageKitAvailable, setMessageKitAvailable] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");

  const handleConnect = async () => {
    try {
      await switchToBscTestnet();
      const { address } = await connectWallet();
      setAddress(address);
      setStatus("Buyer wallet connected");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to connect buyer wallet"));
    }
  };

  const handleGetRecord = async () => {
    try {
      setStatus("Loading public record...");
      const data = await getPublicRecord(tokenId);
      setRecord(data as Record<string, unknown>);
      setStatus("Public record loaded");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to load public record"));
    }
  };

  const handleCheckPurchased = async () => {
    try {
      if (!address) {
        setStatus("Connect buyer wallet first");
        return;
      }

      setStatus("Checking purchase status...");
      const result = await hasPurchased(tokenId, address);
      setPurchased(String(result));
      setStatus("Purchase status checked");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to check purchase status"));
    }
  };

  const handlePurchase = async () => {
    try {
      if (!address) {
        setStatus("Connect buyer wallet first");
        return;
      }

      if (purchased === "true") {
        setStatus("Buyer already purchased access");
        return;
      }

      setStatus("Sending purchase transaction...");
      const hash = await purchaseFullAccess(tokenId);
      setTxHash(hash);
      setStatus("Purchase successful");

      const result = await hasPurchased(tokenId, address);
      setPurchased(String(result));
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Purchase failed"));
    }
  };

  const handleLoadMessageKit = async () => {
    try {
      setStatus("Loading encrypted payload from server...");

      const response = await fetch("http://localhost:3001/demo/messagekit");

      if (!response.ok) {
        throw new Error("No messageKit available on server");
      }

      const _kit = await response.json();
      setMessageKitAvailable(Boolean(_kit));
      setStatus("Encrypted payload loaded from server");
    } catch (error: unknown) {
      setMessageKitAvailable(false);
      setStatus(getErrorMessage(error, "Failed to load messageKit"));
    }
  };

  const handleTacoDecrypt = async () => {
    try {
      if (!address) {
        setStatus("Connect buyer wallet first");
        return;
      }

      if (purchased !== "true") {
        setStatus("Buyer has not satisfied access condition yet");
        return;
      }

      setStatus("Loading encrypted payload from server...");

      const response = await fetch("http://localhost:3001/demo/messagekit");
      if (!response.ok) {
        throw new Error("No messageKit available on server");
      }

      const kit = await response.json();

      setMessageKitAvailable(Boolean(kit));
      setStatus("Decrypting with TACo...");

      const text = await tacoDecryptToString({
        messageKit: kit as never,
      });

      setDecryptedText(text);
      setStatus("TACo decrypt successful");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "TACo decrypt failed"));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Buyer Demo</h2>

      <div style={{ marginBottom: 16 }}>
        <button onClick={handleConnect}>Connect Wallet</button>
      </div>

      <p>
        <strong>Buyer Address:</strong> {address || "Not connected"}
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

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={handleGetRecord}>Get Public Record</button>
        <button onClick={handleCheckPurchased}>Check Purchased</button>
        <button onClick={handlePurchase} disabled={purchased === "true"}>
          Purchase Full Access
        </button>
        <button onClick={handleLoadMessageKit}>Load Encrypted Data</button>
        <button onClick={handleTacoDecrypt}>TACo Decrypt</button>
      </div>

      <p>
        <strong>Status:</strong> {status}
      </p>

      <p>
        <strong>Purchased:</strong> {purchased || "-"}
      </p>

      <p>
        <strong>Tx Hash:</strong> {txHash || "-"}
      </p>

      <p>
        <strong>MessageKit Available:</strong> {messageKitAvailable ? "Yes" : "No"}
      </p>

      {record !== null && (
        <div style={{ marginTop: 20 }}>
          <h3>Public Record</h3>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 16,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(
              record,
              (_, value) => (typeof value === "bigint" ? value.toString() : value),
              2
            )}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>Decrypted Result</h3>
        <pre
          style={{
            background: "#111",
            color: "#eee",
            padding: 16,
            borderRadius: 8,
            overflowX: "auto",
            minHeight: 80,
          }}
        >
          {decryptedText || "No decrypted text yet"}
        </pre>
      </div>
    </div>
  );
}