import axios from 'axios';
const JWT = import.meta.env.VITE_PINATA_JWT;

// function uploads encrypted files from TACo
export const uploadEncryptedToIPFS = async (data: Blob | File, fileName: string) => {
    const formData = new FormData();
    formData.append('file', data, fileName);

    // metadata: manage on dashboard Pinata
    const metadata = JSON.stringify({
        name: `SGD_${fileName}`,
    });

    formData.append('pinataMetadata', metadata);

    try {
        const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return res.data.IpfsHash;  // return CID 
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
};

// function to retrieve data from IPFS for Buyer
export const fetchFromIPFS = async (cid: string) => {
    try {
        const url = `${import.meta.env.VITE_IPFS_GATEWAY_URL}/${cid}`;
        const respond = await axios.get(url, { responseType: 'blob' });
        return respond.data;  // return the file as a Blob to put TACo decrypt
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        throw error;
    }
};