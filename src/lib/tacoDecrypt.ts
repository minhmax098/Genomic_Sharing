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

    const web3Provider = new Web3Provider(
        window.ethereum as unknown as ExternalProvider
    );

    type TacoAuthProviderArg0 = ConstructorParameters<typeof EIP4361AuthProvider>[0];
    type TacoAuthProviderArg1 = ConstructorParameters<typeof EIP4361AuthProvider>[1];
    type TacoDecryptProvider = Parameters<typeof decrypt>[0];

    const signer = web3Provider.getSigner() as unknown as TacoAuthProviderArg1;

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

    const decryptedBytes = await decrypt(
        web3Provider as unknown as TacoDecryptProvider,
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