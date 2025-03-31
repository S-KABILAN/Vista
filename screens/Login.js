import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import InputTag from "../components/input";
import LoginButton from "../components/loginbutton";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const Login = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    BlackHanSans: require("../assets/BlackHanSans-Regular.ttf"),
  });

  const { login, googleSignIn, loading: authLoading, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();

    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  if (!fontsLoaded) {
    return undefined;
  } else {
    SplashScreen.hideAsync();
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // DO NOT navigate here - App.js will handle navigation based on onboarding status
        console.log("Login successful");
      } else {
        Alert.alert("Login Failed", result.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await googleSignIn();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Error", "Failed to sign in with Google");
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("Forgot");
  };

  const handleTextChange = (tagfor, text) => {
    setError("");
    if (tagfor === "EMAIL") {
      setEmail(text);
    } else if (tagfor === "PASSWORD") {
      setPassword(text);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      style={style.backgroundImage}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(20,20,40,0.8)"]}
        style={style.overlay}
      >
        <SafeAreaView style={style.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={style.container}
          >
            <ScrollView
              contentContainerStyle={style.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Floating travel elements */}
              <Animated.View
                style={[
                  style.floatingElement,
                  {
                    top: "10%",
                    right: "15%",
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.8],
                    }),
                    transform: [{ rotate: "15deg" }],
                  },
                ]}
              >
                <FontAwesome5 name="plane" size={24} color="white" />
              </Animated.View>

              <Animated.View
                style={[
                  style.floatingElement,
                  {
                    bottom: "25%",
                    left: "10%",
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.6],
                    }),
                    transform: [{ rotate: "-15deg" }],
                  },
                ]}
              >
                <FontAwesome5 name="map-marker-alt" size={24} color="white" />
              </Animated.View>

              <Animated.View
                style={[
                  style.floatingElement,
                  {
                    top: "30%",
                    left: "15%",
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.7],
                    }),
                    transform: [{ rotate: "-5deg" }],
                  },
                ]}
              >
                <FontAwesome5 name="suitcase" size={20} color="white" />
              </Animated.View>

              {/* Logo Section */}
              <Animated.View
                style={[
                  style.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { scale: logoScale },
                      { translateY: slideAnim },
                    ],
                  },
                ]}
              >
                <View style={style.logoCircle}>
                  <LinearGradient
                    colors={["#5A9BFF", "#3560D0"]}
                    style={style.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <FontAwesome5
                      name="globe-americas"
                      size={36}
                      color="white"
                    />
                  </LinearGradient>
                </View>
                <Text style={style.appTitle}>VISTA TRAVEL</Text>
                <Text style={style.tagline}>Your journey begins here</Text>
              </Animated.View>

              {/* Form Section - with glassmorphism effect */}
              <Animated.View
                style={[
                  style.formOuterContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={style.blurContainer}
                >
                  <View style={style.formContainer}>
                    <Text style={style.formTitle}>Welcome Back</Text>
                    <Text style={style.formSubtitle}>
                      Sign in to continue exploring
                    </Text>

                    <InputTag
                      tagfor="EMAIL"
                      onTextChange={handleTextChange}
                      placeholder="Email Address"
                    />
                    <InputTag
                      tagfor="PASSWORD"
                      onTextChange={handleTextChange}
                      placeholder="Password"
                      isPassword={true}
                    />

                    {/* Error display */}
                    {error ? (
                      <View style={style.errorContainer}>
                        <FontAwesome5
                          name="exclamation-circle"
                          size={14}
                          color="#ff6b6b"
                        />
                        <Text style={style.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    {/* Forgot password */}
                    <TouchableOpacity
                      style={style.forgotPasswordContainer}
                      onPress={handleForgotPassword}
                    >
                      <Text style={style.forgotPasswordText}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>

                    {/* Login button */}
                    <LoginButton
                      handleSignIn={handleLogin}
                      isLoading={loading || authLoading}
                      buttonText="SIGN IN"
                    />

                    {/* Divider */}
                    <View style={style.dividerContainer}>
                      <View style={style.divider}></View>
                      <Text style={style.dividerText}>OR SIGN IN WITH</Text>
                      <View style={style.divider}></View>
                    </View>

                    {/* Social login */}
                    <TouchableOpacity
                      style={style.socialButton}
                      onPress={handleGoogleSignIn}
                    >
                      <LinearGradient
                        colors={["#4285F4", "#34A853"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={style.socialGradient}
                      >
                        <Image
                          source={require("../assets/GOOGLELOGIN.png")}
                          style={style.socialIcon}
                        />
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign up link */}
                    <View style={style.signUpContainer}>
                      <Text style={style.signUpText}>
                        Don't have an account?
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Register")}
                      >
                        <Text style={style.signUpLink}>Sign Up</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

const style = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    shadowColor: "#5A9BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    color: "white",
    fontFamily: "BlackHanSans",
    fontSize: 28,
    letterSpacing: 3,
    marginTop: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "BlackHanSans",
    fontSize: 14,
    marginTop: 5,
  },
  formOuterContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  blurContainer: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  formContainer: {
    width: "100%",
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  formTitle: {
    color: "white",
    fontFamily: "BlackHanSans",
    fontSize: 24,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  formSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "BlackHanSans",
    fontSize: 14,
    marginBottom: 30,
    alignSelf: "flex-start",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: -20,
    marginBottom: 15,
    width: "100%",
  },
  errorText: {
    color: "#ff6b6b",
    fontFamily: "BlackHanSans",
    fontSize: 12,
    marginLeft: 6,
  },
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "BlackHanSans",
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    fontSize: 10,
    fontFamily: "BlackHanSans",
    color: "white",
    paddingHorizontal: 10,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    overflow: "hidden",
  },
  socialGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  signUpContainer: {
    flexDirection: "row",
    marginTop: 30,
  },
  signUpText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "BlackHanSans",
    fontSize: 14,
  },
  signUpLink: {
    color: "#5A9BFF",
    fontFamily: "BlackHanSans",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  floatingElement: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

export default Login;
