import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorIndicatorProps {
  color: string;
  isConnected: boolean;
}

export const ColorIndicator: React.FC<ColorIndicatorProps> = ({ 
  color, 
  isConnected 
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [isConnected, pulseAnim]);

  const getColorHex = (colorName: string): string => {
    const colors: { [key: string]: string } = {
      red: '#FF3B30',
      blue: '#007AFF',
      green: '#34C759',
      yellow: '#FFCC00',
      purple: '#AF52DE',
      orange: '#FF9500',
      cyan: '#32D2C9',
      magenta: '#FF2D92',
      white: '#FFFFFF',
      black: '#000000',
    };
    return colors[colorName.toLowerCase()] || '#F2F2F7';
  };

  const getContrastColor = (backgroundColor: string): string => {
    // Simple contrast calculation
    const darkColors = ['black', 'blue', 'purple'];
    return darkColors.includes(color.toLowerCase()) ? '#FFFFFF' : '#000000';
  };

  const backgroundColor = getColorHex(color);
  const textColor = getContrastColor(backgroundColor);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.colorCircle,
          { 
            backgroundColor,
            transform: [{ scale: pulseAnim }],
            borderColor: backgroundColor === '#FFFFFF' ? '#E5E5EA' : backgroundColor,
          }
        ]}
      >
        <View style={styles.content}>
          <Ionicons 
            name="color-palette-outline" 
            size={32} 
            color={textColor} 
          />
          <Text style={[styles.colorText, { color: textColor }]}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Text>
          {isConnected && (
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.statusText, { color: textColor }]}>
                Live
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
      
      <Text style={styles.description}>
        {isConnected 
          ? 'Receiving real-time color data from your Arduino'
          : 'Connect to a device to see live color updates'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  colorCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
  },
  content: {
    alignItems: 'center',
  },
  colorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});