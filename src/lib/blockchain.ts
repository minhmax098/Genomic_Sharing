// Owner: call registerSGD(): save IPFS CID on-chain
// Buyer: call getPublicRecord(): watch price and see general info 
// Buyer: call purchaseFullAccess(): pay to buy access
// Buyer: call getCID(): get CID after purchase, then fetch from IPFS and decrypt
import { Contract, type InterfaceAbi } from "ethers";
import registryArtifact from "../abi/GDMRegistry.json";
import nftArtifact from "../abi/SGDNFT.json";
import contractAddresses from "../config/contract-addresses.json";
import { connectWallet, getBrowserProvider } from "./wallet";

type ContractAddresses = {
    GDMREGISTRY_ADDRESS: string;
    SGDNFT_ADDRESS: string;
    RGDNFT_ADDRESS: string;
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

const RGDNFT_ADDRESS =
    import.meta.env.VITE_RGDNFT_ADDRESS ||
    addresses.RGDNFT_ADDRESS;

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

    // 1. Read info directly from Smart Contract
    const publicRecord = await registry.getPublicRecord(tokenId);

    // 2. Get the exact price that the contract is listing
    // if contract uses struct, index 5 is 'price'
    const exactPrice = publicRecord.price || publicRecord[5];

    if (!exactPrice || exactPrice.toString() === "0") {
        throw new Error("Could not determine the price for this Token ID");
    }

    // 3. Send purchase transaction
    const tx = await registry.purchaseFullAccess(tokenId, {
        value: exactPrice,
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
        RGDNFT_ADDRESS,
    };
}

// register new genomic data records on the Blockchain 
export async function registerSGD(input: {
    initialOwner: string;
    sgdId: string;
    rgdId: string;
    cid: string;    // CID is passed here from IPFS 
    accessCondition: string;
    price: string;  // ETH -> Wei
    collectionDate: number;
    sampleType: string;
    patientRef: string;
    consentCode: string;
    sampleHash: string;
    encryptionScheme: string;
    sequencingInfo: string;
    signatureRef: string;
    encHash: string;
    tokenURI: string;
}) {
    const registry = await getRegistryWriteContract();
    const { parseEther } = await import("ethers");

    // convert price from ETH to Wei
    const priceInWei = parseEther(input.price);

    // call function on the SMC
    const tx = await registry.registerSGD({
        ...input, 
        price: priceInWei,
    });

    await tx.wait();
    return tx.hash;
}

// Get CID from the Blockchain (owner or bought can access)
export async function getCID(tokenId: number) {
    const { signer, address } = await connectWallet();
    // 1. Contract Registry to get CID and check Purchase
    const registry = new Contract(GDMREGISTRY_ADDRESS, registryAbi, signer);
    // 2. Contract NFT to check ownership (Fix error here)
    const nft = new Contract(SGDNFT_ADDRESS, nftAbi, signer);
    
    try {
        // Check if purchased or not.
        const purchased = await registry.hasPurchased(tokenId, address);
        
        if (!purchased) {
            // Check if NFT owner or not
            // Call nft.ownerOf instead registry.ownerOf
            const owner = await nft.ownerOf(tokenId).catch(() => "");
            
            if (owner.toLowerCase() !== address.toLowerCase()) {
                throw new Error("You do not have access to CID. Please purchase access first.");
            }
        }

        // If valid, fetch CID
        const cid = await registry.getCID(tokenId);
        return cid;

    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("ownerOf")) {
            throw new Error("Token ID does not exist or NFT contract error.");
        }
        throw error;
    }
}