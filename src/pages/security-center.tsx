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

    const { GDMREGISTRY_ADDRESS } = getContractAddresses();

    const handleConnect = async () => {
        const { address } = await connectWallet();
        setAddress(address);
        setStatus("Security Center Node Connected");
    };

    const handleSecureProcessing = async () => {
        try {
            setIsProcessing(true);
            setStatus("1/3: Encrypting via TACo Threshold Protocol...");
            
            // Lấy dữ liệu (giả định lấy từ Owner đã authorize)
            const mockPlaintext = "Hello SGD from Owner A"; 

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
                initialOwner: "0xAddress_Of_Owner_Here", // Địa chỉ của Owner thực sự
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

            setStatus(`Processing Complete. CID: ${cid.slice(0,10)}...`);
            setIsProcessing(false);
        } catch (error: unknown) {
            // setStatus("Error: " + error.message);
            // setIsProcessing(false);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            setStatus("Error: " + errorMessage);
            setIsProcessing(false);
        }
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Security Center</p>
                    <h2>2. Secure Processing & Encryption</h2>
                    <p className="section-copy">
                        The Security Center acts as a Trusted Execution Environment. 
                        We perform heavy computation, encryption, and decentralized storage tasks.
                    </p>
                </div>
                <button className="primary-btn" onClick={handleConnect} style={{background: '#6366f1'}}>
                    {address ? "Node Active" : "Connect Security Node"}
                </button>
            </div>

            <div className="demo-grid">
                <section className="card">
                    <div className="field-group">
                        <label className="field-label">Target Token ID</label>
                        <input className="text-input" type="number" value={tokenId} onChange={e => setTokenId(Number(e.target.value))} />
                    </div>
                    <button 
                        className="primary-btn" 
                        onClick={handleSecureProcessing}
                        disabled={isProcessing || !address}
                        style={{width: '100%', background: isProcessing ? '#94a3b8' : '#6366f1'}}
                    >
                        {isProcessing ? "Processing..." : "Start Secure Encryption Flow"}
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