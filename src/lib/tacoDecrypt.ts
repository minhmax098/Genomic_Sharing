// Download the Hex string, verify identity
// Request key fragments back from TACo, extract data
import { initialize, decrypt, domains, conditions, ThresholdMessageKit, } from "@nucypher/taco";
import { EIP4361AuthProvider, USER_ADDRESS_PARAM_DEFAULT, } from "@nucypher/taco-auth";
import { Web3Provider, JsonRpcProvider, type ExternalProvider, } from "@ethersproject/providers";

let tacoInitialized = false;

// Hex string from Server into Byte array
const fromHexString = (hexString: string) => 
    new Uint8Array((hexString.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16)));

async function ensureTacoInitialized() {
    if (!tacoInitialized) {
        await initialize();
        tacoInitialized = true;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tacoDecryptToBytes(params: any) {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    await ensureTacoInitialized();

    let messageKit: ThresholdMessageKit;
    try {
        console.log("1. Raw data input:", params);
        
        let extracted = params;
        
        if (extracted && extracted.messageKit !== undefined) {
            extracted = extracted.messageKit;
        }
        // if JSON string
        if (typeof extracted === 'string' && extracted.trim().startsWith('{')) {
            try 
                { 
                    extracted = JSON.parse(extracted);
                } 
            catch
                {
                    // console.warn("Not parse JSON, keep it:", e);
                }
        }
        // If parse return again object)
        if (extracted && extracted.messageKit !== undefined) {
            extracted = extracted.messageKit;
        }

        console.log("2. Data after stripping:", extracted);

        if (extracted instanceof ThresholdMessageKit) {
            messageKit = extracted;
        } else if (typeof extracted === 'string') {
            // Keep characters Hex (a-f, 0-9, A-F)
            const cleanHex = extracted.replace(/[^a-fA-F0-9]/g, '');
            console.log("3. Clean Hex string:", cleanHex.substring(0, 30) + "...");
            messageKit = ThresholdMessageKit.fromBytes(fromHexString(cleanHex));
        } else {
            // if still aray-like object
            const arr = Object.values(extracted).map(v => Number(v));
            messageKit = ThresholdMessageKit.fromBytes(new Uint8Array(arr));
        }
    } catch (error) {
        console.error("Error occurred while parsing MessageKit:", error);
        throw new Error("The MessageKit data from the server is in an invalid format!");
    }

    // 1. Provider wallet (Sepolia)
    const web3Provider = new Web3Provider(
        window.ethereum as unknown as ExternalProvider
    );

    // 2. Provider connects Amoy network (Polygon)
    const tacoNodeProvider = new JsonRpcProvider("https://rpc-amoy.polygon.technology/");

    // Request the Buyer's MetaMask to sign a standard EIP-4361 message.
    type TacoAuthProviderArg0 = ConstructorParameters<typeof EIP4361AuthProvider>[0];
    type TacoAuthProviderArg1 = ConstructorParameters<typeof EIP4361AuthProvider>[1];
    type TacoDecryptProvider = Parameters<typeof decrypt>[0];

    const signer = web3Provider.getSigner() as unknown as TacoAuthProviderArg1;

    const authProvider = new EIP4361AuthProvider(
        web3Provider as unknown as TacoAuthProviderArg0,
        signer
    );

    const conditionContext = conditions.context.ConditionContext.fromMessageKit(messageKit);

    conditionContext.addAuthProvider(
        USER_ADDRESS_PARAM_DEFAULT,
        authProvider
    );

    // It sends the MessageKit and authProvider signature to the TACo network (via the Amoy gateway). 
    // TACo nodes automatically scan SMC on Sepolia. 
    // When Buyer has actually paid (satisfying Access Conditions), send back key fragments. 
    // The browser automatically pieces these key fragments together and decrypts the original DNA sequence.
    const decryptedBytes = await decrypt(
        tacoNodeProvider as unknown as TacoDecryptProvider,
        domains.TESTNET,
        messageKit,
        conditionContext
    );

    return decryptedBytes;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tacoDecryptToString(params: any) {
    const bytes = await tacoDecryptToBytes(params);
    return new TextDecoder().decode(bytes);
}