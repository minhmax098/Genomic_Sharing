import { useState } from "react";
import { connectWallet, switchToBscTestnet } from "../lib/wallet";
import {
    getPublicRecord,
    hasPurchased,
    purchaseFullAccess,
} from "../lib/blockchain";

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

    const handleConnect = async () => {
        try {
            await switchToBscTestnet();
            const { address } = await connectWallet();
            setAddress(address);
            setStatus("Wallet connected");
        } catch (error: unknown) {
            setStatus(getErrorMessage(error, "Failed to connect wallet"));
        }
    };

    const handleGetRecord = async () => {
        try {
            setStatus("Loading public record...");
            const data = await getPublicRecord(tokenId);
            setRecord(data);
            setStatus("Public record loaded");
        } catch (error: unknown) {
            setStatus(getErrorMessage(error, "Failed to load public record"));
        }
    };

    const handleCheckPurchased = async () => {
        try {
        if (!address) {
            setStatus("Connect wallet first");
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
            setStatus("Sending purchase transaction...");
            const hash = await purchaseFullAccess(tokenId);
            setTxHash(hash);
            setStatus("Purchase successful");
        } catch (error: unknown) {
            setStatus(getErrorMessage(error, "Purchase failed"));
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
            <button onClick={handlePurchase}>Purchase Full Access</button>
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
            <h3>Next TACo Step</h3>
            <p>
            After purchase, Buyer will fetch encrypted SGD from IPFS and use TACo
            to decrypt it if the access condition is satisfied.
            </p>
        </div>
        </div>
    );
}