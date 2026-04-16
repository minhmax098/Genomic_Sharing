import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';

// create connection to Safe Transaction Service
const apikit = new SafeApiKit({
    chainId: 11155111n,
    txServiceUrl: 'https://api.safe.global/tx-service/sep'
});

export const createSafeProposal = async (
    safeAddress: string, 
    transactionData: { to: string; data: string; value: string }
) => {
    // Auth with user's wallet
    const ethereum = (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum;
    
    if (!ethereum) throw new Error("No crypto wallet found");

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Initialize Safe Protocol Kit
    const protocolKit = await Safe.init({
        provider: ethereum, 
        signer: signerAddress,
        safeAddress
    });

    // Create and sign transaction (Offf-chain signing)
    const safeTransaction = await protocolKit.createTransaction({
        transactions: [transactionData]
    });
    const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
    const senderSignature = await protocolKit.signHash(safeTxHash);

    // Push proposal to Admin Dashboard
    await apikit.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: signerAddress,
        senderSignature: senderSignature.data
    });

    return safeTxHash;
};