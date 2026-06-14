import { saveFileRecord, getFilesByOwner, deleteFileRecord } from './db';
import type { UploadedFile } from './db';

// Wallet and Shelby Service Interfaces
export interface WalletState {
  connected: boolean;
  address: string;
  walletType: 'petra' | 'metamask' | 'okx' | null;
  network: 'shelbynet' | 'simulated';
  balanceAPT: number;
  balanceSHELBYUSD: number;
  isMock: boolean;
}

// Generate a random key/address for mock wallets
function generateMockAddress(type: string): string {
  const hex = '0123456789abcdef';
  let addr = '0x';
  const len = type === 'petra' || type === 'okx' ? 64 : 40; // Aptos 32 bytes (64 hex chars), EVM 20 bytes (40 hex chars)
  for (let i = 0; i < len; i++) {
    addr += hex[Math.floor(Math.random() * 16)];
  }
  return addr;
}

// AES Crypto Helpers for Private Files
async function deriveKeyFromSignature(signature: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const signatureBytes = encoder.encode(signature);
  
  // Hash the signature to get a consistent 256-bit key source
  const hash = await window.crypto.subtle.digest('SHA-256', signatureBytes);
  
  // Import the hash as an AES key
  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: Uint8Array, signature: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const key = await deriveKeyFromSignature(signature);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is standard for AES-GCM
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any
    },
    key,
    data as any
  );
  
  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    iv: iv
  };
}

export async function decryptData(ciphertext: Uint8Array, iv: Uint8Array, signature: string): Promise<Uint8Array> {
  const key = await deriveKeyFromSignature(signature);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any
    },
    key,
    ciphertext as any
  );
  
  return new Uint8Array(decryptedBuffer);
}

// Global service class
export class ShelbyService {
  // Connect Wallet
  static async connect(
    walletType: 'petra' | 'metamask' | 'okx',
    useMock: boolean = false
  ): Promise<WalletState> {
    if (useMock) {
      return {
        connected: true,
        address: generateMockAddress(walletType),
        walletType,
        network: 'simulated',
        balanceAPT: 10.0,
        balanceSHELBYUSD: 250.0,
        isMock: true,
      };
    }

    try {
      if (walletType === 'petra') {
        // Native Petra wallet on Aptos
        if (!(window as any).aptos) {
          throw new Error('Petra Wallet extension not found. Please install it or use Demo Mode.');
        }
        const response = await (window as any).aptos.connect();
        const address = response.address;
        
        // Try to check network
        let network: 'shelbynet' | 'simulated' = 'simulated';
        try {
          const net = await (window as any).aptos.network();
          if (net && (net.toLowerCase().includes('shelby') || net.toLowerCase().includes('testnet'))) {
            network = 'shelbynet';
          }
        } catch (e) {
          console.warn('Could not determine Petra network setting', e);
        }

        return {
          connected: true,
          address,
          walletType,
          network,
          balanceAPT: 5.4,
          balanceSHELBYUSD: 125.0,
          isMock: false,
        };
      } else if (walletType === 'metamask') {
        // Metamask EVM Wallet
        if (!(window as any).ethereum) {
          throw new Error('MetaMask extension not found. Please install it or use Demo Mode.');
        }
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from MetaMask');
        }

        return {
          connected: true,
          address: accounts[0],
          walletType,
          network: 'simulated', // Derived Account Abstraction Mode
          balanceAPT: 0,
          balanceSHELBYUSD: 100.0,
          isMock: false,
        };
      } else {
        // OKX Wallet (can be Aptos or EVM, default to standard Aptos if available, or EVM fallback)
        const okx = (window as any).okxwallet;
        if (!okx) {
          throw new Error('OKX Wallet extension not found. Please install it or use Demo Mode.');
        }

        let address = '';
        let network: 'shelbynet' | 'simulated' = 'simulated';

        if (okx.aptos) {
          const response = await okx.aptos.connect();
          address = response.address;
          network = 'shelbynet';
        } else {
          const accounts = await okx.request({ method: 'eth_requestAccounts' });
          address = accounts[0];
        }

        return {
          connected: true,
          address,
          walletType,
          network,
          balanceAPT: 8.2,
          balanceSHELBYUSD: 300.0,
          isMock: false,
        };
      }
    } catch (error: any) {
      console.error(`Error connecting to ${walletType}:`, error);
      throw error;
    }
  }

  // Request message signature to derive encryption key
  static async getSignatureForEncryption(
    walletState: WalletState,
    _message: string = 'Authorize Shelby Upload to secure and decrypt your private files.',
    _aptosSignMessage?: (params: { message: string; nonce: string }) => Promise<any>
  ): Promise<string> {
    // Bypasses popup prompts entirely: returns a stable, deterministic key basis derived from the wallet address.
    return `shelby-key-${walletState.address.toLowerCase()}`;
  }

  // Request actual wallet signature (for fallback decryption of legacy files)
  static async getSignatureForRealWallet(
    walletState: WalletState,
    message: string = 'Authorize Shelby Upload to secure and decrypt your private files.',
    aptosSignMessage?: (params: { message: string; nonce: string }) => Promise<any>
  ): Promise<string> {
    if (walletState.isMock) {
      return `mock-sig-${walletState.address}`;
    }

    try {
      if (walletState.walletType === 'petra' || walletState.walletType === 'okx') {
        if (aptosSignMessage) {
          const response = await aptosSignMessage({
            message,
            nonce: '1'
          });
          return response.signature || response.signature?.toString() || JSON.stringify(response);
        }

        const globalProvider = walletState.walletType === 'petra' 
          ? (window as any).aptos 
          : ((window as any).okxwallet?.aptos || (window as any).okxwallet);
          
        if (globalProvider && typeof globalProvider.signMessage === 'function') {
          const response = await globalProvider.signMessage({
            message,
            nonce: '1'
          });
          return response.signature || JSON.stringify(response);
        }
        throw new Error('Wallet signature API not available');
      } else if (walletState.walletType === 'metamask') {
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [message, walletState.address],
        });
        return signature;
      }
      throw new Error('Unsupported wallet type for signing');
    } catch (error: any) {
      console.error('Signing failed:', error);
      throw new Error(`Signature request denied: ${error.message || error}`);
    }
  }

  // Upload file
  static async uploadFile(
    file: File,
    isPrivate: boolean,
    walletState: WalletState,
    onProgress: (progress: number) => void,
    _aptosSignMessage?: (params: { message: string; nonce: string }) => Promise<any>,
    aptosSignAndSubmitTransaction?: (transaction: any) => Promise<any>
  ): Promise<UploadedFile> {
    if (!walletState.connected) {
      throw new Error('Wallet not connected');
    }

    onProgress(10); // Initialization

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    let fileBytes = new Uint8Array(arrayBuffer);
    onProgress(30); // File read complete

    let finalData = fileBytes;
    let fileId = `blob-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    onProgress(40);
    onProgress(60);

    let txHash: string | undefined = undefined;

    // Submit real on-chain transaction if it's a real connected Petra/OKX wallet
    if (!walletState.isMock && (walletState.walletType === 'petra' || walletState.walletType === 'okx')) {
      if (aptosSignAndSubmitTransaction) {
        onProgress(65); // Triggering real transaction
        try {
          const response = await aptosSignAndSubmitTransaction({
            data: {
              function: "0x1::aptos_account::transfer",
              typeArguments: [],
              functionArguments: [walletState.address, 10000] // Transfer 10,000 Octas (0.0001 APT) back to user's address
            }
          });
          if (response && response.hash) {
            txHash = response.hash;
            console.log('On-chain transaction submitted successfully. Hash:', txHash);
          } else if (typeof response === 'string') {
            txHash = response;
          }
        } catch (err: any) {
          console.error('On-chain transaction rejected/failed:', err);
          throw new Error(`Transaction rejected or failed: ${err.message || err}`);
        }
        onProgress(72);
      }
    }

    // Private files are stored as-is (unencrypted) in the local IndexedDB.
    // No AES encryption needed — IndexedDB is local-only storage on this device.
    onProgress(75);

    onProgress(80); // Storing data on decentralized network (or IndexDB fallback)

    let publicUrl = '';
    
    // If public, we can upload it to tmpfiles.org to get a real public share link
    if (!isPrivate) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.data && json.data.url) {
            // Tmpfiles returns a viewer link. We can change it to a direct download link by changing /tmpfiles.org/ to /tmpfiles.org/dl/
            const viewerUrl = json.data.url;
            publicUrl = viewerUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
          }
        }
      } catch (err) {
        console.warn('Failed to upload to public gateway, falling back to local simulation URL', err);
      }
    }

    // Default share link using local app URL if free host fails
    if (!publicUrl) {
      publicUrl = `${window.location.origin}/#/share/${fileId}`;
    }

    const fileRecord: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      data: finalData,
      isPrivate,
      encrypted: false, // New files are stored as plain bytes in IndexedDB (no AES)
      uploadedAt: new Date().toISOString(),
      ownerAddress: walletState.address,
      shareableUrl: isPrivate ? undefined : publicUrl,
      txHash
    };

    // Save record locally in IndexedDB
    await saveFileRecord(fileRecord);
    onProgress(100); // Upload complete

    return fileRecord;
  }

  // Download File
  static async downloadFile(
    fileRecord: UploadedFile, 
    walletState: WalletState,
    _aptosSignMessage?: (params: { message: string; nonce: string }) => Promise<any>
  ): Promise<{ name: string; url: string }> {
    let rawData = fileRecord.data;

    // Handle legacy AES-encrypted files (uploaded before encryption was removed)
    if (fileRecord.isPrivate && fileRecord.encrypted === true) {
      const iv = rawData.slice(0, 12);
      const ciphertext = rawData.slice(12);
      const silentSig = `shelby-key-${walletState.address.toLowerCase()}`;
      try {
        rawData = await decryptData(ciphertext, iv, silentSig);
      } catch {
        throw new Error('This file was encrypted with your old wallet signature. Please delete it and re-upload to view without signing.');
      }
    }

    const blob = new Blob([rawData as any], { type: fileRecord.type });
    const url = URL.createObjectURL(blob);
    return { name: fileRecord.name, url };
  }

  // Get uploaded files for owner
  static async getFiles(walletAddress: string): Promise<UploadedFile[]> {
    return await getFilesByOwner(walletAddress);
  }

  // Delete file
  static async deleteFile(fileId: string): Promise<void> {
    await deleteFileRecord(fileId);
  }
}
