// Sequenced Center page
import { useState } from "react";
import { connectWallet } from "../lib/wallet";
import { getContractAddresses, registerSGD } from "../lib/blockchain";
import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";
import { uploadEncryptedToIPFS } from "../lib/ipfs";

export default function SecurityCenter() {
    const [address, setAddress] = useState("");
    const [tokenId, setTokenId] = useState(1);
    const [status, setStatus] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    // check status is completed or not
    const [isFinished, setIsFinished] = useState(false);

    const { GDMREGISTRY_ADDRESS } = getContractAddresses();

    const handleConnect = async () => {
        const { address } = await connectWallet();
        setAddress(address);
        setStatus("Sequenced Center Node Connected");
    };

// Update handleSecureProcessing in SecurityCenter
const handleSecureProcessing = async () => {
    try {
        setIsProcessing(true);
        setIsFinished(false);
        setStatus("Re-verifying data integrity and checking duplicates...");

        const mockPlaintext = "Hello SGD from Owner A"; // get from authorize state

        // B11: Check and get hash
        const verifyRes = await fetch("http://localhost:3001/verifyFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: mockPlaintext, format: "txt" })
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
            setStatus(`Stop: ${verifyData.error}`);
            setIsProcessing(false);
            return;
        }

        const currentHash = verifyData.hash;

        // B2: Encrypt and upload
        setStatus("1/3: Encrypting via TACo Threshold Protocol...");
        const kit = await tacoEncryptPlaintext({
            plaintext: mockPlaintext,
            registryAddress: GDMREGISTRY_ADDRESS,
            tokenId,
        });

        setStatus("2/3: Uploading Secure Genomic Data (SGD) to IPFS...");
        const kitBlob = new Blob([JSON.stringify(kit)], { type: "application/json" });
        const cid = await uploadEncryptedToIPFS(kitBlob, `sgd_token_${tokenId}.taco`);

        setStatus("3/3: Recording Metadata on Ethereum Blockchain...");
        await registerSGD({
            initialOwner: address, 
            sgdId: `SGD-SEC-${tokenId}`,
            rgdId: "RGD-PRIMARY",
            cid: cid,
            accessCondition: "Paid Access",
            price: "0.01",
            collectionDate: Math.floor(Date.now() / 1000),
            sampleType: "Genomic Sequence",
            patientRef: "ANON-001",
            consentCode: "CONSENT-YES",
            sampleHash: "0x" + "0".repeat(40),
            encryptionScheme: "TACo-Nucypher",
            sequencingInfo: "Trusted Sequencing Center",
            signatureRef: "0x" + "0".repeat(40),
            encHash: "0x" + "0".repeat(40),
            tokenURI: `ipfs://${cid}`,
        });

        // B3: Save hash to database after blockchain success
        await fetch("http://localhost:3001/commit-hash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hash: currentHash })
        });

        setStatus(`Processing Complete. CID: ${cid.slice(0,10)}... and Hash committed.`);
        setIsProcessing(false);
        setIsFinished(true); 

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            setStatus("Error: " + errorMessage);
            setIsProcessing(false);
            setIsFinished(false);
        }
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Sequenced Center</p>
                    <h2>2. Secure Processing & Encryption</h2>
                    <p className="section-copy">
                        The Sequenced Center acts as a Trusted Execution Environment. 
                        We perform heavy computation, encryption, and decentralized storage tasks.
                    </p>
                </div>
                <button className="primary-btn" onClick={handleConnect} style={{background: '#6366f1'}}>
                    {address ? "Node Active" : "Connect Sequenced Center Node"}
                </button>
            </div>

            <div className="demo-grid">
                <section className="card">
                    <div className="field-group">
                        <label className="field-label">Target Token ID</label>
                        <input 
                            className="text-input" 
                            type="number" 
                            value={tokenId} 
                            // 3. Allow changing ID to process other tokens if already completed
                            onChange={e => {
                                setTokenId(Number(e.target.value));
                                setIsFinished(false); // Reset status when changing ID
                            }} 
                        />
                    </div>
                    {/* 4. Update display logic and disable button */}
                    <button 
                        className="primary-btn" 
                        onClick={handleSecureProcessing}
                        disabled={isProcessing || !address || isFinished}
                        style={{
                            width: '100%', 
                            background: (isProcessing || isFinished) ? '#94a3b8' : '#6366f1',
                            cursor: (isProcessing || isFinished) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isProcessing 
                            ? "Processing..." 
                            : isFinished 
                                ? "Data Registered Successfully" 
                                : "Start Secure Encryption Flow"}
                    </button>
                    <div className="status-box" style={{marginTop: '20px'}}>
                        <strong>{status || "Ready to process authorized data..."}</strong>
                    </div>
                </section>
                
                <aside className="card">
                    <h3>Technical Duty</h3>
                    <ul className="flow-list">
                        <li>Perform Threshold Encryption (TACo).</li>
                        <li>Manage decentralized storage (IPFS).</li>
                        <li>Interface with Smart Contracts for registration.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}