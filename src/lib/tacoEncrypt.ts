import {
    initialize,
    encrypt,
    domains,
    conditions,
} from "@nucypher/taco";
import { BrowserProvider, JsonRpcProvider } from "ethers";

const encoder = new TextEncoder();

let tacoInitialized = false;

async function ensureTacoInitialized() {
    if (!tacoInitialized) {
        await initialize();
        tacoInitialized = true;
    }
}

function buildBuyerAccessCondition(tokenId: number, registryAddress: string) {
    const conditionChainId = Number(
        import.meta.env.VITE_TACO_CONDITION_CHAIN_ID || "97"
    );

    // NOTE:
    // Depending on the exact taco-web version, the ContractCondition constructor
    // namespace may differ slightly. If TypeScript complains here, check the
    // installed package exports / examples folder and adjust this one line.
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
            comparator: "=",
            value: "1",
        },
    });
}

export async function tacoEncryptPlaintext(params: {
    walletProvider: BrowserProvider;
    plaintext: string;
    registryAddress: string;
    tokenId: number;
    ritualId?: number;
}) {
    const { walletProvider, plaintext, registryAddress, tokenId } = params;

    const ritualId = Number(
        params.ritualId ?? import.meta.env.VITE_TACO_RITUAL_ID ?? "0"
    );

    if (!ritualId) {
        throw new Error("Missing VITE_TACO_RITUAL_ID");
    }

    const rpcUrl = import.meta.env.VITE_TACO_RPC_URL;
    if (!rpcUrl) {
        throw new Error("Missing VITE_TACO_RPC_URL");
    }

    await ensureTacoInitialized();

    const signer = await walletProvider.getSigner();
    const rpcProvider = new JsonRpcProvider(rpcUrl);
    const plaintextBytes = encoder.encode(plaintext);

    const accessCondition = buildBuyerAccessCondition(tokenId, registryAddress);

    // NOTE:
    // Some taco-web versions slightly change the encrypt() signature.
    // If your installed version complains, let TypeScript intellisense guide
    // the parameter order for your package version.
    const messageKit = await encrypt(
        rpcProvider,
        domains.TESTNET,
        plaintextBytes,
        accessCondition,
        ritualId,
        signer
    );

    return messageKit;
}