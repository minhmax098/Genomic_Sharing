// // owner page
// import { useState, type ChangeEvent } from "react";
// import { connectWallet, switchToSepolia } from "../lib/wallet";
// import { getContractAddresses } from "../lib/blockchain";
// import { tacoEncryptPlaintext } from "../lib/tacoEncrypt";
// import { uploadEncryptedToIPFS } from "../lib/ipfs";
// import { registerSGD } from "../lib/blockchain";

// type ErrorWithMessage = {
//     message?: string;
// };

// function getErrorMessage(error: unknown, fallback: string) {
//     if (typeof error === "object" && error !== null && "message" in error) {
//         return (error as ErrorWithMessage).message || fallback;
//     }

//     return fallback;
// }

// export default function OwnerDemo() {
//     const [address, setAddress] = useState("");
//     const [plaintext, setPlaintext] = useState("Hello SGD from Owner A");
//     const [selectedFileName, setSelectedFileName] = useState("");
//     const [status, setStatus] = useState("");
//     const [tokenId, setTokenId] = useState(1);
//     const [messageKitReady, setMessageKitReady] = useState(false);

//     const { GDMREGISTRY_ADDRESS, SGDNFT_ADDRESS } = getContractAddresses();

//     const handleConnect = async () => {
//         try {
//             await switchToSepolia();
//             const { address } = await connectWallet();
//             setAddress(address);
//             setStatus("Owner wallet connected");
//         } catch (error: unknown) {
//             setStatus(getErrorMessage(error, "Failed to connect owner wallet"));
//         }
//     };

//     const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         setSelectedFileName(file ? file.name : "");
//     };

//     const handlePrepareTacoEncrypt = async () => {
//         try {
//             if (!address) {
//                 setStatus("Connect owner wallet first");
//                 return;
//             }

//             // 1. Encrypt (TACo)
//             setStatus("1. Encrypting genomic data with TACo...");
//             const kit = await tacoEncryptPlaintext({
//                 plaintext,
//                 registryAddress: GDMREGISTRY_ADDRESS,
//                 tokenId,
//             });

//             // 2. Upload encrypted data to IPFS (Pinata)
//             setStatus("2. Uploading encrypted data to IPFS...");
//             // Convert kit (Object) to Blob for upload file JSON
//             const kitBlob = new Blob([JSON.stringify(kit)], { type: "application/json" });
//             const fileName = `genomic_data_token_${tokenId}.taco`;
            
//             const cid = await uploadEncryptedToIPFS(kitBlob, fileName);
//             console.log("IPFS CID:", cid);

//             // 3. Register SGD on-chain with CID (Blockchain SMC)
//             setStatus("3. Registering SGD on-chain...");
//             // data insistent with RegisterInput
//             await registerSGD({
//                 initialOwner: address,
//                 sgdId: `SGD-${tokenId}-${Date.now().toString().slice(-4)}`,
//                 rgdId: "RGD-PRIMARY",
//                 cid: cid,    // CID from IPFS upload
//                 accessCondition: `Owner or Paid buyer`,
//                 price: "0.01",   // 0.01 ETH
//                 collectionDate: Math.floor(Date.now() / 1000),
//                 sampleType: "Genomic Sequence",
//                 patientRef: "ANON-001",
//                 consentCode: "CONSENT-YES",
//                 sampleHash: "0x" + "0".repeat(40),  // Mock hash, should be real hash of the sample
//                 encryptionScheme: "TACo-Nucypher",
//                 sequencingInfo: "Illumina Hiseq",
//                 signatureRef: "0x" + "0".repeat(40),  // Mock signature reference
//                 encHash: "0x" + "0".repeat(40),  // Mock hash of the encrypted data, can be generated from the kit
//                 tokenURI: `https://gateway.pinata.cloud/ipfs/${cid}`,  // Optional: can point to the IPFS JSON directly
//             });

//             setMessageKitReady(true);
//             setStatus(`SGD registered on-chain with TACo-encrypted data: ${cid.slice(0, 10)}...`);

//         } catch (error: unknown) {
//             setStatus(getErrorMessage(error, "Failed to prepare TACo encryption"));
//         }
//     };

//     const handleResetUI = () => {
//         setMessageKitReady(false);
//         setStatus("UI state reset. Ready for new TACo encryption.");
//         setSelectedFileName("");
//     };

//     return (
//         <div className="demo-page">
//             <div className="demo-header">
//                 <div>
//                     <p className="section-tag">Owner workspace</p>
//                     <h2>Prepare encrypted SGD package</h2>
//                     <p className="section-copy">
//                         Connect the Data Owner's wallet, select a target Token ID, and initiate TACo Threshold Encryption. 
//                         The resulting encrypted genomic payload is then securely uploaded to IPFS via Pinata, 
//                         ensuring decentralized and immutable data availability.
//                     </p>
//                 </div>

//                 <button className="primary-btn" onClick={handleConnect}>
//                     {address ? "Wallet Connected" : "Connect Wallet"}
//                 </button>
//             </div>

//             <div className="info-grid">
//                 <div className="info-card">
//                     <span>Owner address</span>
//                     <strong className="mono-text">{address || "Not connected"}</strong>
//                 </div>

//                 <div className="info-card">
//                     <span>GDMRegistry</span>
//                     <strong className="mono-text">{GDMREGISTRY_ADDRESS}</strong>
//                 </div>

//                 <div className="info-card">
//                     <span>SGDNFT</span>
//                     <strong className="mono-text">{SGDNFT_ADDRESS}</strong>
//                 </div>
//             </div>

//             <div className="demo-grid">
//                 <section className="card">
//                     <div className="field-group">
//                         <label className="field-label">Token ID</label>
//                         <input
//                             className="text-input"
//                             type="number"
//                             value={tokenId}
//                             onChange={(e) => setTokenId(Number(e.target.value))}
//                         />
//                     </div>

//                 <div className="field-group">
//                     <label className="field-label">Demo Plaintext</label>
//                     <textarea
//                         className="text-area"
//                         rows={6}
//                         value={plaintext}
//                         onChange={(e) => setPlaintext(e.target.value)}
//                     />
//                 </div>

//                 <div className="field-group">
//                     <label className="field-label">Select SGD File</label>
//                     <input className="text-input" type="file" onChange={handleFileChange} />
//                     <p className="helper-text">
//                         Selected file: {selectedFileName || "No file selected"}
//                     </p>
//                 </div>

//                 <div className="action-row">
//                     <button className="primary-btn" onClick={handlePrepareTacoEncrypt}>
//                         Prepare TACo Encrypt
//                     </button>
//                     <button className="secondary-btn" onClick={handleResetUI}>
//                         Clear Stored MessageKit
//                     </button>
//                 </div>

//                 <div className="status-stack">
//                     <div className="status-box">
//                         <span>Current status</span>
//                         <strong>{status || "Waiting for action"}</strong>
//                     </div>

//                     <div className={`pill ${messageKitReady ? "success" : "muted"}`}>
//                         {messageKitReady ? "MessageKit Ready" : "MessageKit Not Ready"}
//                     </div>
//                 </div>
//                 </section>

//                 <aside className="card">
//                     <h3>Planned TACo Decentralized Flow</h3>
//                     <ol className="flow-list">
//                         <li>Owner encrypts SGD using TACo policy</li>
//                         <li>Encrypted SGD is pinned to <strong>IPFS (Pinata)</strong></li>
//                         <li>Owner registers <strong>CID</strong> and metadata on Ethereum (Sepolia)</li>
//                         <li>Buyer purchases full access and retrieves CID from the SMC</li>
//                         <li>Buyer fetches payload from IPFS and decrypts via TACo</li>
//                     </ol>

//                     <div className="mini-note">
//                         This workflow is now fully decentralized. Data is stored on IPFS, 
//                         and access control is managed by the GDMRegistry Smart Contract.
//                     </div>
//                 </aside>
//             </div>
//         </div>
//     );
// }
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
        // Trong thực tế, đây có thể là một lệnh gọi API hoặc lưu vào local state
        // để Security Center tab có thể nhận diện.
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