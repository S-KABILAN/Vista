// LoginButton.js
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  Pressable,
  Easing
} from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

const LoginButton = ({ handleSignIn, isLoading }) => {
  const [fontsLoaded] = useFonts({
    "BlackHanSans": require("../assets/BlackHanSans-Regular.ttf")
  });
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
    
    // Add subtle animation to draw attention to login button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shadowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, []);

  if(!fontsLoaded) {
    return undefined;
  } else {
    SplashScreen.hideAsync();
  }

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '0.5deg']
  });
  
  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7]
  });
  
  const shadowRadius = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 10]
  });

  return (
    <Animated.View 
      style={[
        styles.box,
        { 
          transform: [
            { scale: scaleAnim },
            { rotate: rotateInterpolate }
          ],
          shadowOpacity: shadowOpacity,
          shadowRadius: shadowRadius
        }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleSignIn}
        style={({ pressed }) => [
          styles.loginButton,
          pressed ? styles.pressed : {}
        ]}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#5A9BFF', '#3560D0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Feather name="log-in" size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.textWrapper}>LOGIN</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: '100%',
    marginBottom: 15,
    shadowColor: '#5A9BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  loginButton: {
    height: 55,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  textWrapper: {
    color: '#ffffff',
    fontFamily: 'BlackHanSans',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});

export default LoginButton;
