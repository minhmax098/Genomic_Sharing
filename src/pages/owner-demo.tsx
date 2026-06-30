// Owner page
import { useState } from "react";
import { connectWallet, switchToSepolia } from "../lib/wallet";

export default function OwnerDemo() {
    const [address, setAddress] = useState("");
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

    const handleGrantPermission = () => {
        if (!address) {
            setStatus("Please connect Owner wallet first.");
            return;
        }

        localStorage.setItem("owner_permission_granted", "true");
        setStatus("Owner permission granted. Sequencing Center can process the genomic data.");
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Owner workspace</p>
                    <h2>1. Authorize Sequencing Center</h2>
                    <p className="section-copy">
                        As a Data Owner, you only grant permission for the trusted Sequencing Center
                        to process, encrypt, and register genomic data on your behalf.
                    </p>
                </div>

                <button className="primary-btn" onClick={handleConnect}>
                    {address ? "Wallet Connected" : "Connect Wallet"}
                </button>
            </div>

            <div className="demo-grid">
                <section className="card">
                    <div className="action-row">
                        <button className="primary-btn" onClick={handleGrantPermission}>
                            Grant Processing Permission
                        </button>
                    </div>

                    <div className="status-box" style={{ marginTop: "20px" }}>
                        <span>Current status</span>
                        <strong>{status || "Waiting for Owner authorization..."}</strong>
                    </div>
                </section>

                <aside className="card">
                    <h3>Owner's Duty</h3>
                    <ul className="flow-list">
                        <li>Maintain ownership of Raw Genomic Data (RGD).</li>
                        <li>Grant permission to the trusted Sequencing Center.</li>
                        <li>Define access policies and pricing.</li>
                        <li>Allow technical processing, encryption, and registration.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}