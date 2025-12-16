import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="ble"
				options={{
					title: "Kinetic",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "bluetooth" : "bluetooth-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="index"
				options={{
					title: "Connect",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "wallet" : "wallet-outline"}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
