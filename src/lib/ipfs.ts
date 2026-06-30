// IPFS: upload and download encrypted data to/from IPFS (Pinata)
import axios from 'axios';

const JWT = import.meta.env.VITE_PINATA_JWT;

// Upload encrypted data to IPFS (Pinata)
export const uploadEncryptedToIPFS = async (data: Blob | File, fileName: string) => {
    console.log("Check the current JWT token in the code.:", JWT ? "Received (OK)" : "UNDEFINED (Error!)");
    if (!JWT) {
        throw new Error("CONFIGURATION ERROR: Application failed to read VITE_PINATA_JWT from .env file. Please restart the dev server!");
    }
    
    const formData = new FormData();
    
    // Transform a Blob into a file object with clear JSON format
    const fileToUpload = data instanceof File 
        ? data 
        : new File([data], fileName, { type: "application/json" });
        
    // SYNCHRONIZATION: pass fileName as the third parameter so that Axios retains the filename header sent to Pinata.
    formData.append('file', fileToUpload, fileName);

    const metadata = JSON.stringify({
        name: `SGD_${fileName}`,
    });
    formData.append('pinataMetadata', metadata);

    try {
        // Call the official Pinata endpoint.
        const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        // Returns the actual CID string (Qm...) from Pinata Cloud
        return res.data.IpfsHash; 
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
};

// Fetch data from IPFS for Buyer
export const fetchFromIPFS = async (cid: string) => {
    try {
        // 1. Get gateway from .env, if it fails then use the default of Pinata for demo purposes
        const gateway = import.meta.env.VITE_IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";
        
        // 2. Check the validity of the CID
        if (!cid || typeof cid !== 'string' || (!cid.startsWith('Qm') && !cid.startsWith('ba'))) {
            console.error("❌ ERROR: Invalid CID. Received value:", cid);
            throw new Error(`Invalid CID (received: ${cid}). Please check the index in the record array.`);
        }

        // 3. URL normalization (handling redundant slashes)
        const baseUrl = gateway.replace(/\/$/, ''); 
        const url = `${baseUrl}/${cid}`;
        
        console.log("Fetching from IPFS URL:", url);

        const respond = await axios.get(url, { 
            responseType: 'blob',
            timeout: 15000 // 15s
        });

        return respond.data; 
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        throw error;
    }
};