// import {
//     initialize,
//     encrypt,
//     domains,
//     conditions,
//     ThresholdMessageKit,
// } from "@nucypher/taco";
// import {
//     Web3Provider,
//     type ExternalProvider,
// } from "@ethersproject/providers";

// const encoder = new TextEncoder();

// let tacoInitialized = false;

// async function ensureTacoInitialized() {
//     if (!tacoInitialized) {
//         await initialize();
//         tacoInitialized = true;
//     }
// }

// function buildBuyerAccessCondition(tokenId: number, registryAddress: string) {
//     const conditionChainId = Number(
//         import.meta.env.VITE_TACO_CONDITION_CHAIN_ID || "97"
//     );

//     return new conditions.base.contract.ContractCondition({
//         contractAddress: registryAddress,
//         chain: conditionChainId,
//         method: "tacoCanDecrypt",
//         functionAbi: {
//         name: "tacoCanDecrypt",
//         type: "function",
//         stateMutability: "view",
//         inputs: [
//             { internalType: "uint256", name: "tokenId", type: "uint256" },
//             { internalType: "address", name: "user", type: "address" },
//         ],
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         },
//         parameters: [tokenId, ":userAddress"],
//         returnValueTest: {
//         comparator: "==",
//         value: "1",
//         },
//     });
// }

// export async function tacoEncryptPlaintext(params: {
//     plaintext: string;
//     registryAddress: string;
//     tokenId: number;
//     ritualId?: number;
//     }): Promise<ThresholdMessageKit> {
//     const { plaintext, registryAddress, tokenId } = params;

//     const ritualId = Number(
//         params.ritualId ?? import.meta.env.VITE_TACO_RITUAL_ID ?? "0"
//     );

//     if (!ritualId) {
//         throw new Error("Missing VITE_TACO_RITUAL_ID");
//     }

//     if (!window.ethereum) {
//         throw new Error("MetaMask is not installed");
//     }

//     await ensureTacoInitialized();

//     const web3Provider = new Web3Provider(
//         window.ethereum as unknown as ExternalProvider
//     );

//     type TacoEncryptProvider = Parameters<typeof encrypt>[0];
//     type TacoEncryptSigner = Parameters<typeof encrypt>[5];

//     const accessCondition = buildBuyerAccessCondition(tokenId, registryAddress);
//     const plaintextBytes = encoder.encode(plaintext);

//     const signer = web3Provider.getSigner() as unknown as TacoEncryptSigner;

//     const messageKit = await encrypt(
//         web3Provider as unknown as TacoEncryptProvider,
//         domains.TESTNET,
//         plaintextBytes,
//         accessCondition,
//         ritualId,
//         signer
//     );

//     return messageKit;
// }
import {
    initialize,
    encrypt,
    domains,
    conditions,
    ThresholdMessageKit,
} from "@nucypher/taco";
import {
    Web3Provider,
    JsonRpcProvider, // Thêm JsonRpcProvider
    type ExternalProvider,
} from "@ethersproject/providers";

const encoder = new TextEncoder();

let tacoInitialized = false;

async function ensureTacoInitialized() {
    if (!tacoInitialized) {
        await initialize();
        tacoInitialized = true;
    }
}

function buildBuyerAccessCondition(tokenId: number, registryAddress: string) {
    // Ép cứng Chain ID của Sepolia để TACo biết phải quét mạng nào
    const conditionChainId = 11155111;

    return new conditions.base.contract.ContractCondition({
        contractAddress: registryAddress,
        chain: conditionChainId,
        method: "tacoCanDecrypt",
        functionAbi: {
        name: "tacoCanDecrypt",
        type: "function",
        stateMutability: "view",
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "address", name: "user", type: "address" },
        ],
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        },
        parameters: [tokenId, ":userAddress"],
        returnValueTest: {
        comparator: "==",
        value: "1",
        },
    });
}

export async function tacoEncryptPlaintext(params: {
    plaintext: string;
    registryAddress: string;
    tokenId: number;
    ritualId?: number;
    }): Promise<ThresholdMessageKit> {
    const { plaintext, registryAddress, tokenId } = params;

    // Đảm bảo bạn đã đặt VITE_TACO_RITUAL_ID=6 trong file .env
    const ritualId = Number(
        params.ritualId ?? import.meta.env.VITE_TACO_RITUAL_ID ?? "0"
    );

    if (!ritualId) {
        throw new Error("Missing VITE_TACO_RITUAL_ID");
    }

    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    await ensureTacoInitialized();

    // 1. Provider kết nối với ví của người dùng (Đang ở Sepolia)
    const web3Provider = new Web3Provider(
        window.ethereum as unknown as ExternalProvider
    );

    // 2. Provider KẾT NỐI NGẦM với Polygon Amoy để lấy dữ liệu từ TACo Coordinator
    const tacoNodeProvider = new JsonRpcProvider("https://rpc-amoy.polygon.technology/");

    type TacoEncryptProvider = Parameters<typeof encrypt>[0];
    type TacoEncryptSigner = Parameters<typeof encrypt>[5];

    const accessCondition = buildBuyerAccessCondition(tokenId, registryAddress);
    const plaintextBytes = encoder.encode(plaintext);

    const signer = web3Provider.getSigner() as unknown as TacoEncryptSigner;

    // Sử dụng tacoNodeProvider thay vì web3Provider
    const messageKit = await encrypt(
        tacoNodeProvider as unknown as TacoEncryptProvider,
        domains.TESTNET,
        plaintextBytes,
        accessCondition,
        ritualId,
        signer
    );

    return messageKit;
}