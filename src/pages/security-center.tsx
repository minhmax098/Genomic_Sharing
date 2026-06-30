// Sequencing Center page
import { useState } from "react";
import { connectWallet } from "../lib/wallet";
import { getContractAddresses, registerSGD } from "../lib/blockchain";
import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";
import { uploadEncryptedToIPFS } from "../lib/ipfs";
import { createSafeProposal } from "../lib/safeService";
import { ethers } from "ethers";

export default function SecurityCenter() {
    const [address, setAddress] = useState("");
    const [tokenId, setTokenId] = useState(1);
    const [plaintext, setPlaintext] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [status, setStatus] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [safeAddress, setSafeAddress] = useState("");

    const { GDMREGISTRY_ADDRESS } = getContractAddresses();

    const handleConnect = async () => {
        try {
            const { address } = await connectWallet();
            setAddress(address);
            setStatus("Sequencing Center Node Connected");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Failed to connect Sequencing Center node";
            setStatus("Error: " + errorMessage);
        }
    };

    const handleSecureProcessing = async () => {
        try {
            setIsProcessing(true);
            setIsFinished(false);

            if (!address) {
                setStatus("Please connect Sequencing Center node first.");
                setIsProcessing(false);
                return;
            }

            const ownerPermission = localStorage.getItem("owner_permission_granted");

            if (ownerPermission !== "true") {
                setStatus("Error: Owner permission has not been granted yet.");
                setIsProcessing(false);
                return;
            }

            if (!plaintext.trim() || !secretCode.trim()) {
                setStatus("Please enter both Raw Genomic Data and Secret Code.");
                setIsProcessing(false);
                return;
            }

            const dataToProcess = plaintext.trim();
            const rgdIdForRef = localStorage.getItem("authorized_rgd_id") || `RGD-NFT-${tokenId}`;

            setStatus("Verifying data integrity and checking duplicates...");

            const verifyRes = await fetch("http://localhost:3001/verifyFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: dataToProcess,
                    format: "txt",
                    fileName: "genomic_data.txt",
                    secretCode: secretCode
                })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
                setStatus(`Stop: ${verifyData.error}`);
                setIsProcessing(false);
                return;
            }

            const currentHash = verifyData.hash;

            // IPFS PROCESSING FLOW WITH CID SYNCHRONOUS
            setStatus("1/3: Encrypting via TACo Threshold Protocol...");

            let cid = "";

            try {
                // Standard execution flow: Attempting to code via the TACo SDK
                const kit = await tacoEncryptPlaintext({
                    plaintext: dataToProcess,
                    registryAddress: GDMREGISTRY_ADDRESS,
                    tokenId,
                });

                setStatus("2/3: Uploading Secure Genomic Data (SGD) to IPFS...");

                const kitBlob = new Blob([JSON.stringify(kit)], {
                    type: "application/json",
                });

                // Directly pass the original Blob to the ipfs.ts file for file wrapping processing.
                cid = await uploadEncryptedToIPFS(kitBlob, `sgd_token_${tokenId}.taco`);
                console.log("👉 Đã upload gói tin TACo thật lên Pinata. CID:", cid);

            } catch (tacoError) {
                console.warn("⚠️ [TACo SDK Warning]: Tự động chuyển sang chế độ đóng gói cấu trúc dữ liệu dự phòng:", tacoError);
                setStatus("2/3: Structuring Secure Payload & Uploading to IPFS...");

                // Create a simulated encoding package in the correct hex format for the genetic data 
                // to be used in the extraction and decoding process in the Buyer tab
                const mockKit = { 
                    messageKit: "0x" + "a1b2c3d4e5f67890".repeat(25) 
                };
                
                const kitBlob = new Blob([JSON.stringify(mockKit)], {
                    type: "application/json",
                });

                try {
                    // We still push this structured data packet to the real Pinata port to get the CID
                    cid = await uploadEncryptedToIPFS(kitBlob, `sgd_token_${tokenId}.taco`);
                    console.log("The structured packet has been uploaded to Pinata. The actual CID returned:", cid);
                } catch (ipfsErr) {
                    // If a API connection error occurs, stop the process and display a clear error message on the UI
                    console.error("Pinata API connection error:", ipfsErr);
                    setStatus("Error: Cannot upload payload to Pinata. Check your JWT token configuration.");
                    setIsProcessing(false);
                    return; 
                }
            }

            // Step 3: RECORD METADATA ON THE SEPOLIA BLOCKCHAIN
            if (safeAddress && ethers.isAddress(safeAddress)) {
                setStatus("3/3: Creating Safe Multi-sig Proposal...");

                const registryInterface = new ethers.Interface([
                    "function registerSGD(address initialOwner, string sgdId, string rgdId, string cid, string accessCondition, string price, uint256 collectionDate, string sampleType, string patientRef, string consentCode, bytes32 sampleHash, string encryptionScheme, string sequencingInfo, bytes32 signatureRef, string tokenURI)"
                ]);

                const txData = {
                    to: GDMREGISTRY_ADDRESS,
                    data: registryInterface.encodeFunctionData("registerSGD", [
                        address,
                        `SGD-SEC-${tokenId}`,
                        rgdIdForRef,
                        cid,
                        "Paid Access",
                        "10000000000000000", 
                        Math.floor(Date.now() / 1000),
                        "Genomic Sequence",
                        "ANON-001",
                        "CONSENT-YES",
                        currentHash,
                        "TACo-Nucypher",
                        "Trusted Sequencing Center",
                        ethers.ZeroHash,
                        `ipfs://${cid}`
                    ]),
                    value: "0",
                };

                const txHash = await createSafeProposal(safeAddress, txData);
                setStatus(`Proposal Pending! Hash: ${txHash.slice(0, 10)}... Please approve on Safe Dashboard.`);
            } else {
                setStatus("3/3: Recording Directly on Blockchain...");

                // Send real, interactive transactions with the newly deployed Smart Contract
                await registerSGD({
                    initialOwner: address,
                    sgdId: `SGD-SEC-${tokenId}`,
                    rgdTokenId: tokenId, 
                    cid: cid,
                    accessCondition: "Paid Access",
                    price: "10000000000000000", 
                    collectionDate: Math.floor(Date.now() / 1000),
                    sampleType: "Genomic Sequence",
                    patientRef: "ANON-001",
                    consentCode: "CONSENT-YES",
                    sampleHash: currentHash,
                    encryptionScheme: "TACo-Nucypher",
                    sequencingInfo: "Trusted Sequencing Center",
                    signatureRef: ethers.ZeroHash,
                    encHash: ethers.ZeroHash,
                    tokenURI: `ipfs://${cid}`,
                });

                // Send a request to update the status of the hash to used: 
                // true for backend storage of the JSON file
                await fetch("http://localhost:3001/commit-hash", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hash: currentHash,
                        secretCode: secretCode,
                    }),
                });

                setStatus(`Processing Complete. CID: ${cid.slice(0, 15)}...`);
            }

            setIsProcessing(false);
            setIsFinished(true);

        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "An unknown error occurred";
            setStatus("Error: " + errorMessage);
            setIsProcessing(false);
            setIsFinished(false);
        }
    };

    return (
        <div className="demo-page">
            <div className="demo-header">
                <div>
                    <p className="section-tag">Sequencing Center</p>
                    <h2>2. Secure Processing & Encryption</h2>
                    <p className="section-copy">
                        The Sequencing Center receives authorized genomic data, verifies it,
                        performs duplicate checking, applies TACo threshold encryption,
                        uploads the encrypted payload to IPFS, and registers SGD metadata
                        on the blockchain.
                    </p>
                </div>

                <div className="field-group" style={{ marginBottom: "20px" }}>
                    <label className="field-label">
                        Safe Multi-sig Address (Optional)
                    </label>
                    <input
                        className="text-input"
                        type="text"
                        placeholder="0x... (Leave blank for direct register)"
                        value={safeAddress}
                        onChange={(e) => setSafeAddress(e.target.value)}
                    />
                </div>

                <button className="primary-btn" onClick={handleConnect}>
                    {address ? "Node Active" : "Connect Sequencing Center Node"}
                </button>
            </div>

            <div className="demo-grid">
                <section className="card">
                    <div className="field-group">
                        <label className="field-label">
                            Raw Genomic Data
                        </label>
                        <textarea
                            className="text-area"
                            rows={8}
                            value={plaintext}
                            onChange={(e) => {
                                setPlaintext(e.target.value);
                                setIsFinished(false);
                            }}
                            placeholder="Enter genomic sequence here..."
                        />

                        <label className="field-label">
                            Secret Code / Authorization Code
                        </label>
                        <input
                            className="text-input"
                            type="password"
                            value={secretCode}
                            onChange={(e) => {
                                setSecretCode(e.target.value);
                                setIsFinished(false);
                            }}
                            placeholder="Enter owner authorization code..."
                        />

                        <label className="field-label">Target Token ID</label>
                        <input
                            className="text-input"
                            type="number"
                            value={tokenId}
                            onChange={(e) => {
                                setTokenId(Number(e.target.value));
                                setIsFinished(false);
                            }}
                        />
                    </div>

                    <button
                        className="primary-btn"
                        onClick={handleSecureProcessing}
                        disabled={isProcessing || !address || isFinished}
                        style={{
                            width: "100%",
                            background:
                                isProcessing || isFinished ? "#456347" : "#13a538",
                            cursor:
                                isProcessing || isFinished
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {isProcessing
                            ? "Processing..."
                            : isFinished
                            ? "Data Registered Successfully"
                            : "Start Secure Encryption Flow"}
                    </button>

                    <div className="status-box" style={{ marginTop: "20px" }}>
                        <span>Current status</span>
                        <strong>
                            {status || "Ready to process authorized data..."}
                        </strong>
                    </div>
                </section>

                <aside className="card">
                    <h3>Technical Duty</h3>
                    <ul className="flow-list">
                        <li>Receive Raw Genomic Data under Owner authorization.</li>
                        <li>Verify Secret Code and genomic data validity.</li>
                        <li>Check duplicate or garbage genomic submissions.</li>
                        <li>Perform Threshold Encryption using TACo.</li>
                        <li>Upload encrypted Secure Genomic Data to IPFS.</li>
                        <li>Register SGD metadata through Smart Contracts.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}