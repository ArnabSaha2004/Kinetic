import { useState, useCallback } from 'react';
import { 
  validateDataForMinting
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

interface DataMintingApi {
  startCollection: () => void;
  stopCollection: () => void;
  mintCollectedData: () => Promise<void>;
  simulateMinting: () => Promise<void>;
  addDataPoint: (imuData: any) => void;
  clearData: () => void;
  testLogging: () => void;
  isCollecting: boolean;
  isMinting: boolean;
  collectedData: IMUDataPoint[];
  collectionDuration: number;
  mintResult: any | null;
  error: string | null;
}

export function useDataMinting(): DataMintingApi {
  const [state, setState] = useState<DataMintingState>({
    isCollecting: false,
    isMinting: false,
    collectedData: [],
    collectionStartTime: null,
    mintResult: null,
    error: null,
  });

  const startCollection = useCallback(() => {
    console.log('🎯 Starting IMU data collection...');
    
    setState(prev => {
      console.log('🎯 Current state before start:', {
        isCollecting: prev.isCollecting,
        collectedDataLength: prev.collectedData.length
      });
      
      const newState = {
        ...prev,
        isCollecting: true,
        collectedData: [],
        collectionStartTime: Date.now(),
        error: null,
      };
      console.log('🎯 New collection state set:', {
        isCollecting: newState.isCollecting,
        collectionStartTime: newState.collectionStartTime
      });
      return newState;
    });
    
    console.log('🎯 IMU data collection started successfully');
  }, []);

  const stopCollection = useCallback(() => {
    console.log('⏹️ Stopping IMU data collection...');
    
    setState(prev => {
      console.log('⏹️ Final collection stats:', {
        isCollecting: prev.isCollecting,
        totalPoints: prev.collectedData.length,
        duration: prev.collectionStartTime ? Date.now() - prev.collectionStartTime : 0
      });
      
      return {
        ...prev,
        isCollecting: false,
      };
    });
    console.log('⏹️ IMU data collection stopped');
  }, []);

  const addDataPoint = useCallback((imuData: any) => {
    setState(prev => {
      if (!prev.isCollecting) {
        return prev;
      }

      if (!imuData || typeof imuData !== 'object') {
        console.error('❌ Invalid IMU data: not an object', imuData);
        return prev;
      }
      
      if (!imuData.accelerometer || !imuData.gyroscope || !imuData.raw) {
        console.error('❌ Invalid IMU data: missing required fields', {
          hasAccelerometer: !!imuData.accelerometer,
          hasGyroscope: !!imuData.gyroscope,
          hasRaw: !!imuData.raw,
          receivedKeys: Object.keys(imuData)
        });
        return prev;
      }

      const dataPoint: IMUDataPoint = {
        timestamp: Date.now(),
        accelerometer: {
          x: Number(imuData.accelerometer.x) || 0,
          y: Number(imuData.accelerometer.y) || 0,
          z: Number(imuData.accelerometer.z) || 0,
        },
        gyroscope: {
          x: Number(imuData.gyroscope.x) || 0,
          y: Number(imuData.gyroscope.y) || 0,
          z: Number(imuData.gyroscope.z) || 0,
        },
        raw: {
          ax: Number(imuData.raw.ax) || 0,
          ay: Number(imuData.raw.ay) || 0,
          az: Number(imuData.raw.az) || 0,
          gx: Number(imuData.raw.gx) || 0,
          gy: Number(imuData.raw.gy) || 0,
          gz: Number(imuData.raw.gz) || 0,
        },
      };

      const newCollectedData = [...prev.collectedData, dataPoint];
      return {
        ...prev,
        collectedData: newCollectedData,
      };
    });
  }, []);

  const mintCollectedData = async (): Promise<void> => {
    const exportId = Math.random().toString(36).slice(2, 8);
    console.log(`📊 [${exportId}] Starting data export process...`);
    
    const dataValidation = validateDataForMinting(state.collectedData, state.isCollecting);
    console.log(`📊 [${exportId}] Data validation result:`, dataValidation);
    
    if (!dataValidation.canProceed) {
      console.error(`❌ [${exportId}] Export blocked: Data validation failed -`, dataValidation.errorMessage);
      setState(prev => ({ 
        ...prev, 
        error: dataValidation.requirementMessage || dataValidation.errorMessage || 'Data validation failed'
      }));
      return;
    }
    
    console.log(`✅ [${exportId}] Data validation passed, proceeding with export...`);

    setState(prev => ({ ...prev, isMinting: true, error: null }));

    try {
      const collectionDuration = state.collectionStartTime 
        ? Date.now() - state.collectionStartTime 
        : 0;

      console.log(`📊 [${exportId}] Preparing export data structure...`);
      
      const exportData = {
        metadata: {
          title: `Kinetic IMU Data Collection`,
          description: `IMU sensor data collected over ${Math.round(collectionDuration / 1000)} seconds from Kinetic device`,
          collectionInfo: {
            startTime: state.collectionStartTime,
            endTime: Date.now(),
            duration: collectionDuration,
            durationSeconds: Math.round(collectionDuration / 1000),
            totalDataPoints: state.collectedData.length,
            deviceType: 'ESP32C3_MPU6050',
            dataType: 'IMU Sensor Data'
          },
          walletInfo: {
            connected: false,
            note: 'Wallet info handled by App component'
          },
          exportedAt: new Date().toISOString(),
          exportId: exportId
        },
        sensorData: {
          dataPoints: state.collectedData,
          summary: {
            totalPoints: state.collectedData.length,
            avgAcceleration: calculateAverageAcceleration(state.collectedData),
            avgGyroscope: calculateAverageGyroscope(state.collectedData),
          }
        }
      };

      console.log(`📊 [${exportId}] Export data structure created:`, {
        totalPoints: exportData.sensorData.summary.totalPoints,
        duration: exportData.metadata.collectionInfo.durationSeconds,
        avgAcceleration: exportData.sensorData.summary.avgAcceleration,
        avgGyroscope: exportData.sensorData.summary.avgGyroscope,
        dataSize: state.collectedData.length,
        walletConnected: false
      });

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileSizeKB = (jsonString.length / 1024).toFixed(2);
      console.log(`📊 [${exportId}] JSON string created, size: ${fileSizeKB} KB`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `kinetic-imu-data-${timestamp}.json`;
      
      console.log(`📊 [${exportId}] Attempting to create downloadable file: ${filename}`);

      if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
        console.log(`📊 [${exportId}] Web environment detected, using Blob API...`);
        
        try {
          const blob = new Blob([jsonString], { type: 'application/json' });
          console.log(`📊 [${exportId}] Blob created successfully, size: ${blob.size} bytes`);
          
          const url = URL.createObjectURL(blob);
          console.log(`📊 [${exportId}] Object URL created: ${url.substring(0, 50)}...`);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          console.log(`📊 [${exportId}] Download link created and added to DOM`);
          
          link.click();
          console.log(`📊 [${exportId}] Download triggered`);
          
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log(`📊 [${exportId}] Cleanup completed`);
          
        } catch (blobError: any) {
          console.error(`❌ [${exportId}] Blob API error:`, blobError);
          throw new Error(`Blob creation failed: ${blobError.message}`);
        }
      } else {
        console.log(`📊 [${exportId}] React Native environment detected, Blob API not available`);
        console.log(`📊 [${exportId}] Alternative: Logging complete JSON data to console`);
        
        console.log(`📊 [${exportId}] ===== KINETIC IMU DATA EXPORT =====`);
        console.log(`📊 [${exportId}] Filename: ${filename}`);
        console.log(`📊 [${exportId}] Size: ${fileSizeKB} KB`);
        console.log(`📊 [${exportId}] Data Points: ${state.collectedData.length}`);
        console.log(`📊 [${exportId}] Duration: ${Math.round(collectionDuration / 1000)} seconds`);
        console.log(`📊 [${exportId}] ===== JSON DATA START =====`);
        console.log(jsonString);
        console.log(`📊 [${exportId}] ===== JSON DATA END =====`);
        
        console.log(`📊 [${exportId}] Data logged to console successfully`);
      }

      console.log(`✅ [${exportId}] IMU data export completed successfully`);

      setState(prev => ({
        ...prev,
        isMinting: false,
        mintResult: {
          status: 'exported',
          message: typeof document !== 'undefined' 
            ? `IMU data exported successfully! ${state.collectedData.length} data points saved to ${filename}`
            : `IMU data logged to console! ${state.collectedData.length} data points available in console logs. Check the console for the complete JSON data.`,
          exportInfo: {
            filename: filename,
            pointsExported: state.collectedData.length,
            collectionDuration: collectionDuration,
            exportedAt: new Date().toISOString(),
            fileSize: `${fileSizeKB} KB`,
            exportMethod: typeof document !== 'undefined' ? 'file_download' : 'console_log',
            exportId: exportId
          },
          ...(typeof document === 'undefined' && { 
            exportedData: exportData,
            jsonString: jsonString 
          })
        },
      }));

    } catch (error: any) {
      console.error(`❌ [${exportId}] Export failed:`, error);
      
      let userFriendlyMessage = 'Data export failed. Please try again.';
      
      if (error?.message?.includes('Blob')) {
        userFriendlyMessage = 'File creation failed. This might be due to platform limitations. Check console logs for the data.';
      } else if (error?.message?.includes('URL')) {
        userFriendlyMessage = 'Download link creation failed. Check console logs for the exported data.';
      } else if (error?.message) {
        userFriendlyMessage = `Export failed: ${error.message}`;
      }
      
      setState(prev => ({
        ...prev,
        isMinting: false,
        error: userFriendlyMessage,
      }));
    }
  };

  const collectionDuration = state.collectionStartTime 
    ? Date.now() - state.collectionStartTime 
    : 0;

  const clearData = useCallback(() => {
    console.log('🗑️ Clearing collected data...');
    setState(prev => ({
      ...prev,
      collectedData: [],
      mintResult: null,
      error: null,
    }));
    console.log('🗑️ Data cleared successfully');
  }, []);

  const simulateMinting = async (): Promise<void> => {
    const simulationId = Math.random().toString(36).slice(2, 8);
    console.log(`🎭 [${simulationId}] Starting IP token simulation (no wallet required)...`);
    
    // Only validate data requirements for simulation (no wallet needed)
    const dataValidation = validateDataForMinting(state.collectedData, state.isCollecting);
    console.log(`🎭 [${simulationId}] Data validation result:`, dataValidation);
    
    if (!dataValidation.canProceed) {
      console.error(`❌ [${simulationId}] Simulation blocked: Data validation failed -`, dataValidation.errorMessage);
      setState(prev => ({ 
        ...prev, 
        error: dataValidation.requirementMessage || dataValidation.errorMessage || 'Data validation failed'
      }));
      return;
    }
    
    console.log(`✅ [${simulationId}] Data validation passed, starting simulation (wallet not required)...`);

    setState(prev => ({ ...prev, isMinting: true, error: null }));

    try {
      const collectionDuration = state.collectionStartTime 
        ? Date.now() - state.collectionStartTime 
        : 0;

      console.log(`🎭 [${simulationId}] Simulating blockchain transaction...`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock Story Protocol IP token data
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
      const mockIPTokenId = Math.floor(Math.random() * 10000) + 1;
      const mockIPFSHash = `Qm${Math.random().toString(36).slice(2, 46)}`;
      const mockIPAssetId = `0x${Math.random().toString(16).slice(2, 40)}`;
      const mockLicenseTokenId = Math.floor(Math.random() * 1000) + 1;
      const mockGasUsed = Math.floor(Math.random() * 80000) + 35000; // Higher gas for IP operations
      const mockGasFee = (Math.random() * 0.02 + 0.003).toFixed(6);
      const mockRoyaltyRate = (Math.random() * 5 + 2).toFixed(1); // 2-7% royalty
      
      console.log(`🎭 [${simulationId}] Simulation complete! Mock Story Protocol IP token created:`, {
        txHash: mockTxHash,
        ipTokenId: mockIPTokenId,
        ipAssetId: mockIPAssetId,
        licenseTokenId: mockLicenseTokenId,
        ipfsHash: mockIPFSHash,
        gasUsed: mockGasUsed,
        gasFee: mockGasFee,
        royaltyRate: mockRoyaltyRate
      });

      // Generate sample JSON for preview (first 10 lines)
      const sampleMetadata = {
        title: `Kinetic IMU Data IP Asset #${mockIPTokenId}`,
        description: `Motion sensor intellectual property collected over ${Math.round(collectionDuration / 1000)} seconds from Kinetic device`,
        ipType: 'Motion Data IP',
        commercialUse: true,
        derivativeWorks: true,
        attributes: [
          { trait_type: 'Data Points', value: state.collectedData.length },
          { trait_type: 'Duration (seconds)', value: Math.round(collectionDuration / 1000) },
          { trait_type: 'Device Type', value: 'ESP32C3_MPU6050' }
        ]
      };
      
      const sampleJsonLines = JSON.stringify(sampleMetadata, null, 2).split('\n').slice(0, 10);
      const sampleJson = sampleJsonLines.join('\n') + (sampleJsonLines.length === 10 ? '\n  ...' : '');

      const simulationResult = {
        status: 'simulated',
        message: `Simulation successful! Your IMU data would be registered as IP Token #${mockIPTokenId} on Story Protocol`,
        simulationInfo: {
          transactionHash: mockTxHash,
          ipTokenId: mockIPTokenId,
          ipAssetId: mockIPAssetId,
          licenseTokenId: mockLicenseTokenId,
          ipfsHash: mockIPFSHash,
          gasUsed: mockGasUsed,
          gasFeeIP: mockGasFee,
          royaltyRate: `${mockRoyaltyRate}%`,
          network: 'Story Aeneis Testnet',
          ipAssetRegistry: '0x28E59E91C0467e89fd0f0438D47Ca839cDfEc095',
          licensingModule: '0x5a7D9Fa17DE09350F481A53B470D798c1c1aabae',
          royaltyModule: '0x7D2d4D1A7cB8B8B5E1F2A3C4D5E6F7A8B9C0D1E2',
          dataPoints: state.collectedData.length,
          collectionDuration: Math.round(collectionDuration / 1000),
          simulatedAt: new Date().toISOString(),
          simulationId: simulationId,
          sampleJson: sampleJson,
          note: 'This is a simulation - no real IP token was created. No wallet connection required for simulation.'
        },
        metadata: {
          title: `Kinetic IMU Data IP Asset #${mockIPTokenId}`,
          description: `Motion sensor intellectual property collected over ${Math.round(collectionDuration / 1000)} seconds from Kinetic device`,
          ipType: 'Motion Data IP',
          commercialUse: true,
          derivativeWorks: true,
          attributes: [
            { trait_type: 'Data Points', value: state.collectedData.length },
            { trait_type: 'Duration (seconds)', value: Math.round(collectionDuration / 1000) },
            { trait_type: 'Device Type', value: 'ESP32C3_MPU6050' },
            { trait_type: 'IP Category', value: 'Motion Sensor Data' },
            { trait_type: 'Commercial Rights', value: 'Enabled' },
            { trait_type: 'Royalty Rate', value: `${mockRoyaltyRate}%` },
            { trait_type: 'Collection Date', value: new Date().toISOString().split('T')[0] }
          ],
          licensing: {
            commercialUse: true,
            derivativeWorks: true,
            royaltyRate: mockRoyaltyRate,
            attribution: 'Required',
            territory: 'Worldwide'
          }
        }
      };

      console.log(`✅ [${simulationId}] Minting simulation completed successfully`);

      setState(prev => ({
        ...prev,
        isMinting: false,
        mintResult: simulationResult,
      }));

    } catch (error: any) {
      console.error(`❌ [${simulationId}] Simulation failed:`, error);
      
      setState(prev => ({
        ...prev,
        isMinting: false,
        error: `Simulation failed: ${error.message || 'Unknown error'}`,
      }));
    }
  };

  const testLogging = useCallback(() => {
    console.log('🧪 Test logging function called');
    setState(prev => ({ 
      ...prev, 
      error: 'Test logging completed - check console'
    }));
  }, []);

  return {
    startCollection,
    stopCollection,
    mintCollectedData,
    simulateMinting,
    addDataPoint,
    clearData,
    testLogging,
    isCollecting: state.isCollecting,
    isMinting: state.isMinting,
    collectedData: state.collectedData,
    collectionDuration,
    mintResult: state.mintResult,
    error: state.error,
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