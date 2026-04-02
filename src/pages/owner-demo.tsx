import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { connectWallet, switchToBscTestnet } from "../lib/wallet";
import { getContractAddresses } from "../lib/blockchain";

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

type OwnerDemoProps = {
  messageKit: unknown | null;
  setMessageKit: Dispatch<SetStateAction<unknown | null>>;
};

export default function OwnerDemo({
  messageKit,
  setMessageKit,
}: OwnerDemoProps) {
  const [address, setAddress] = useState("");
  const [plaintext, setPlaintext] = useState("Hello SGD from Owner A");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [status, setStatus] = useState("");

  const { GDMREGISTRY_ADDRESS, SGDNFT_ADDRESS } = getContractAddresses();

  const handleConnect = async () => {
    try {
      await switchToBscTestnet();
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
      // Tạm thời chỉ để test props/state hoạt động
      // Sau này bạn thay bằng tacoEncryptPlaintext(...)
      setMessageKit({
        demo: true,
        plaintext,
      });

      setStatus("TACo encrypt step placeholder is ready");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to prepare TACo encryption"));
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
      </div>

      <p style={{ marginTop: 16 }}>
        <strong>Status:</strong> {status}
      </p>

      <p>
        <strong>MessageKit Ready:</strong> {messageKit ? "Yes" : "No"}
      </p>

      <div style={{ marginTop: 24 }}>
        <h3>Planned TACo Flow</h3>
        <ol>
          <li>Owner encrypts SGD with TACo policy</li>
          <li>Encrypted SGD is uploaded to IPFS</li>
          <li>CID is registered on-chain</li>
          <li>Buyer purchases access</li>
          <li>Buyer fetches encrypted SGD and decrypts with TACo</li>
        </ol>
      </div>
    </div>
  );
}