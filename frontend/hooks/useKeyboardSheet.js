import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Keyboard, Platform } from 'react-native';

const { height } = Dimensions.get('window');

export default function useKeyboardSheet(tabBarHeight = 100) {
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, [sheetAnim]);

  const openSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const composerBoxMinHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 98],
  });

  const composerSheetHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tabBarHeight + 96, tabBarHeight + 122],
  });

  const floatingButtonBottom = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tabBarHeight + 96, height * 0.62],
  });

  return {
    composerBoxMinHeight,
    composerSheetHeight,
    floatingButtonBottom,
    openSheet,
  };
}