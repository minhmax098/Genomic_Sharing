// generate data package, set access condition, and send to server
import { initialize, encrypt, domains, conditions, } from "@nucypher/taco";
import { Web3Provider, JsonRpcProvider, type ExternalProvider, } from "@ethersproject/providers";

const encoder = new TextEncoder();
let tacoInitialized = false;

// Byte to Hex string
const toHexString = (bytes: Uint8Array) => 
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

async function ensureTacoInitialized() {
    if (!tacoInitialized) {
        await initialize();
        tacoInitialized = true;
    }
}

// set the lock (access condtion)
// encrypt the plaintext, return the encrypted data (messageKit) as Hex string
function buildBuyerAccessCondition(tokenId: number, registryAddress: string) {
    const conditionChainId = 11155111; // Sepolia chain ID
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
            value: 1,
        },
    });
}

// Encrypted function returns String (Hex) instead Object
export async function tacoEncryptPlaintext(params: {
        plaintext: string;
        registryAddress: string;
        tokenId: number;
        ritualId?: number;
    }): Promise<{ messageKit: string }> { 
    
    const { plaintext, registryAddress, tokenId } = params;
    const ritualId = Number(params.ritualId ?? import.meta.env.VITE_TACO_RITUAL_ID ?? "0");

    if (!ritualId) {
        throw new Error("Missing VITE_TACO_RITUAL_ID");
    }

    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    await ensureTacoInitialized();
    // use web3Provider to obtain the owner's signature to prove ownership.
    const web3Provider = new Web3Provider(window.ethereum as unknown as ExternalProvider);
    // jsonRpcProvider points to Amoy (Polygon) network for covert communication with the TACo network.
    const tacoNodeProvider = new JsonRpcProvider("https://rpc-amoy.polygon.technology/");

    type TacoEncryptProvider = Parameters<typeof encrypt>[0];
    type TacoEncryptSigner = Parameters<typeof encrypt>[5];
    // encrypt() to hash the data along with the Access Conditions
    // create a secure block called MessageKit.
    const accessCondition = buildBuyerAccessCondition(tokenId, registryAddress);
    const plaintextBytes = encoder.encode(plaintext);
    const signer = web3Provider.getSigner() as unknown as TacoEncryptSigner;

    const messageKit = await encrypt(
        tacoNodeProvider as unknown as TacoEncryptProvider,
        domains.TESTNET,
        plaintextBytes,
        accessCondition,
        ritualId,
        signer
    );

    // used to compress the entire data block into a completely secure text string (Hex string)
    // wrap it in JSON, and return it.
    const hexString = toHexString(messageKit.toBytes());
    console.log("The owner has encoded it into Hex:", hexString.substring(0, 40) + "...");
    return { messageKit: hexString };
}