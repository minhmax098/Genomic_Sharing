// Owner page
import { useState } from "react";
import { connectWallet, switchToSepolia } from "../lib/wallet";

export default function OwnerDemo() {
    const [address, setAddress] = useState("");
    const [plaintext, setPlaintext] = useState("Hello SGD from Owner A");
    const [status, setStatus] = useState("");

    const handleConnect = async () => {
        try {
            await switchToSepolia();
            const { address } = await connectWallet();
            setAddress(address);
            setStatus("Owner wallet connected");
        } catch (error: unknown) {
            setStatus((error as Error).message || "Failed to connect owner wallet");
        }
    };

// handleAuthorizeProcessing
const handleAuthorizeProcessing = async () => {
    try {
        if (!plaintext.trim()) {
            setStatus("Please enter genomic data first.");
            return;
        }

        setStatus("Verifying genomic data format...");

        // Call API /verifyFile to check Garbage data 
        const response = await fetch("http://localhost:3001/verifyFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: plaintext,
                format: "txt",
                fileName: "genomic_data.txt"
            })
        });

        const result = await response.json();

        if (response.ok) {
            // LƯU DỮ LIỆU VÀO LOCALSTORAGE TẠI ĐÂY
            localStorage.setItem("authorized_genomic_data", plaintext);
            setStatus("Data verified. Authorized data saved for Sequenced Center.");
        } else {
            setStatus(`Rejected: ${result.error}`);
            return;
        }

        // If data is valid (Genomic data is in correct format and does not exist)
        setStatus("Data verified. Please switch to 'Sequenced Center' tab to process encryption.");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            setStatus("Backend verification failed. Ensure server is running.");
            setStatus("Error: " + errorMessage);
        }
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Owner workspace</p>
                    <h2>1. Provide & Authorize Data</h2>
                    <p className="section-copy">
                        As a Data Owner, you only need to provide your genomic information 
                        and authorize the Sequenced Center to handle the technical encryption process.
                    </p>
                </div>
                <button className="primary-btn" onClick={handleConnect}>
                    {address ? "Wallet Connected" : "Connect Wallet"}
                </button>
            </div>

            <div className="demo-grid">
                <section className="card">
                    <div className="field-group">
                        <label className="field-label">Raw Genomic Data (Plaintext)</label>
                        <textarea
                            className="text-area"
                            rows={8}
                            value={plaintext}
                            onChange={(e) => setPlaintext(e.target.value)}
                            placeholder="Enter genomic sequence here..."
                        />
                    </div>
                    <div className="action-row">
                        <button className="primary-btn" onClick={handleAuthorizeProcessing}>
                            Authorize for Sequenced Center
                        </button>
                    </div>
                    <div className="status-box" style={{marginTop: '20px'}}>
                        <span>Current status</span>
                        <strong>{status || "Waiting for Owner input..."}</strong>
                    </div>
                </section>

                <aside className="card">
                    <h3>Owner's Duty</h3>
                    <ul className="flow-list">
                        <li>Maintain ownership of Raw Genomic Data (RGD).</li>
                        <li>Define access policies and pricing.</li>
                        <li>Grant processing permission to the Trusted Sequenced Center.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}