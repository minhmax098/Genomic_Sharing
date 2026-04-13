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

    const handleAuthorizeProcessing = () => {
        // call API or save local state
        // Security Center tab can recognize.
        setStatus("Data authorized. Please switch to 'Security Center' tab to process encryption.");
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Owner workspace</p>
                    <h2>1. Provide & Authorize Data</h2>
                    <p className="section-copy">
                        As a Data Owner, you only need to provide your genomic information 
                        and authorize the Security Center to handle the technical encryption process.
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
                            Authorize for Security Center
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
                        <li>Grant processing permission to the Trusted Security Center.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}