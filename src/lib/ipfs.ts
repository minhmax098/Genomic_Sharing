// IPFS: upload and download encrypted data to/from IPFS (Pinata)
import axios from 'axios';

const JWT = import.meta.env.VITE_PINATA_JWT;

// Upload encrypted data to IPFS (Pinata)
// export const uploadEncryptedToIPFS = async (data: Blob | File, fileName: string) => {
//     const formData = new FormData();
    
//     // Pinata yêu cầu đặt tên field chính xác là 'file'
//     formData.append('file', data, fileName);

//     // Đóng gói metadata chuẩn cấu trúc API Pinata
//     const metadata = JSON.stringify({
//         name: `SGD_${fileName}`,
//     });
//     formData.append('pinataMetadata', metadata);

//     // Cấu hình options (Không bắt buộc nhưng giúp ghim file chặt chẽ)
//     const options = JSON.stringify({
//         cidVersion: 0,
//     });
//     formData.append('pinataOptions', options);

//     try {
//         // Sử dụng endpoint chuẩn cấu trúc Multipart Form
//         const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
//             headers: {
//                 'Authorization': `Bearer ${JWT}`,
//                 'Content-Type': 'multipart/form-data',
//             }
//         });
        
//         // Trả về chuỗi CID (Qm...)
//         return res.data.IpfsHash; 
//     } catch (error) {
//         console.error('Error uploading to IPFS:', error);
//         throw error;
//     }
// };

export const uploadEncryptedToIPFS = async (data: Blob | File, fileName: string) => {
    const formData = new FormData();
    
    // Tạo file cụ thể từ Blob kèm Content-Type rõ ràng để API Pinata phân tích chuẩn xác
    const fileToUpload = data instanceof File ? data : new File([data], fileName, { type: "application/json" });
    formData.append('file', fileToUpload);

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
        
        // 2. Check the validity of the CID (To prevent passing an invalid Address 0x... into the function)
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