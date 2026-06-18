// IPFS: upload and download encrypted data to/from IPFS (Pinata)
import axios from 'axios';

const JWT = import.meta.env.VITE_PINATA_JWT;

// Upload encrypted data to IPFS (Pinata)
export const uploadEncryptedToIPFS = async (data: Blob | File, fileName: string) => {
    console.log("Kiểm tra Token JWT hiện tại trong code:", JWT ? "Đã nhận (OK)" : "Bị UNDEFINED (Lỗi rồi!)");
    if (!JWT) {
        throw new Error("LỖI CẤU HÌNH: Ứng dụng chưa đọc được VITE_PINATA_JWT từ file .env. Hãy khởi động lại server dev!");
    }
    
    const formData = new FormData();
    
    // Chuẩn hóa: Biến đổi Blob thành File object có định dạng JSON rõ ràng
    const fileToUpload = data instanceof File 
        ? data 
        : new File([data], fileName, { type: "application/json" });
        
    // 🛠️ ĐỒNG BỘ: Bắt buộc truyền fileName vào tham số thứ 3 để Axios giữ nguyên filename header gửi lên Pinata
    formData.append('file', fileToUpload, fileName);

    const metadata = JSON.stringify({
        name: `SGD_${fileName}`,
    });
    formData.append('pinataMetadata', metadata);

    try {
        // Gọi lên endpoint chính thức của Pinata
        const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        // Trả về chuỗi CID thật (Qm...) từ Pinata Cloud
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