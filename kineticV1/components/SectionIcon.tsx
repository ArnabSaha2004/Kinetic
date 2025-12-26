import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SectionIconProps {
    name: IconName;
    color?: string;
    size?: number;
    style?: any;
}

export function SectionIcon({
    name,
    color = '#9333ea',
    size = 20,
    style
}: SectionIconProps) {
    return (
        <View style={[styles.iconContainer, style]}>
            <Ionicons
                name={name}
                size={size}
                color={color}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});