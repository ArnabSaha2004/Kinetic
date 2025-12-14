import { useState, useCallback } from 'react';
import { useKineticWallet } from '../components/ThirdwebProvider';
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
  mintToBlockchain: () => Promise<void>;
  addDataPoint: (imuData: any) => void;
  clearData: () => void;
  testLogging: () => void;
  isCollecting: boolean;
  isMinting: boolean;
  collectedData: IMUDataPoint[];
  collectionDuration: number;
  mintResult: any | null;
  error: string | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
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

  // Enhanced logging function for better visibility in Expo
  const debugLog = (mintId: string, level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${mintId}] ${message}`;
    
    // Use multiple logging methods
    console.log(logMessage);
    if (level === 'warn') console.warn(logMessage);
    if (level === 'error') console.error(logMessage);
    
    // Also log data if provided
    if (data) {
      console.log(`[${mintId}] Data:`, data);
    }
    
    // Update UI state with latest log for visibility
    setState(prev => ({ 
      ...prev, 
      error: `${message}${data ? ' (check console for details)' : ''}`
    }));
  };

  // Thirdweb wallet (now the main and only wallet)
  const wallet = useKineticWallet();

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
  }, []); // Remove dependencies to prevent recreation

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
  }, []); // Remove dependencies to prevent recreation

  const addDataPoint = useCallback((imuData: any) => {
    setState(prev => {
      // console.log('📊 addDataPoint called, isCollecting:', prev.isCollecting);
      
      if (!prev.isCollecting) {
        // console.log('📊 Not collecting, ignoring data point');
        return prev; // Return unchanged state
      }

      // console.log('📊 Raw IMU data received:', imuData);
      // console.log('📊 Adding data point to collection:', {
      //   accelerometer: imuData.accelerometer,
      //   gyroscope: imuData.gyroscope,
      //   timestamp: Date.now()
      // });

      // Validate incoming IMU data structure
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
      
      // console.log('📊 Processed data point:', dataPoint);

      const newCollectedData = [...prev.collectedData, dataPoint];
      // console.log('📊 Collection updated, total points:', newCollectedData.length);
      return {
        ...prev,
        collectedData: newCollectedData,
      };
    });
  }, []); // Remove dependencies to prevent recreation



  const mintCollectedData = async (): Promise<void> => {
    const exportId = Math.random().toString(36).slice(2, 8);
    console.log(`📊 [${exportId}] Starting data export process...`);
    console.log(`📊 [${exportId}] Platform detection:`, {
      hasDocument: typeof document !== 'undefined',
      hasBlob: typeof Blob !== 'undefined',
      hasURL: typeof URL !== 'undefined',
      hasCreateObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available'
    });
    
    console.log(`📊 [${exportId}] Data state for validation:`, {
      collectedDataLength: state.collectedData.length,
      isCollecting: state.isCollecting,
      collectionStartTime: state.collectionStartTime,
      sampleDataPoint: state.collectedData[0] || 'No data points',
      firstDataPoint: state.collectedData.length > 0 ? {
        timestamp: state.collectedData[0].timestamp,
        accelerometer: state.collectedData[0].accelerometer,
        gyroscope: state.collectedData[0].gyroscope
      } : null,
      lastDataPoint: state.collectedData.length > 0 ? {
        timestamp: state.collectedData[state.collectedData.length - 1].timestamp,
        accelerometer: state.collectedData[state.collectedData.length - 1].accelerometer,
        gyroscope: state.collectedData[state.collectedData.length - 1].gyroscope
      } : null
    });

    // Validate data requirements (skip wallet validation for JSON export)
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
      // Prepare metadata for export
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
          walletInfo: wallet.isConnected ? {
            address: wallet.address,
            connected: true
          } : {
            connected: false
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
        walletConnected: wallet.isConnected
      });

      // Create JSON string
      console.log(`📊 [${exportId}] Converting data to JSON string...`);
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileSizeKB = (jsonString.length / 1024).toFixed(2);
      console.log(`📊 [${exportId}] JSON string created, size: ${fileSizeKB} KB`);

      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `kinetic-imu-data-${timestamp}.json`;
      
      console.log(`📊 [${exportId}] Attempting to create downloadable file: ${filename}`);

      // Check if we're in a web environment
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
        console.log(`📊 [${exportId}] Web environment detected, using Blob API...`);
        
        try {
          // Create blob
          const blob = new Blob([jsonString], { type: 'application/json' });
          console.log(`📊 [${exportId}] Blob created successfully, size: ${blob.size} bytes`);
          
          // Create URL
          const url = URL.createObjectURL(blob);
          console.log(`📊 [${exportId}] Object URL created: ${url.substring(0, 50)}...`);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          console.log(`📊 [${exportId}] Download link created and added to DOM`);
          
          // Trigger download
          link.click();
          console.log(`📊 [${exportId}] Download triggered`);
          
          // Cleanup
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log(`📊 [${exportId}] Cleanup completed`);
          
        } catch (blobError: any) {
          console.error(`❌ [${exportId}] Blob API error:`, blobError);
          throw new Error(`Blob creation failed: ${blobError.message}`);
        }
      } else {
        // React Native environment - log the data and provide alternative
        console.log(`📊 [${exportId}] React Native environment detected, Blob API not available`);
        console.log(`📊 [${exportId}] Alternative: Logging complete JSON data to console`);
        
        // Log the complete JSON data
        console.log(`📊 [${exportId}] ===== KINETIC IMU DATA EXPORT =====`);
        console.log(`📊 [${exportId}] Filename: ${filename}`);
        console.log(`📊 [${exportId}] Size: ${fileSizeKB} KB`);
        console.log(`📊 [${exportId}] Data Points: ${state.collectedData.length}`);
        console.log(`📊 [${exportId}] Duration: ${Math.round(collectionDuration / 1000)} seconds`);
        console.log(`📊 [${exportId}] ===== JSON DATA START =====`);
        console.log(jsonString);
        console.log(`📊 [${exportId}] ===== JSON DATA END =====`);
        
        // For React Native, we'll show the data in the result message
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
          // Include the actual data for React Native
          ...(typeof document === 'undefined' && { 
            exportedData: exportData,
            jsonString: jsonString 
          })
        },
      }));

    } catch (error: any) {
      console.error(`❌ [${exportId}] Export failed:`, error);
      console.error(`❌ [${exportId}] Error details:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      
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

  const mintToBlockchain = async (): Promise<void> => {
    const mintId = Math.random().toString(36).slice(2, 8);
    
    // Simple logging like the working BLE logs
    console.log('🚀 MINT TO BLOCKCHAIN FUNCTION CALLED');
    console.log('🚀 Minting Process Started:', new Date().toISOString());
    console.log('🚀 Process ID:', mintId);
    
    // Also log to state for UI visibility
    setState(prev => ({ 
      ...prev, 
      error: `🚀 Starting blockchain minting [${mintId}]...`
    }));
    
    // Log current state for debugging with multiple methods
    console.log(`📊 [${mintId}] Current state analysis:`);
    console.warn(`📊 [${mintId}] STATE CHECK - Data points: ${state.collectedData.length}, Collecting: ${state.isCollecting}, Minting: ${state.isMinting}`);
    console.log(`📊 [${mintId}] - Collected data points: ${state.collectedData.length}`);
    console.log(`📊 [${mintId}] - Is collecting: ${state.isCollecting}`);
    console.log(`📊 [${mintId}] - Is minting: ${state.isMinting}`);
    console.log(`📊 [${mintId}] - Has mint result: ${!!state.mintResult}`);
    console.log(`📊 [${mintId}] - Has exported data: ${!!(state.mintResult?.exportedData)}`);
    console.log(`📊 [${mintId}] - Collection start time: ${state.collectionStartTime}`);
    
    // Update UI with current status
    setState(prev => ({ 
      ...prev, 
      error: `📊 Analyzing data: ${state.collectedData.length} points, exported: ${!!(state.mintResult?.exportedData)}`
    }));
    
    // Validate that we have exported data to mint
    if (!state.mintResult || !state.mintResult.exportedData) {
      debugLog(mintId, 'error', 'VALIDATION FAILED: No exported data available for minting', {
        hasMintResult: !!state.mintResult,
        hasExportedData: !!(state.mintResult?.exportedData)
      });
      setState(prev => ({ 
        ...prev, 
        error: 'Please export data first before minting to blockchain'
      }));
      return;
    }
    console.log(`✅ [${mintId}] VALIDATION PASSED: Exported data available`);
    console.log(`✅ [${mintId}] - Export method: ${state.mintResult.exportInfo?.exportMethod}`);
    console.log(`✅ [${mintId}] - Export file size: ${state.mintResult.exportInfo?.fileSize}`);
    console.log(`✅ [${mintId}] - Export timestamp: ${state.mintResult.exportInfo?.exportedAt}`);

    // Validate wallet connection
    console.log(`🔗 [${mintId}] ===== WALLET VALIDATION =====`);
    console.log(`🔗 [${mintId}] Main wallet analysis:`);
    console.log(`🔗 [${mintId}] - Is connected: ${wallet.isConnected}`);
    console.log(`🔗 [${mintId}] - Address: ${wallet.address || 'null'}`);
    console.log(`🔗 [${mintId}] - Address length: ${wallet.address?.length || 0}`);
    
    if (!wallet.isConnected || !wallet.address) {
      debugLog(mintId, 'error', 'WALLET VALIDATION FAILED: Main wallet not connected', {
        isConnected: wallet.isConnected,
        address: wallet.address || 'undefined'
      });
      setState(prev => ({ 
        ...prev, 
        error: 'Please connect your wallet before minting'
      }));
      return;
    }
    console.log(`✅ [${mintId}] WALLET VALIDATION PASSED: Main wallet connected`);

    // Check if Thirdweb wallet is connected (now the main wallet)
    console.log(`⛓️ [${mintId}] ===== WALLET VALIDATION =====`);
    console.log(`⛓️ [${mintId}] Thirdweb wallet analysis:`);
    console.log(`⛓️ [${mintId}] - Is connected: ${wallet.isConnected}`);
    console.log(`⛓️ [${mintId}] - Address: ${wallet.address || 'null'}`);
    console.log(`⛓️ [${mintId}] - Address length: ${wallet.address?.length || 0}`);
    console.log(`⛓️ [${mintId}] - Chain ID: ${wallet.chainId || 'null'}`);
    console.log(`⛓️ [${mintId}] - Error: ${wallet.error || 'none'}`);
    console.log(`⛓️ [${mintId}] - Wallet object exists: ${!!wallet.wallet}`);
    
    if (!wallet.isConnected || !wallet.address) {
      console.error(`❌ [${mintId}] WALLET VALIDATION FAILED: Thirdweb wallet not connected`);
      console.error(`❌ [${mintId}] Wallet state:`, {
        isConnected: wallet.isConnected,
        address: wallet.address,
        chainId: wallet.chainId,
        error: wallet.error
      });
      
      setState(prev => ({ 
        ...prev, 
        error: 'Wallet connection required for blockchain minting. Please connect your MetaMask wallet via Thirdweb and try again.'
      }));
      return;
    }
    console.log(`✅ [${mintId}] WALLET VALIDATION PASSED: Thirdweb wallet connected`);

    // Check if real transaction signing is available
    console.log(`🔐 [${mintId}] ===== TRANSACTION SIGNING CAPABILITY CHECK =====`);
    const canSignTransactions = wallet.canSignTransactions ? wallet.canSignTransactions() : false;
    console.log(`🔐 [${mintId}] - Can sign real transactions: ${canSignTransactions}`);
    console.log(`🔐 [${mintId}] - Wallet type: ${canSignTransactions ? 'Real Thirdweb Connection' : 'Limited Connection'}`);
    
    if (!canSignTransactions) {
      console.log(`⚠️ [${mintId}] WARNING: Wallet cannot sign real transactions`);
      console.log(`💡 [${mintId}] For real blockchain minting, ensure proper Thirdweb connection`);
      console.log(`🎭 [${mintId}] Proceeding with simulation mode for demo purposes`);
      
      setState(prev => ({ 
        ...prev, 
        error: 'For real blockchain transactions, please ensure proper MetaMask connection via Thirdweb. Currently in demo mode.'
      }));
      
      // Continue with simulation mode
    } else {
      console.log(`✅ [${mintId}] REAL TRANSACTION SIGNING AVAILABLE`);
      console.log(`🔐 [${mintId}] Wallet can sign real blockchain transactions`);
    }

    console.log(`🎯 [${mintId}] ===== STARTING MINTING PROCESS =====`);
    setState(prev => ({ ...prev, isMinting: true, error: null }));

    try {
      console.log(`📊 [${mintId}] ===== METADATA PREPARATION =====`);
      console.log(`📊 [${mintId}] Extracting exported data...`);
      
      const exportedData = state.mintResult.exportedData;
      console.log(`📊 [${mintId}] Exported data structure:`, {
        hasMetadata: !!exportedData.metadata,
        hasSensorData: !!exportedData.sensorData,
        metadataKeys: exportedData.metadata ? Object.keys(exportedData.metadata) : [],
        sensorDataKeys: exportedData.sensorData ? Object.keys(exportedData.sensorData) : [],
        totalDataPoints: exportedData.sensorData?.summary?.totalPoints || 0
      });
      
      const collectionDuration = state.collectionStartTime 
        ? Date.now() - state.collectionStartTime 
        : 0;
      console.log(`📊 [${mintId}] Collection duration calculation:`, {
        startTime: state.collectionStartTime,
        currentTime: Date.now(),
        durationMs: collectionDuration,
        durationSeconds: Math.round(collectionDuration / 1000)
      });

      // Prepare file data early for use in metadata
      const filename = `kinetic-imu-data-${Date.now()}.json`;
      const jsonContent = state.mintResult?.jsonString;
      
      // Validate that we have the JSON content
      if (!jsonContent) {
        console.error(`❌ [${mintId}] Missing JSON content - user must export data first`);
        throw new Error('No exported data found. Please export your IMU data first before minting to blockchain.');
      }

      // Prepare IP Metadata for Story Protocol (matching API expectations)
      const ipMetadata = {
        title: `Kinetic IMU Data Collection - ${new Date().toLocaleDateString()}`,
        description: `IMU sensor data collected from Kinetic ESP32C3 device over ${Math.round(collectionDuration / 1000)} seconds. Contains ${state.collectedData.length} data points with accelerometer and gyroscope readings.`,
        ipType: 'sensor_data',
        relationships: [],
        createdAt: new Date().toISOString(),
        creators: [{
          name: 'Kinetic Device User',
          address: wallet.address,
          contributionPercent: 100
        }],
        attributes: [
          { key: 'device_type', value: 'ESP32C3_MPU6050' },
          { key: 'data_points', value: state.collectedData.length.toString() },
          { key: 'collection_duration_seconds', value: Math.round(collectionDuration / 1000).toString() },
          { key: 'export_method', value: exportedData.metadata?.collectionInfo?.exportMethod || 'json' },
          { key: 'wallet_address', value: wallet.address },
          { key: 'collection_start_time', value: state.collectionStartTime?.toString() || '' },
          { key: 'avg_acceleration_x', value: calculateAverageAcceleration(state.collectedData).x.toFixed(3) },
          { key: 'avg_acceleration_y', value: calculateAverageAcceleration(state.collectedData).y.toFixed(3) },
          { key: 'avg_acceleration_z', value: calculateAverageAcceleration(state.collectedData).z.toFixed(3) },
          { key: 'avg_gyroscope_x', value: calculateAverageGyroscope(state.collectedData).x.toFixed(3) },
          { key: 'avg_gyroscope_y', value: calculateAverageGyroscope(state.collectedData).y.toFixed(3) },
          { key: 'avg_gyroscope_z', value: calculateAverageGyroscope(state.collectedData).z.toFixed(3) },
          { key: 'data_file_size', value: jsonContent.length.toString() },
          { key: 'data_file_name', value: filename },
          { key: 'data_available', value: 'true' }
        ],
        tags: ['kinetic', 'imu', 'sensor-data', 'esp32c3', 'accelerometer', 'gyroscope'],
        app: {
          id: 'kinetic-imu-app',
          name: 'Kinetic IMU Dashboard',
          website: 'https://kinetic.app'
        }
      };

      // Prepare NFT Metadata (matching API expectations)
      const nftMetadata = {
        name: `Kinetic IMU Data #${Date.now()}`,
        description: `NFT representing IMU sensor data collected from Kinetic device. ${state.collectedData.length} data points over ${Math.round(collectionDuration / 1000)} seconds.`,
        image: 'https://kinetic.app/images/kinetic-nft-placeholder.png', // Placeholder image
        attributes: [
          { key: 'device_type', value: 'ESP32C3_MPU6050' },
          { key: 'data_points', value: state.collectedData.length.toString() },
          { key: 'duration_seconds', value: Math.round(collectionDuration / 1000).toString() },
          { key: 'collection_date', value: new Date().toLocaleDateString() },
          { key: 'export_format', value: 'JSON' },
          { key: 'avg_acceleration_magnitude', value: Math.sqrt(
            Math.pow(calculateAverageAcceleration(state.collectedData).x, 2) +
            Math.pow(calculateAverageAcceleration(state.collectedData).y, 2) +
            Math.pow(calculateAverageAcceleration(state.collectedData).z, 2)
          ).toFixed(3) },
          { key: 'avg_gyroscope_magnitude', value: Math.sqrt(
            Math.pow(calculateAverageGyroscope(state.collectedData).x, 2) +
            Math.pow(calculateAverageGyroscope(state.collectedData).y, 2) +
            Math.pow(calculateAverageGyroscope(state.collectedData).z, 2)
          ).toFixed(3) }
        ],
        external_url: 'https://kinetic.app'
      };

      console.log(`📊 [${mintId}] Metadata prepared:`, {
        ipTitle: ipMetadata.title,
        nftName: nftMetadata.name,
        dataPoints: state.collectedData.length,
        walletAddress: wallet.address
      });

      console.log(`🌐 [${mintId}] ===== API REQUEST PREPARATION =====`);
      
      // File data and filename already prepared above for metadata use
      
      // Convert to base64 using the same method as the demo
      const base64WithPrefix = `data:application/json;base64,${btoa(jsonContent)}`;
      const base64Data = base64WithPrefix.split(',')[1]; // Extract just the base64 part
      
      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        console.error(`❌ [${mintId}] Failed to create base64 data`);
        throw new Error('Failed to prepare file data for upload. Please try exporting your data again.');
      }
      
      console.log(`📁 [${mintId}] File preparation using demo format:`, {
        filename: filename,
        originalSize: jsonContent.length,
        base64Size: base64Data.length,
        hasPrefix: base64WithPrefix.includes('data:'),
        extractedCorrectly: !base64Data.includes('data:')
      });

      // Prepare request using the working CLI format
      // This format works with /api/cli/mint-file endpoint and includes file uploads
      const prepareMintRequest = {
        userAddress: wallet.address,
        filePath: `./kinetic-imu-data-${Date.now()}.json`,
        fileData: base64Data, // Clean base64 without data URL prefix
        filename: filename,
        contentType: 'application/json'
      };
      
      // Validate the prepared request
      if (!prepareMintRequest.userAddress || !prepareMintRequest.fileData || !prepareMintRequest.filename) {
        console.error(`❌ [${mintId}] Invalid prepareMintRequest:`, {
          hasUserAddress: !!prepareMintRequest.userAddress,
          hasFileData: !!prepareMintRequest.fileData,
          hasFilename: !!prepareMintRequest.filename,
          fileDataLength: prepareMintRequest.fileData?.length || 0
        });
        throw new Error('Failed to prepare mint request. Missing required data.');
      }
      
      // File data is now included directly in the request
      console.log(`📁 [${mintId}] File data included in CLI format request:`, {
        filename: filename,
        dataSize: base64Data?.length || 0,
        originalSize: jsonContent?.length || 0,
        filePath: prepareMintRequest.filePath
      });

      console.log(`🌐 [${mintId}] CLI API request structure:`, {
        userAddress: prepareMintRequest.userAddress,
        filePath: prepareMintRequest.filePath,
        filename: prepareMintRequest.filename,
        contentType: prepareMintRequest.contentType,
        fileDataLength: prepareMintRequest.fileData?.length || 0,
        totalRequestSize: JSON.stringify(prepareMintRequest).length
      });
      
      // Log detailed request for debugging
      console.log(`🌐 [${mintId}] Full CLI API request:`, 
        JSON.stringify(prepareMintRequest, null, 2)
      );
      
      // Validate CLI request structure (simpler validation)
      console.log(`🔍 [${mintId}] Validating CLI request structure...`);
      
      if (!prepareMintRequest.userAddress) {
        throw new Error('Missing userAddress in request');
      }
      if (!prepareMintRequest.userAddress.startsWith('0x') || prepareMintRequest.userAddress.length !== 42) {
        throw new Error('Invalid userAddress format - must be a valid Ethereum address');
      }
      
      if (!prepareMintRequest.filename || !prepareMintRequest.filePath) {
        throw new Error('Missing filename or filePath in request');
      }
      
      if (!prepareMintRequest.fileData) {
        throw new Error('Missing fileData in request');
      }
      
      if (!prepareMintRequest.contentType) {
        throw new Error('Missing contentType in request');
      }
      
      // Validate base64 format
      if (!prepareMintRequest.fileData || !prepareMintRequest.fileData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error('fileData is not valid base64');
      }
      
      // Additional validation for data size (prevent overly large requests)
      const requestSizeKB = JSON.stringify(prepareMintRequest).length / 1024;
      if (requestSizeKB > 1024) { // 1MB limit
        console.warn(`⚠️ [${mintId}] Large request size: ${requestSizeKB.toFixed(2)}KB`);
      }
      
      // Validate JSON content can be parsed
      try {
        const decodedContent = atob(prepareMintRequest.fileData);
        JSON.parse(decodedContent);
        console.log(`✅ [${mintId}] File data validation passed`);
      } catch (validationError: any) {
        console.error(`❌ [${mintId}] File data validation failed:`, validationError);
        throw new Error('Invalid JSON content in file data');
      }
      
      console.log(`✅ [${mintId}] CLI request validation passed:`, {
        userAddress: prepareMintRequest.userAddress,
        filename: prepareMintRequest.filename,
        filePath: prepareMintRequest.filePath,
        contentType: prepareMintRequest.contentType,
        fileDataLength: prepareMintRequest.fileData?.length || 0
      });
      
      console.log(`🌐 [${mintId}] ===== CALLING CLI MINT API =====`);
      console.log(`🌐 [${mintId}] API URL: https://surreal-base.vercel.app/api/cli/mint-file`);
      console.log(`🌐 [${mintId}] Request timestamp: ${new Date().toISOString()}`);
      
      // Log the complete CLI request for debugging
      console.log(`🌐 [${mintId}] Complete CLI API request:`, {
        url: 'https://surreal-base.vercel.app/api/cli/mint-file',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        bodySize: JSON.stringify(prepareMintRequest).length
      });
      
      // Debug the file data specifically
      console.log(`📁 [${mintId}] File data debug info:`, {
        filename: prepareMintRequest.filename,
        filePath: prepareMintRequest.filePath,
        dataType: typeof prepareMintRequest.fileData,
        dataLength: prepareMintRequest.fileData?.length || 0,
        dataPreview: prepareMintRequest.fileData ? prepareMintRequest.fileData.substring(0, 50) + '...' : 'No data',
        contentType: prepareMintRequest.contentType,
        hasData: !!prepareMintRequest.fileData,
        isString: typeof prepareMintRequest.fileData === 'string',
        isValidBase64: prepareMintRequest.fileData ? /^[A-Za-z0-9+/]*={0,2}$/.test(prepareMintRequest.fileData) : false
      });
      
      // Call the CLI mint API using the deployed Universal Minting Engine with retry logic
      const API_BASE_URL = 'https://surreal-base.vercel.app';
      let response: Response;
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        attempt++;
        console.log(`🌐 [${mintId}] Making CLI fetch request (attempt ${attempt}/${maxRetries})...`);
        
        try {
          response = await fetch(`${API_BASE_URL}/api/cli/mint-file`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Kinetic-IMU-App/1.0'
            },
            body: JSON.stringify(prepareMintRequest)
          });
          
          console.log(`🌐 [${mintId}] CLI fetch request completed (attempt ${attempt})`);
          
          // If successful or non-retryable error, break out of retry loop
          if (response.ok || response.status < 500) {
            break;
          }
          
          // For 5xx errors, check if we should retry
          if (response.status >= 500 && attempt < maxRetries) {
            console.log(`⚠️ [${mintId}] Server error ${response.status}, attempt ${attempt}/${maxRetries}`);
            
            // Try to get error details to check if retryable
            try {
              const errorText = await response.text();
              const errorData = JSON.parse(errorText);
              
              if (errorData.error?.retryable) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(`🔄 [${mintId}] Retryable error, waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry
              } else {
                console.log(`❌ [${mintId}] Non-retryable server error`);
                break; // Don't retry
              }
            } catch (parseError) {
              console.log(`⚠️ [${mintId}] Could not parse error response, retrying anyway...`);
              const delay = Math.pow(2, attempt) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Retry
            }
          }
          
        } catch (fetchError: any) {
          console.error(`❌ [${mintId}] CLI fetch request failed (attempt ${attempt}):`, fetchError);
          console.error(`❌ [${mintId}] Network error details:`, {
            message: fetchError?.message,
            code: fetchError?.code,
            type: fetchError?.type,
            stack: fetchError?.stack
          });
          
          // For network errors, retry if we have attempts left
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`🔄 [${mintId}] Network error, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          } else {
            throw new Error(`Network request failed after ${maxRetries} attempts: ${fetchError.message || 'Unknown network error'}`);
          }
        }
      }
      
      // If we exhausted all retries and still have an error response
      if (!response!) {
        throw new Error(`API request failed after ${maxRetries} attempts`);
      }

      console.log(`🌐 [${mintId}] ===== API RESPONSE ANALYSIS =====`);
      console.log(`🌐 [${mintId}] Response status: ${response.status} ${response.statusText}`);
      console.log(`🌐 [${mintId}] Response headers:`, {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server')
      });

      if (!response.ok) {
        console.error(`❌ [${mintId}] API REQUEST FAILED`);
        console.error(`❌ [${mintId}] Status: ${response.status} ${response.statusText}`);
        console.error(`❌ [${mintId}] Response URL: ${response.url}`);
        console.error(`❌ [${mintId}] Response type: ${response.type}`);
        console.error(`❌ [${mintId}] Attempt: ${attempt}/${maxRetries}`);
        
        let errorData;
        let errorMessage = response.statusText;
        let rawResponse = '';
        
        try {
          // First try to get the raw text response
          rawResponse = await response.text();
          console.error(`❌ [${mintId}] Raw error response:`, rawResponse);
          
          // Then try to parse it as JSON
          if (rawResponse) {
            try {
              errorData = JSON.parse(rawResponse);
              console.error(`❌ [${mintId}] Parsed error response:`, errorData);
              
              // Extract more specific error information
              if (errorData?.error) {
                if (typeof errorData.error === 'string') {
                  errorMessage = errorData.error;
                } else if (errorData.error.message) {
                  errorMessage = errorData.error.message;
                }
                
                if (errorData.error.details) {
                  console.error(`❌ [${mintId}] Error details:`, errorData.error.details);
                }
                
                if (errorData.error.code) {
                  console.error(`❌ [${mintId}] Error code:`, errorData.error.code);
                }
                
                // Log retry information
                if (errorData.error.retryable) {
                  console.log(`🔄 [${mintId}] Error is marked as retryable (attempt ${attempt}/${maxRetries})`);
                } else {
                  console.log(`❌ [${mintId}] Error is marked as non-retryable`);
                }
              } else if (errorData?.message) {
                errorMessage = errorData.message;
              }
            } catch (jsonParseError) {
              console.error(`❌ [${mintId}] Could not parse error response as JSON:`, jsonParseError);
              errorMessage = rawResponse || response.statusText;
            }
          }
        } catch (textError) {
          console.error(`❌ [${mintId}] Could not read error response text:`, textError);
          errorMessage = response.statusText;
        }
        
        // Provide more specific error messages based on status code
        let finalErrorMessage = errorMessage;
        if (response.status === 400) {
          finalErrorMessage = `Invalid request format: ${errorMessage}`;
          console.error(`❌ [${mintId}] Request validation failed. Check the request format against API expectations.`);
        } else if (response.status === 500) {
          finalErrorMessage = `Server error: ${errorMessage}. This may be a temporary issue with the minting service.`;
          console.error(`❌ [${mintId}] Internal server error. The API may be experiencing issues.`);
          
          // For 500 errors, suggest retry if we haven't exhausted attempts
          if (attempt < maxRetries) {
            console.log(`💡 [${mintId}] Server error is often temporary - retry logic will attempt again`);
          }
        } else if (response.status === 429) {
          finalErrorMessage = `Rate limit exceeded: ${errorMessage}. Please wait a moment and try again.`;
        } else if (response.status === 404) {
          finalErrorMessage = `API endpoint not found: ${errorMessage}. Check if the API URL is correct.`;
        } else if (response.status === 403) {
          finalErrorMessage = `Access forbidden: ${errorMessage}. Check API permissions.`;
        }
        
        console.error(`❌ [${mintId}] Final error message: ${finalErrorMessage}`);
        throw new Error(`API Error (${response.status}): ${finalErrorMessage}`);
      }

      console.log(`✅ [${mintId}] CLI API REQUEST SUCCESSFUL`);
      const prepareMintResult = await response.json();
      
      console.log(`📊 [${mintId}] CLI API response structure:`, {
        success: prepareMintResult.success,
        hasTransaction: !!prepareMintResult.transaction,
        hasMetadata: !!prepareMintResult.metadata,
        hasUploadedFiles: !!prepareMintResult.uploadedFiles,
        hasAdditionalData: !!prepareMintResult.additionalData,
        transactionKeys: prepareMintResult.transaction ? Object.keys(prepareMintResult.transaction) : [],
        metadataKeys: prepareMintResult.metadata ? Object.keys(prepareMintResult.metadata) : [],
        uploadedFilesCount: prepareMintResult.uploadedFiles?.length || 0
      });
      
      console.log(`📊 [${mintId}] Full CLI API response:`, prepareMintResult);
      
      // Log file upload success
      if (prepareMintResult.uploadedFiles && prepareMintResult.uploadedFiles.length > 0) {
        console.log(`🎉 [${mintId}] FILE UPLOAD SUCCESS!`, {
          uploadedFiles: prepareMintResult.uploadedFiles.map((file: any) => ({
            filename: file.filename,
            ipfsHash: file.ipfsHash,
            url: file.url
          }))
        });
      }

      console.log(`🔍 [${mintId}] ===== TRANSACTION VALIDATION =====`);
      if (!prepareMintResult.success || !prepareMintResult.transaction) {
        console.error(`❌ [${mintId}] TRANSACTION PREPARATION FAILED`);
        console.error(`❌ [${mintId}] - success: ${prepareMintResult.success}`);
        console.error(`❌ [${mintId}] - has transaction: ${!!prepareMintResult.transaction}`);
        console.error(`❌ [${mintId}] - error: ${prepareMintResult.error?.message || 'none'}`);
        console.error(`❌ [${mintId}] Full response:`, prepareMintResult);
        throw new Error(`Transaction preparation failed: ${prepareMintResult.error?.message || 'Unknown error'}`);
      }

      console.log(`✅ [${mintId}] TRANSACTION PREPARATION SUCCESSFUL`);
      const transaction = prepareMintResult.transaction;
      
      console.log(`📤 [${mintId}] Transaction details:`, {
        to: transaction.to,
        value: transaction.value,
        gasEstimate: transaction.gasEstimate,
        dataLength: transaction.data?.length,
        dataPreview: transaction.data?.substring(0, 50) + '...'
      });
      
      console.log(`📤 [${mintId}] IPFS metadata:`, {
        ipfsHash: prepareMintResult.metadata?.ipfsHash,
        nftIpfsHash: prepareMintResult.metadata?.nftIpfsHash,
        uploadedFiles: prepareMintResult.uploadedFiles?.length || 0
      });

      console.log(`✍️ [${mintId}] ===== TRANSACTION SIGNING =====`);
      console.log(`✍️ [${mintId}] Preparing to sign transaction with Thirdweb...`);
      console.log(`✍️ [${mintId}] Wallet state before signing:`, {
        isConnected: wallet.isConnected,
        address: wallet.address,
        chainId: wallet.chainId,
        hasWalletObject: !!wallet.wallet
      });
      
      const txParams = {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value || '0'
      };
      
      console.log(`✍️ [${mintId}] Transaction parameters:`, {
        to: txParams.to,
        value: txParams.value,
        dataLength: txParams.data?.length,
        dataType: typeof txParams.data,
        gasEstimate: transaction.gasEstimate
      });
      
      let txHash;
      let retryCount = 0;
      const maxTxRetries = 2;
      
      while (retryCount <= maxTxRetries) {
        try {
          console.log(`🔐 [${mintId}] Attempt ${retryCount + 1}/${maxTxRetries + 1}: Calling wallet.sendTransaction()...`);
          console.log(`🔐 [${mintId}] Timestamp: ${new Date().toISOString()}`);
          
          txHash = await wallet.sendTransaction(txParams);
          
          console.log(`✅ [${mintId}] TRANSACTION SENT SUCCESSFULLY!`);
          console.log(`✅ [${mintId}] Transaction hash: ${txHash}`);
          console.log(`✅ [${mintId}] Hash length: ${txHash?.length}`);
          console.log(`✅ [${mintId}] Hash type: ${typeof txHash}`);
          
          // Success - break out of retry loop
          break;
          
        } catch (txError: any) {
          console.error(`❌ [${mintId}] ===== TRANSACTION ATTEMPT ${retryCount + 1} FAILED =====`);
          console.error(`❌ [${mintId}] Error type: ${typeof txError}`);
          console.error(`❌ [${mintId}] Error name: ${txError?.name}`);
          console.error(`❌ [${mintId}] Error message: ${txError?.message}`);
          console.error(`❌ [${mintId}] Error code: ${txError?.code}`);
          console.error(`❌ [${mintId}] Error stack:`, txError?.stack);
          console.error(`❌ [${mintId}] Full error object:`, txError);
          
          // Handle specific Thirdweb session errors with retry logic
          if ((txError.message?.includes('session') || txError.message?.includes('No matching key')) && retryCount < maxTxRetries) {
            console.error(`❌ [${mintId}] SESSION ERROR DETECTED - Attempting recovery...`);
            console.log(`🔄 [${mintId}] Retry ${retryCount + 1}/${maxTxRetries}: Attempting wallet reconnection...`);
            
            try {
              // Try to reconnect the wallet
              await wallet.connect();
              console.log(`✅ [${mintId}] Wallet reconnection successful, retrying transaction...`);
              
              // Add a small delay before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
              continue; // Retry the transaction
              
            } catch (reconnectError: any) {
              console.error(`❌ [${mintId}] Wallet reconnection failed:`, reconnectError);
              retryCount++;
              
              if (retryCount > maxTxRetries) {
                throw new Error('Wallet session expired and reconnection failed. Please disconnect and reconnect your wallet manually, then try again.');
              }
              continue; // Try one more time
            }
          } else if (txError.message?.includes('User rejected') || txError.code === 4001) {
            console.error(`❌ [${mintId}] USER REJECTION DETECTED`);
            throw new Error('Transaction was cancelled by user.');
          } else {
            console.error(`❌ [${mintId}] UNKNOWN TRANSACTION ERROR`);
            throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
          }
        }
      }
      
      // If we get here without a txHash, all retries failed
      if (!txHash) {
        console.error(`❌ [${mintId}] All transaction attempts failed after ${maxTxRetries + 1} tries`);
        throw new Error('Transaction failed after multiple attempts. Please try again.');
      }

      console.log(`🎉 [${mintId}] ===== MINTING SUCCESS =====`);
      console.log(`🎉 [${mintId}] Creating success state...`);
      
      const successData = {
        status: 'minted',
        transactionHash: txHash,
        ipfsHashes: prepareMintResult.metadata,
        uploadedFiles: prepareMintResult.uploadedFiles,
        message: `Successfully minted IMU data to blockchain with file uploads! Transaction: ${txHash.slice(0, 10)}... | Files uploaded: ${prepareMintResult.uploadedFiles?.length || 0}`,
        mintedAt: new Date().toISOString(),
        mintId: mintId
      };
      
      console.log(`🎉 [${mintId}] Success data:`, successData);
      
      // Update state with successful minting result
      setState(prev => ({
        ...prev,
        isMinting: false,
        mintResult: {
          ...prev.mintResult,
          blockchainMint: successData
        },
      }));

      console.log(`🎉 [${mintId}] ===== BLOCKCHAIN MINTING COMPLETED SUCCESSFULLY =====`);
      console.log(`🎉 [${mintId}] Final summary:`, {
        processId: mintId,
        transactionHash: txHash,
        dataPoints: state.collectedData.length,
        collectionDuration: Math.round(collectionDuration / 1000),
        completedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`❌ [${mintId}] ===== BLOCKCHAIN MINTING FAILED =====`);
      console.error(`❌ [${mintId}] Error timestamp: ${new Date().toISOString()}`);
      console.error(`❌ [${mintId}] Error type: ${typeof error}`);
      console.error(`❌ [${mintId}] Error constructor: ${error?.constructor?.name}`);
      console.error(`❌ [${mintId}] Error message: ${error?.message}`);
      console.error(`❌ [${mintId}] Error code: ${error?.code}`);
      console.error(`❌ [${mintId}] Error name: ${error?.name}`);
      console.error(`❌ [${mintId}] Error stack:`, error?.stack);
      console.error(`❌ [${mintId}] Full error object:`, error);
      
      // Log current state for debugging
      console.error(`❌ [${mintId}] State at error:`, {
        isCollecting: state.isCollecting,
        isMinting: state.isMinting,
        collectedDataLength: state.collectedData.length,
        hasExportedData: !!(state.mintResult?.exportedData),
        walletConnected: wallet.isConnected
      });
      
      let userFriendlyMessage = 'Blockchain minting failed. Please try again.';
      
      console.log(`🔍 [${mintId}] Analyzing error type...`);
      if (error?.message?.includes('User rejected') || error?.message?.includes('cancelled')) {
        console.log(`🔍 [${mintId}] Error type: USER_REJECTION`);
        userFriendlyMessage = 'Transaction was cancelled by user.';
      } else if (error?.message?.includes('session') || error?.message?.includes('No matching key')) {
        console.log(`🔍 [${mintId}] Error type: SESSION_ERROR`);
        userFriendlyMessage = 'Wallet session expired. Please disconnect and reconnect your wallet, then try minting again.';
      } else if (error?.message?.includes('reconnection failed')) {
        console.log(`🔍 [${mintId}] Error type: RECONNECTION_FAILED`);
        userFriendlyMessage = 'Wallet connection lost. Please disconnect and reconnect your wallet manually, then try again.';
      } else if (error?.message?.includes('insufficient funds')) {
        console.log(`🔍 [${mintId}] Error type: INSUFFICIENT_FUNDS`);
        userFriendlyMessage = 'Insufficient funds for transaction. Please add ETH to your wallet.';
      } else if (error?.message?.includes('API Error')) {
        userFriendlyMessage = `Minting service error: ${error.message}`;
      } else if (error?.message?.includes('network')) {
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message) {
        userFriendlyMessage = `Minting failed: ${error.message}`;
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

  // Debug function to test logging
  const testLogging = () => {
    console.log('🧪 TEST LOG - This is a normal log');
    console.warn('🧪 TEST WARN - This is a warning log');
    console.error('🧪 TEST ERROR - This is an error log');
    setState(prev => ({ ...prev, error: '🧪 Test logging function called - check console!' }));
  };

  const collectionDuration = state.collectionStartTime 
    ? Date.now() - state.collectionStartTime 
    : 0;

  return {
    startCollection,
    stopCollection,
    mintCollectedData,
    mintToBlockchain,
    addDataPoint,
    clearData,
    testLogging, // Add this for debugging
    isCollecting: state.isCollecting,
    isMinting: state.isMinting,
    collectedData: state.collectedData,
    collectionDuration,
    mintResult: state.mintResult,
    error: state.error,
    isWalletConnected: wallet.isConnected,
    walletAddress: wallet.address || undefined,
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