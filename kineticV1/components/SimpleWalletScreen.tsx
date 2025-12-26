import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { usePrivy, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useLogin } from '@privy-io/expo/ui';
import * as Clipboard from 'expo-clipboard';
import { SectionIcon } from './SectionIcon';

// Colors from STYLE.md
const colors = {
    background: '#0a0a0f',
    foreground: '#ffffff',
    card: '#1a1a1f',
    cardForeground: '#ffffff',
    primary: '#9333ea',
    primaryForeground: '#ffffff',
    accent: '#06b6d4',
    destructive: '#ef4444',
    gray: {
        400: '#9ca3af',
        500: '#6b7280',
        700: '#374151',
        800: '#1f2937',
    },
    purple: {
        300: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
    }
};

// Network configurations
const NETWORKS = {
    mantleSepolia: {
        chainId: '0x138b',
        name: 'Mantle Sepolia',
        symbol: 'MNT',
        explorer: 'sepolia.mantlescan.xyz',
        rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    },
    mantleMainnet: {
        chainId: '0x1388',
        name: 'Mantle',
        symbol: 'MNT',
        explorer: 'mantlescan.xyz',
        rpcUrl: 'https://rpc.mantle.xyz',
    },
};

export default function SimpleWalletScreen() {
    const [error, setError] = useState('');
    const [balance, setBalance] = useState('');
    const [currentChain, setCurrentChain] = useState('');
    const [currentSymbol, setCurrentSymbol] = useState('ETH');
    const [loadingBalance, setLoadingBalance] = useState(false);

    const {
        isReady,
        user,
        logout,
    } = usePrivy();

    const { login } = useLogin();
    const { wallets: embeddedWallets } = useEmbeddedEthereumWallet();

    // Get all wallets (both embedded and external)
    const userWallets = user?.linked_accounts?.filter(account => account.type === 'wallet') || [];
    const embeddedWallet = embeddedWallets?.[0];
    const externalWallets = userWallets.filter(wallet => wallet.wallet_client_type !== 'privy');

    // Use embedded wallet if available, otherwise use first external wallet
    const activeWallet = embeddedWallet || (externalWallets.length > 0 ? externalWallets[0] : null);

    const handleLogin = () => {
        // Don't attempt login if user is already authenticated
        if (user) {
            console.log('User is already logged in');
            return;
        }

        setError('');
        login({ loginMethods: ['email', 'google'] })
            .then((session) => {
                console.log('User logged in', session.user);
            })
            .catch((err) => {
                console.error('Login error:', err);
                // Don't show error if user is already logged in
                if (!err.message?.includes('already logged in')) {
                    setError(err.message || 'Login failed');
                }
            });
    };

    const handleLogout = () => {
        setError('');
        setBalance('');
        setCurrentChain('');
        logout();
    };

    // Copy wallet address to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Copied!', 'Wallet address copied to clipboard');
        } catch (error) {
            console.error('Failed to copy:', error);
            Alert.alert('Error', 'Failed to copy address');
        }
    };

    // Get currency symbol based on current chain
    const getCurrentSymbol = async () => {
        if (!embeddedWallet) return 'MNT';

        try {
            const provider = await embeddedWallet.getProvider();
            const chainId = await provider.request({
                method: 'eth_chainId',
            });

            // Convert hex chain ID to decimal for comparison
            const chainIdDecimal = parseInt(chainId, 16);
            console.log('Chain ID (hex):', chainId, 'Chain ID (decimal):', chainIdDecimal);

            // Only Mantle Sepolia is supported now
            if (chainIdDecimal === 5003) {
                console.log('Detected Mantle Sepolia - returning MNT');
                return 'MNT'; // Mantle Sepolia
            } else {
                console.log('Unknown chain - returning MNT as fallback');
                return 'MNT'; // Default fallback (since we only support Mantle)
            }
        } catch (error) {
            console.error('Failed to get chain for symbol:', error);
            return 'MNT';
        }
    };

    // Fetch wallet balance
    const fetchBalance = async () => {
        if (!embeddedWallet) return;

        setLoadingBalance(true);
        try {
            const provider = await embeddedWallet.getProvider();

            // Add a small delay to ensure network switch has completed
            await new Promise(resolve => setTimeout(resolve, 500));

            // First, get the current chain ID to make sure we're on the right network
            const chainId = await provider.request({
                method: 'eth_chainId',
            });

            console.log('Fetching balance on chain:', chainId, 'for address:', embeddedWallet.address);

            const balance = await provider.request({
                method: 'eth_getBalance',
                params: [embeddedWallet.address, 'latest'],
            });

            console.log('Raw balance response:', balance);

            // Convert from wei to ETH/MNT (both use 18 decimals)
            const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
            console.log('Converted balance:', balanceInEth);

            setBalance(balanceInEth.toFixed(6));

            // Update the symbol based on current chain
            const symbol = await getCurrentSymbol();
            setCurrentSymbol(symbol);
            console.log('Current symbol:', symbol);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            setBalance('Error');
        } finally {
            setLoadingBalance(false);
        }
    };

    // Get current chain info
    const getCurrentChain = async () => {
        if (!embeddedWallet) return;

        try {
            const provider = await embeddedWallet.getProvider();

            // Add a small delay to ensure we get the updated chain info
            await new Promise(resolve => setTimeout(resolve, 200));

            const chainId = await provider.request({
                method: 'eth_chainId',
            });

            console.log('getCurrentChain - Current chain ID:', chainId);

            const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
            const chainName = network ? network.name : `Unknown (${chainId})`;

            console.log('getCurrentChain - Current network:', chainName);
            setCurrentChain(chainName);
        } catch (error) {
            console.error('Failed to get chain info:', error);
            setCurrentChain('Unknown');
        }
    };

    // Load wallet data when authenticated
    useEffect(() => {
        if (user && embeddedWallet) {
            getCurrentChain();
            fetchBalance();
        }
    }, [user, embeddedWallet]);

    if (!isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading Privy...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Connect Your Wallet</Text>
                    <Text style={styles.subtitle}>
                        Sign in to create or connect a wallet
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleLogin}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>Sign In</Text>
                    </TouchableOpacity>

                    {error && (
                        <Text style={styles.errorText}>Error: {error}</Text>
                    )}

                    <Text style={styles.infoText}>
                        You can sign in with email, Google, or connect an existing wallet
                    </Text>
                </View>
            </View>
        );
    }

    // If user is authenticated but no wallet yet, show simple logout option
    if (!activeWallet) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>✅ Logged In</Text>
                    <Text style={styles.subtitle}>Setting up your wallet...</Text>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>User ID:</Text>
                        <Text style={styles.value}>{user?.id}</Text>
                    </View>

                    {user?.linked_accounts?.find(account => account.type === 'email') && (
                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>
                                {user.linked_accounts.find(account => account.type === 'email')?.address}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.destructiveButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>✅ Connected</Text>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.label}>User ID:</Text>
                    <Text style={styles.value}>{user?.id}</Text>
                </View>

                {user?.linked_accounts?.find(account => account.type === 'email') && (
                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>
                            {user.linked_accounts.find(account => account.type === 'email')?.address}
                        </Text>
                    </View>
                )}

                {activeWallet && (
                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Wallet Address:</Text>
                        <View style={styles.addressContainer}>
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.value}>
                                    {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
                                </Text>
                                <Text style={styles.valueSmall}>{activeWallet.address}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={() => copyToClipboard(activeWallet.address)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.copyButtonText}>📋</Text>
                            </TouchableOpacity>
                        </View>
                        {embeddedWallet && activeWallet?.address === embeddedWallet.address && (
                            <Text style={styles.walletType}>Embedded Wallet</Text>
                        )}
                        {!embeddedWallet && activeWallet && (
                            <Text style={styles.walletType}>External Wallet</Text>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.destructiveButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
            </View>

            {/* Wallet Details */}
            {embeddedWallet && (
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <SectionIcon name="wallet-outline" color={colors.accent} />
                        <Text style={styles.cardTitle}>Wallet Details</Text>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.balanceRow}>
                        <Text style={styles.label}>Balance:</Text>
                        {loadingBalance ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <View style={styles.balanceContainer}>
                                <Text style={styles.balanceValue}>{balance}</Text>
                                <Text style={styles.balanceSymbol}>
                                    {currentSymbol}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Current Network:</Text>
                        <Text style={styles.value}>{currentChain}</Text>
                        <Text style={styles.valueSmall}>
                            Chain ID: 5003 (0x138b)
                        </Text>
                        <Text style={styles.valueSmall}>
                            Network: Mantle Sepolia (Testnet)
                        </Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.primaryButton, styles.flexButton]}
                            onPress={fetchBalance}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Refresh Balance</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.secondaryButton, styles.flexButton]}
                            onPress={() => {
                                getCurrentChain();
                                fetchBalance();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Debug Info</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <SectionIcon name="information-circle-outline" color={colors.purple[500]} />
                    <Text style={styles.cardTitle}>What you can do:</Text>
                </View>
                <Text style={styles.listItem}>• Sign transactions on Mantle Sepolia</Text>
                <Text style={styles.listItem}>• Send/receive MNT tokens (testnet)</Text>
                <Text style={styles.listItem}>• Interact with Mantle smart contracts</Text>
                <Text style={styles.listItem}>• Test your dApp functionality</Text>
                <Text style={styles.listItem}>• View real-time MNT balance</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60, // Account for status bar
        minHeight: '100%',
    },
    card: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.gray[700],
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
        color: colors.foreground,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray[400],
        marginBottom: 24,
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.gray[700],
        alignItems: 'center',
    },
    destructiveButton: {
        backgroundColor: colors.destructive,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: colors.destructive,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: colors.primaryForeground,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: colors.gray[400],
        fontSize: 14,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 14,
        color: colors.gray[400],
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
    errorText: {
        fontSize: 14,
        color: colors.destructive,
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.gray[400],
        textAlign: 'center',
    },
    infoSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[700],
    },
    label: {
        fontSize: 14,
        color: colors.gray[400],
        marginBottom: 4,
        fontWeight: '600',
    },
    value: {
        fontSize: 16,
        color: colors.foreground,
        fontWeight: '500',
    },
    valueSmall: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 4,
        fontFamily: 'monospace',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    listItem: {
        fontSize: 14,
        color: colors.gray[400],
        marginBottom: 8,
        lineHeight: 20,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[700],
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.accent,
        marginRight: 4,
        fontFamily: 'monospace',
    },
    balanceSymbol: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    flexButton: {
        flex: 1,
        marginTop: 8,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addressTextContainer: {
        flex: 1,
    },
    copyButton: {
        backgroundColor: colors.gray[800],
        borderColor: colors.gray[700],
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginLeft: 12,
    },
    copyButtonText: {
        fontSize: 16,
    },
    walletType: {
        fontSize: 12,
        color: colors.purple[500],
        fontWeight: '500',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
});