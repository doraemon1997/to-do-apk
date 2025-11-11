import { useRef, useEffect } from 'react';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

interface SwipeNavigationParams {
  navigation: BottomTabNavigationProp<any>;
  currentRoute: string;
  routes: string[];
}

export const useSwipeNavigation = ({ navigation, currentRoute, routes }: SwipeNavigationParams) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx } = gestureState;
        const threshold = 50; // minimum swipe distance

        if (Math.abs(dx) > threshold) {
          const currentIndex = routes.indexOf(currentRoute);
          if (dx > 0 && currentIndex > 0) {
            // Swiped right: go to previous tab
            navigation.jumpTo(routes[currentIndex - 1]);
          } else if (dx < 0 && currentIndex < routes.length - 1) {
            // Swiped left: go to next tab
            navigation.jumpTo(routes[currentIndex + 1]);
          }
        }
      },
    })
  ).current;

  return panResponder;
};

export default useSwipeNavigation;
