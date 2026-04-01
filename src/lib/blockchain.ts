import { Contract, type InterfaceAbi } from "ethers";
import registryArtifact from "../abi/GDMRegistry.json";
import nftArtifact from "../abi/SGDNFT.json";
import contractAddresses from "../config/contract-addresses.json";
import { connectWallet, getBrowserProvider } from "./wallet";

type ContractAddresses = {
    GDMREGISTRY_ADDRESS: string;
    SGDNFT_ADDRESS: string;
    network?: string;
};

type ArtifactWithAbi = {
    abi: InterfaceAbi;
};

function hasAbi(value: unknown): value is ArtifactWithAbi {
    return typeof value === "object" && value !== null && "abi" in value;
}

function getAbi(value: unknown): InterfaceAbi {
    if (hasAbi(value)) {
        return value.abi;
    } 

    if (Array.isArray(value)) {
        return value as InterfaceAbi;
    }

    throw new Error("Failed to extract ABI from artifact");
}

const addresses = contractAddresses as ContractAddresses;

const GDMREGISTRY_ADDRESS =
    import.meta.env.VITE_GDMREGISTRY_ADDRESS ||
    addresses.GDMREGISTRY_ADDRESS;

const SGDNFT_ADDRESS =
    import.meta.env.VITE_SGDNFT_ADDRESS ||
    addresses.SGDNFT_ADDRESS;

const registryAbi = getAbi(registryArtifact);

const nftAbi = getAbi(nftArtifact);

export async function getRegistryReadContract() {
    const provider = await getBrowserProvider();
    return new Contract(GDMREGISTRY_ADDRESS, registryAbi, provider);
}

export async function getRegistryWriteContract() {
    const { signer } = await connectWallet();
    return new Contract(GDMREGISTRY_ADDRESS, registryAbi, signer);
}

export async function getNftReadContract() {
    const provider = await getBrowserProvider();
    return new Contract(SGDNFT_ADDRESS, nftAbi, provider);
}

export async function getNftWriteContract() {
    const { signer } = await connectWallet();
    return new Contract(SGDNFT_ADDRESS, nftAbi, signer);
}

export async function getPublicRecord(tokenId: number) {
    const registry = await getRegistryReadContract();
    return registry.getPublicRecord(tokenId);
}

export async function hasPurchased(tokenId: number, buyer: string) {
    const registry = await getRegistryReadContract();
    return registry.hasPurchased(tokenId, buyer);
}

export async function purchaseFullAccess(tokenId: number) {
    const registry = await getRegistryWriteContract();

    const publicRecord = await registry.getPublicRecord(tokenId);
    const price = publicRecord.price;

    const tx = await registry.purchaseFullAccess(tokenId, {
        value: price,
    });

    await tx.wait();
    return tx.hash;
}

export async function getTokenOwner(tokenId: number) {
    const nft = await getNftReadContract();
    return nft.ownerOf(tokenId);
}

// Prepare for TACo next phase 
export async function tacoCanDecrypt(tokenId: number, user: string) {
    const registry = await getRegistryReadContract();

    if (typeof registry.tacoCanDecrypt !== "function") {
        throw new Error("tacoCanDecrypt() is not available in current contract");
    }

    return registry.tacoCanDecrypt(tokenId, user);
}

export function getContractAddresses() {
    return {
        GDMREGISTRY_ADDRESS,
        SGDNFT_ADDRESS,
    };
}