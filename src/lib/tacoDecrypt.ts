// import {
//     initialize,
//     decrypt,
//     domains,
//     conditions,
//     ThresholdMessageKit,
// } from "@nucypher/taco";
// import {
//     EIP4361AuthProvider,
//     USER_ADDRESS_PARAM_DEFAULT,
// } from "@nucypher/taco-auth";
// import {
//     Web3Provider,
//     type ExternalProvider,
// } from "@ethersproject/providers";

// let tacoInitialized = false;

// async function ensureTacoInitialized() {
//     if (!tacoInitialized) {
//         await initialize();
//         tacoInitialized = true;
//     }
// }

// export async function tacoDecryptToBytes(params: {
//     messageKit: ThresholdMessageKit;
// }) {
//     const { messageKit } = params;

//     if (!window.ethereum) {
//         throw new Error("MetaMask is not installed");
//     }

//     await ensureTacoInitialized();

//     const web3Provider = new Web3Provider(
//         window.ethereum as unknown as ExternalProvider
//     );

//     type TacoAuthProviderArg0 = ConstructorParameters<typeof EIP4361AuthProvider>[0];
//     type TacoAuthProviderArg1 = ConstructorParameters<typeof EIP4361AuthProvider>[1];
//     type TacoDecryptProvider = Parameters<typeof decrypt>[0];

//     const signer = web3Provider.getSigner() as unknown as TacoAuthProviderArg1;

//     const authProvider = new EIP4361AuthProvider(
//         web3Provider as unknown as TacoAuthProviderArg0,
//         signer
//     );

//     const conditionContext =
//         conditions.context.ConditionContext.fromMessageKit(messageKit);

//     conditionContext.addAuthProvider(
//         USER_ADDRESS_PARAM_DEFAULT,
//         authProvider
//     );

//     const decryptedBytes = await decrypt(
//         web3Provider as unknown as TacoDecryptProvider,
//         domains.TESTNET,
//         messageKit,
//         conditionContext
//     );

//     return decryptedBytes;
// }

// export async function tacoDecryptToString(params: {
//     messageKit: ThresholdMessageKit;
// }) {
//     const bytes = await tacoDecryptToBytes(params);
//     return new TextDecoder().decode(bytes);
// }

import {
    initialize,
    decrypt,
    domains,
    conditions,
    ThresholdMessageKit,
} from "@nucypher/taco";
import {
    EIP4361AuthProvider,
    USER_ADDRESS_PARAM_DEFAULT,
} from "@nucypher/taco-auth";
import {
    Web3Provider,
    JsonRpcProvider, // Thêm JsonRpcProvider
    type ExternalProvider,
} from "@ethersproject/providers";

let tacoInitialized = false;

async function ensureTacoInitialized() {
    if (!tacoInitialized) {
        await initialize();
        tacoInitialized = true;
    }
}

export async function tacoDecryptToBytes(params: {
    messageKit: ThresholdMessageKit;
}) {
    const { messageKit } = params;

    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    await ensureTacoInitialized();

    // 1. Provider ví người dùng (Sepolia) dùng để yêu cầu ký tên xác thực
    const web3Provider = new Web3Provider(
        window.ethereum as unknown as ExternalProvider
    );

    // 2. Provider kết nối mạng Amoy để TACo nhận dữ liệu giải mã
    const tacoNodeProvider = new JsonRpcProvider("https://rpc-amoy.polygon.technology/");

    type TacoAuthProviderArg0 = ConstructorParameters<typeof EIP4361AuthProvider>[0];
    type TacoAuthProviderArg1 = ConstructorParameters<typeof EIP4361AuthProvider>[1];
    type TacoDecryptProvider = Parameters<typeof decrypt>[0];

    const signer = web3Provider.getSigner() as unknown as TacoAuthProviderArg1;

    // authProvider vẫn dùng web3Provider vì MetaMask là người ký
    const authProvider = new EIP4361AuthProvider(
        web3Provider as unknown as TacoAuthProviderArg0,
        signer
    );

    const conditionContext =
        conditions.context.ConditionContext.fromMessageKit(messageKit);

    conditionContext.addAuthProvider(
        USER_ADDRESS_PARAM_DEFAULT,
        authProvider
    );

    // Truyền tacoNodeProvider vào hàm decrypt
    const decryptedBytes = await decrypt(
        tacoNodeProvider as unknown as TacoDecryptProvider,
        domains.TESTNET,
        messageKit,
        conditionContext
    );

    return decryptedBytes;
}

export async function tacoDecryptToString(params: {
    messageKit: ThresholdMessageKit;
}) {
    const bytes = await tacoDecryptToBytes(params);
    return new TextDecoder().decode(bytes);
}