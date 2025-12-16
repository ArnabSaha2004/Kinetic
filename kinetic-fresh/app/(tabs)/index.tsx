import { StyleSheet, View, useColorScheme } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SectionIcon } from "@/components/SectionIcon";
import { client } from "@/constants/thirdweb";
import { useEffect, useState } from "react";
import { ethereum } from "thirdweb/chains";
import {
	ConnectButton,
	useActiveAccount,
	useActiveWallet,
	useDisconnect,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { createWallet } from "thirdweb/wallets";
import {
	getUserEmail,
	inAppWallet,
} from "thirdweb/wallets/in-app";

const colors = {
	background: '#0a0a0f',
	foreground: '#ffffff',
	card: '#1a1a1f',
	primary: '#9333ea',
	primaryForeground: '#ffffff',
	secondary: '#374151',
	muted: '#1f2937',
	mutedForeground: '#9ca3af',
	accent: '#06b6d4',
	destructive: '#ef4444',
	border: '#374151',
	success: '#10b981',
};

const wallets = [
	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet", {
		appMetadata: {
			name: "Kinetic IMU Dashboard",
		},
		mobileConfig: {
			callbackURL: "com.kinetic.imu.dashboard://",
		},
	}),
	createWallet("me.rainbow"),
	createWallet("com.trustwallet.app"),
	createWallet("io.zerion.wallet"),
];

export default function WalletScreen() {
	const account = useActiveAccount();
	const theme = useColorScheme();

	return (
		<ThemedView style={styles.container}>
			<View style={styles.content}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.headerIcon}>
						<SectionIcon name="wallet-outline" color={colors.primary} size={32} />
					</View>
					<ThemedText type="title" style={styles.title}>
						Wallet Connection
					</ThemedText>
					<ThemedText style={styles.subtitle}>
						Connect your wallet to interact with the blockchain
					</ThemedText>
				</View>

				{/* Connection Status */}
				<View style={styles.statusCard}>
					<WalletStatus />
				</View>

				{/* Main Connect Button */}
				<View style={styles.connectSection}>
					<ConnectButton
						client={client}
						theme={theme || "dark"}
						wallets={wallets}
						chain={ethereum}
						connectButton={{
							label: account ? "Connected" : "Connect Wallet",
						}}
						connectModal={{
							title: "Connect to Kinetic",
							titleIcon: "https://via.placeholder.com/32x32/9333ea/ffffff?text=K",
						}}
					/>
				</View>

				{/* Connected Wallet Info */}
				{account && (
					<View style={styles.walletInfo}>
						<ConnectedWalletInfo />
					</View>
				)}
			</View>
		</ThemedView>
	);
}

const WalletStatus = () => {
	const account = useActiveAccount();
	const wallet = useActiveWallet();

	if (account && wallet) {
		return (
			<View style={styles.statusConnected}>
				<View style={styles.statusIndicator}>
					<View style={styles.statusDot} />
					<ThemedText style={styles.statusText}>Connected</ThemedText>
				</View>
				<ThemedText style={styles.walletType}>
					{wallet.id === "io.metamask" ? "MetaMask" : 
					 wallet.id === "com.coinbase.wallet" ? "Coinbase Wallet" :
					 wallet.id === "me.rainbow" ? "Rainbow" :
					 wallet.id === "com.trustwallet.app" ? "Trust Wallet" :
					 "Wallet"}
				</ThemedText>
			</View>
		);
	}

	return (
		<View style={styles.statusDisconnected}>
			<View style={styles.statusIndicator}>
				<View style={[styles.statusDot, styles.statusDotDisconnected]} />
				<ThemedText style={styles.statusText}>Not Connected</ThemedText>
			</View>
			<ThemedText style={styles.statusSubtext}>
				Connect your wallet to get started
			</ThemedText>
		</View>
	);
};

const ConnectedWalletInfo = () => {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const [email, setEmail] = useState<string | undefined>();
	const { disconnect } = useDisconnect();

	useEffect(() => {
		if (wallet && wallet.id === "inApp") {
			getUserEmail({ client }).then(setEmail);
		}
	}, [wallet]);

	if (!account || !wallet) return null;

	return (
		<View style={styles.walletDetails}>
			<View style={styles.addressSection}>
				<ThemedText style={styles.addressLabel}>Wallet Address</ThemedText>
				<ThemedText style={styles.addressValue}>
					{shortenAddress(account.address)}
				</ThemedText>
			</View>
			
			{email && (
				<View style={styles.emailSection}>
					<ThemedText style={styles.emailLabel}>Email</ThemedText>
					<ThemedText style={styles.emailValue}>{email}</ThemedText>
				</View>
			)}

			<View style={styles.disconnectSection}>
				<ThemedText 
					style={styles.disconnectButton}
					onPress={() => disconnect(wallet)}
				>
					Disconnect Wallet
				</ThemedText>
			</View>
		</View>
	);
};



const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		flex: 1,
		padding: 20,
		paddingTop: 80,
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	headerIcon: {
		marginBottom: 16,
	},
	title: {
		color: colors.foreground,
		textAlign: 'center',
		marginBottom: 8,
	},
	subtitle: {
		color: colors.mutedForeground,
		textAlign: 'center',
		fontSize: 16,
	},
	statusCard: {
		backgroundColor: colors.card,
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: 32,
	},
	statusConnected: {
		alignItems: 'center',
	},
	statusDisconnected: {
		alignItems: 'center',
	},
	statusIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.success,
		marginRight: 8,
	},
	statusDotDisconnected: {
		backgroundColor: colors.mutedForeground,
	},
	statusText: {
		color: colors.foreground,
		fontSize: 16,
		fontWeight: '600',
	},
	statusSubtext: {
		color: colors.mutedForeground,
		fontSize: 14,
		textAlign: 'center',
	},
	walletType: {
		color: colors.accent,
		fontSize: 14,
		fontWeight: '500',
	},
	connectSection: {
		marginBottom: 32,
	},
	walletInfo: {
		backgroundColor: colors.card,
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	walletDetails: {
		gap: 16,
	},
	addressSection: {
		alignItems: 'center',
	},
	addressLabel: {
		color: colors.mutedForeground,
		fontSize: 14,
		marginBottom: 4,
	},
	addressValue: {
		color: colors.foreground,
		fontSize: 18,
		fontWeight: '600',
		fontFamily: 'monospace',
	},
	emailSection: {
		alignItems: 'center',
	},
	emailLabel: {
		color: colors.mutedForeground,
		fontSize: 14,
		marginBottom: 4,
	},
	emailValue: {
		color: colors.accent,
		fontSize: 16,
		fontWeight: '500',
	},
	disconnectSection: {
		alignItems: 'center',
		marginTop: 8,
	},
	disconnectButton: {
		color: colors.destructive,
		fontSize: 16,
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
});
