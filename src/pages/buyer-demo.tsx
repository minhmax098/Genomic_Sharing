import { useState } from "react";
import { connectWallet, switchToSepolia } from "../lib/wallet";
import { getPublicRecord, hasPurchased, purchaseFullAccess, } from "../lib/blockchain";
import { tacoDecryptToString } from "../lib/tacoDecrypt";

type ErrorWithMessage = {
    message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null && "message" in error) {
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
            await switchToSepolia();
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

            const kit = await response.json();
            setMessageKitAvailable(Boolean(kit));
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
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Buyer workspace</p>
                    <h2>Purchase access and decrypt the protected data</h2>
                    <p className="section-copy">
                        Review public record, confirm purchase state, buy full access, load
                        the encrypted payload, and perform TACo decryption.
                    </p>
                </div>

                <button className="primary-btn" onClick={handleConnect}>
                    {address ? "Wallet Connected" : "Connect Wallet"}
                </button>
            </div>

            <div className="info-grid">
                <div className="info-card">
                    <span>Buyer address</span>
                    <strong className="mono-text">{address || "Not connected"}</strong>
                </div>

                <div className="info-card">
                    <span>Purchased</span>
                    <strong>{purchased || "-"}</strong>
                </div>

                <div className="info-card">
                    <span>MessageKit</span>
                    <strong>{messageKitAvailable ? "Available" : "Not available"}</strong>
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

                    <div className="action-row">
                        <button className="secondary-btn" onClick={handleGetRecord}>
                            Get Public Record
                        </button>
                        <button className="secondary-btn" onClick={handleCheckPurchased}>
                            Check Purchased
                        </button>
                        <button
                            className="primary-btn"
                            onClick={handlePurchase}
                            disabled={purchased === "true"}
                        >
                            Purchase Full Access
                        </button>
                        <button className="secondary-btn" onClick={handleLoadMessageKit}>
                            Load Encrypted Data
                        </button>
                        <button className="secondary-btn" onClick={handleTacoDecrypt}>
                            TACo Decrypt
                        </button>
                    </div>

                    <div className="status-stack">
                        <div className="status-box">
                            <span>Current status</span>
                            <strong>{status || "Waiting for action"}</strong>
                        </div>

                        <div className={`pill ${messageKitAvailable ? "success" : "muted"}`}>
                            {messageKitAvailable ? "Encrypted Payload Ready" : "No Payload Yet"}
                        </div>
                    </div>

                    <div className="status-stack">
                        <div className="status-box">
                            <span>Transaction hash</span>
                            <strong className="mono-text">{txHash || "-"}</strong>
                        </div>
                    </div>

                    {record !== null && (
                        <div className="result-stack" style={{ marginTop: 18 }}>
                            <h3>Public Record</h3>
                            <pre className="mono-box">
                            {JSON.stringify(
                                record,
                                (_, value) =>
                                typeof value === "bigint" ? value.toString() : value,
                                2
                            )}
                            </pre>
                        </div>
                    )}
                </section>

            <aside className="card">
                <h3>Decrypted Result</h3>
                <pre className="mono-box">
                    {decryptedText || "No decrypted text yet"}
                </pre>

                <div className="mini-note">
                    For presentation, this panel is good because the final result is
                    separated clearly from transaction flow and purchase steps.
                </div>
            </aside>
            </div>
        </div>
    );
}