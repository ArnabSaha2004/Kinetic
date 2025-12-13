import { useState } from 'react';
import { useWallet } from '../components/AppKitProvider';
import { 
  validateWalletForMinting, 
  validateDataForMinting, 
  WalletConnectionState 
} from '../utils/WalletGuards';

interface IMUDataPoint {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  raw: { ax: number; ay: number; az: number; gx: number; gy: number; gz: number };
}

interface DataMintingState {
  isCollecting: boolean;
  isMinting: boolean;
  collectedData: IMUDataPoint[];
  collectionStartTime: number | null;
  mintResult: any | null;
  error: string | null;
}

interface TransactionData {
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
}

interface DataMintingApi {
  startCollection: () => void;
  stopCollection: () => void;
  mintCollectedData: () => Promise<void>;
  addDataPoint: (imuData: any) => void;
  clearData: () => void;
  isCollecting: boolean;
  isMinting: boolean;
  collectedData: IMUDataPoint[];
  collectionDuration: number;
  mintResult: any | null;
  error: string | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
}

const MINTING_API_URL = 'https://surreal-base.vercel.app';

export function useDataMinting(): DataMintingApi {
  const [state, setState] = useState<DataMintingState>({
    isCollecting: false,
    isMinting: false,
    collectedData: [],
    collectionStartTime: null,
    mintResult: null,
    error: null,
  });

  // Custom wallet integration
  const { address, isConnected, signMessage: walletSignMessage } = useWallet();

  const startCollection = () => {
    setState(prev => ({
      ...prev,
      isCollecting: true,
      collectedData: [],
      collectionStartTime: Date.now(),
      error: null,
    }));
    console.log('🎯 Started IMU data collection');
  };

  const stopCollection = () => {
    setState(prev => ({
      ...prev,
      isCollecting: false,
    }));
    console.log('⏹️ Stopped IMU data collection');
  };

  const addDataPoint = (imuData: any) => {
    if (!state.isCollecting) return;

    const dataPoint: IMUDataPoint = {
      timestamp: Date.now(),
      accelerometer: {
        x: imuData.accelerometer.x,
        y: imuData.accelerometer.y,
        z: imuData.accelerometer.z,
      },
      gyroscope: {
        x: imuData.gyroscope.x,
        y: imuData.gyroscope.y,
        z: imuData.gyroscope.z,
      },
      raw: {
        ax: imuData.raw.ax,
        ay: imuData.raw.ay,
        az: imuData.raw.az,
        gx: imuData.raw.gx,
        gy: imuData.raw.gy,
        gz: imuData.raw.gz,
      },
    };

    setState(prev => ({
      ...prev,
      collectedData: [...prev.collectedData, dataPoint],
    }));
  };

  // Enhanced Wagmi transaction signing function with better error handling
  const signTransactionWithWallet = async (transactionData: TransactionData): Promise<string> => {
    try {
      console.log('✍️ Signing transaction via wallet:', transactionData);
      
      if (!walletSignMessage || !address) {
        throw new Error('WALLET_NOT_AVAILABLE: No wallet or address available for signing');
      }

      // For transaction signing, we'll use signMessage with the transaction data
      // In a real implementation, you might want to use sendTransaction instead
      const messageToSign = JSON.stringify(transactionData);
      
      const signature = await walletSignMessage(messageToSign);
      
      console.log('✅ Transaction signed successfully via wallet');
      return signature;
    } catch (error: any) {
      console.error('❌ Wallet transaction signing failed:', error);
      
      // Enhanced error classification for signing failures
      let userFriendlyMessage = 'Transaction signing failed. Please try again.';
      
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        userFriendlyMessage = 'Transaction was cancelled by user. Please try again when ready.';
      } else if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
        userFriendlyMessage = 'Network error during signing. Please check your connection and try again.';
      } else if (error?.message?.includes('WALLET_NOT_AVAILABLE')) {
        userFriendlyMessage = 'Wallet connection lost. Please reconnect your wallet and try again.';
      } else if (error?.message?.includes('insufficient funds') || error?.message?.includes('gas')) {
        userFriendlyMessage = 'Insufficient funds or gas limit exceeded. Please check your wallet balance.';
      } else if (error?.message?.includes('unsupported')) {
        userFriendlyMessage = 'This operation is not supported by your wallet. Please try a different wallet.';
      }
      
      throw new Error(userFriendlyMessage);
    }
  };

  const mintCollectedData = async (): Promise<void> => {
    // Use wallet guards for comprehensive validation
    const walletState: WalletConnectionState = {
      isConnected,
      address: address || undefined,
      hasProvider: isConnected,
      status: isConnected ? 'connected' : 'disconnected'
    };

    // Validate wallet connection requirements
    const walletValidation = validateWalletForMinting(walletState);
    if (!walletValidation.canProceed) {
      setState(prev => ({ 
        ...prev, 
        error: walletValidation.requirementMessage || walletValidation.errorMessage || 'Wallet validation failed'
      }));
      console.log('❌ Minting blocked: Wallet validation failed -', walletValidation.errorMessage);
      return;
    }

    // Validate data requirements
    const dataValidation = validateDataForMinting(state.collectedData, state.isCollecting);
    if (!dataValidation.canProceed) {
      setState(prev => ({ 
        ...prev, 
        error: dataValidation.requirementMessage || dataValidation.errorMessage || 'Data validation failed'
      }));
      console.log('❌ Minting blocked: Data validation failed -', dataValidation.errorMessage);
      return;
    }

    setState(prev => ({ ...prev, isMinting: true, error: null }));

    try {
      // Prepare metadata for minting
      const collectionDuration = state.collectionStartTime 
        ? Date.now() - state.collectionStartTime 
        : 0;

      const metadata = {
        title: `Kinetic IMU Data Collection`,
        description: `IMU sensor data collected over ${Math.round(collectionDuration / 1000)} seconds from Kinetic device`,
        creators: [{
          name: 'Kinetic Device User',
          address: address,
          contributionPercent: 100
        }],
        attributes: [
          {
            trait_type: 'Collection Duration',
            value: `${Math.round(collectionDuration / 1000)} seconds`
          },
          {
            trait_type: 'Data Points',
            value: state.collectedData.length
          },
          {
            trait_type: 'Device Type',
            value: 'ESP32C3_MPU6050'
          },
          {
            trait_type: 'Data Type',
            value: 'IMU Sensor Data'
          }
        ],
        // Include the actual sensor data
        sensorData: {
          collectionStartTime: state.collectionStartTime,
          collectionEndTime: Date.now(),
          duration: collectionDuration,
          dataPoints: state.collectedData,
          summary: {
            totalPoints: state.collectedData.length,
            avgAcceleration: calculateAverageAcceleration(state.collectedData),
            avgGyroscope: calculateAverageGyroscope(state.collectedData),
          }
        }
      };

      const nftMetadata = {
        name: `Kinetic IMU Data #${Date.now()}`,
        description: `Verified motion data from Kinetic device - ${state.collectedData.length} data points over ${Math.round(collectionDuration / 1000)} seconds`,
        image: 'https://kinetic.com/images/imu-data-nft.png', // Placeholder
        attributes: metadata.attributes
      };

      console.log('🚀 Preparing to mint IMU data with', state.collectedData.length, 'data points');
      console.log('🔗 Using wallet address:', address);
      console.log('📱 Wallet available:', isConnected);

      // Call the Universal Minting Engine to prepare the transaction
      const response = await fetch(`${MINTING_API_URL}/api/prepare-mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          ipMetadata: metadata,
          nftMetadata: nftMetadata,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Minting preparation failed. Please try again.';
        
        if (response.status === 400) {
          errorMessage = 'Invalid data provided for minting. Please check your IMU data and try again.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please reconnect your wallet.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = `Minting preparation failed: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const preparedTransaction = await response.json();
      console.log('📋 Transaction prepared:', preparedTransaction);

      // Use AppKit to sign the transaction
      if (preparedTransaction.transactionData) {
        console.log('📝 Requesting wallet signature...');
        
        try {
          const signature = await signTransactionWithWallet(preparedTransaction.transactionData);
          console.log('✅ Transaction signed successfully via wallet:', signature);
          
          // In a real implementation, you would submit the signed transaction to the blockchain
          // For now, we'll show success with the signature and maintain IMU data integrity
          setState(prev => ({
            ...prev,
            isMinting: false,
            mintResult: {
              ...preparedTransaction,
              signature: signature,
              status: 'signed',
              message: `IMU data NFT signed successfully! ${state.collectedData.length} data points ready for blockchain submission.`,
              dataIntegrity: {
                pointsCollected: state.collectedData.length,
                collectionDuration: collectionDuration,
                walletUsed: address,
                signedAt: new Date().toISOString()
              }
            },
          }));
        } catch (signingError: any) {
          console.error('❌ Wallet transaction signing failed:', signingError);
          setState(prev => ({
            ...prev,
            isMinting: false,
            error: signingError.message, // Use the enhanced error message from signTransactionWithWallet
          }));
          return;
        }
      } else {
        // No transaction data to sign, just return the prepared transaction
        setState(prev => ({
          ...prev,
          isMinting: false,
          mintResult: {
            ...preparedTransaction,
            status: 'prepared',
            message: 'Transaction prepared successfully. No signature required.'
          },
        }));
      }

      console.log('✅ IMU data minting process completed via wallet');

    } catch (error: any) {
      console.error('❌ Minting failed:', error);
      
      // Enhanced error handling for general minting failures
      let userFriendlyMessage = 'Minting failed. Please try again.';
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        userFriendlyMessage = 'Network error occurred. Please check your internet connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again with a stable connection.';
      } else if (error?.message) {
        userFriendlyMessage = error.message; // Use the specific error message if available
      }
      
      setState(prev => ({
        ...prev,
        isMinting: false,
        error: userFriendlyMessage,
      }));
    }
  };

  const clearData = () => {
    setState(prev => ({
      ...prev,
      collectedData: [],
      collectionStartTime: null,
      mintResult: null,
      error: null,
    }));
    console.log('🧹 Cleared collected data');
  };

  const collectionDuration = state.collectionStartTime 
    ? Date.now() - state.collectionStartTime 
    : 0;

  return {
    startCollection,
    stopCollection,
    mintCollectedData,
    addDataPoint,
    clearData,
    isCollecting: state.isCollecting,
    isMinting: state.isMinting,
    collectedData: state.collectedData,
    collectionDuration,
    mintResult: state.mintResult,
    error: state.error,
    isWalletConnected: isConnected,
    walletAddress: address || undefined,
  };
}

// Helper functions
function calculateAverageAcceleration(data: IMUDataPoint[]) {
  if (data.length === 0) return { x: 0, y: 0, z: 0 };
  
  const sum = data.reduce((acc, point) => ({
    x: acc.x + point.accelerometer.x,
    y: acc.y + point.accelerometer.y,
    z: acc.z + point.accelerometer.z,
  }), { x: 0, y: 0, z: 0 });

  return {
    x: sum.x / data.length,
    y: sum.y / data.length,
    z: sum.z / data.length,
  };
}

function calculateAverageGyroscope(data: IMUDataPoint[]) {
  if (data.length === 0) return { x: 0, y: 0, z: 0 };
  
  const sum = data.reduce((acc, point) => ({
    x: acc.x + point.gyroscope.x,
    y: acc.y + point.gyroscope.y,
    z: acc.z + point.gyroscope.z,
  }), { x: 0, y: 0, z: 0 });

  return {
    x: sum.x / data.length,
    y: sum.y / data.length,
    z: sum.z / data.length,
  };
}