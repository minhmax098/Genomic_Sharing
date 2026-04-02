import { BrowserProvider, type Eip1193Provider } from "ethers";

type ProviderRpcError = {
    code: number;
    message?: string;
};

function isProviderRpcError(error: unknown): error is ProviderRpcError {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as ProviderRpcError).code === "number"
    );
}

declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}

export async function getBrowserProvider() {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
    const provider = await getBrowserProvider();
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
}

export async function getCurrentWalletAddress() {
    const provider = await getBrowserProvider();
    const signer = await provider.getSigner();
    return await signer.getAddress();
}

export async function switchToSepolia() {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    const chainIdHex = "0xaa36a7";

    try {
        await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
        });
    } catch (error: unknown) {
        if (isProviderRpcError(error) && error.code === 4902) {
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
            {
                chainId: chainIdHex,
                chainName: "Sepolia",
                nativeCurrency: {
                name: "SepoliaETH",
                symbol: "ETH",
                decimals: 18,
                },
                rpcUrls: [import.meta.env.VITE_RPC_URL],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
            ],
        });
        } else {
        throw error;
        }
    }
}