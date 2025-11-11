import React, { useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedScreen = ({ children, style }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      return () => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      };
    }, [opacity])
  );

  return (
    <Animated.View style={[{ flex: 1, opacity }, style]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedScreen;
