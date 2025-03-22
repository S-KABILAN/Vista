import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import InputTag from "../components/input";
import LoginButton from "../components/loginbutton";
import { useAuth } from "../context/AuthContext";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const Register = ({ navigation }) => {
  // Get auth context
  const { register, loading: authLoading, authError } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Font loading
  const [fontsLoaded] = useFonts({
    BlackHanSans: require("../assets/BlackHanSans-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();

    // Start animations
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
    ]).start();
  }, []);

  // Set error message if there's an auth error
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

  const handleSignUp = async () => {
    // Form validation
    if (!email || !password || !confirmPassword || !fullName) {
      setError("Please fill in all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError("");

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Call the register function from AuthContext
      console.log("Registering with:", { fullName, email });
      const result = await register(fullName, email, password);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("NamePage");
      } else {
        setError(result.message || "Registration failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Registration failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Implement Google sign-up here
    // This will be handled by the Auth Context
    Alert.alert("Google Sign Up", "This feature is coming soon!");
  };

  const handleTextChange = (tagfor, text) => {
    setError("");

    switch (tagfor) {
      case "EMAIL":
        setEmail(text);
        break;
      case "PASSWORD":
        setPassword(text);
        break;
      case "CONFIRM_PASSWORD":
        setConfirmPassword(text);
        break;
      case "FULL_NAME":
        setFullName(text);
        break;
      default:
        break;
    }
  };

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      style={styles.backgroundImage}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(20,20,40,0.8)"]}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Decorative Elements */}
            <Animated.View
              style={[
                styles.decorativeElement,
                {
                  top: height * 0.1,
                  right: width * 0.15,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6],
                  }),
                },
              ]}
            >
              <FontAwesome5 name="map" size={24} color="white" />
            </Animated.View>

            <Animated.View
              style={[
                styles.decorativeElement,
                {
                  bottom: height * 0.15,
                  left: width * 0.1,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.7],
                  }),
                },
              ]}
            >
              <FontAwesome5 name="route" size={24} color="white" />
            </Animated.View>

            {/* Header */}
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome5 name="arrow-left" size={20} color="white" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join Vista Travel and start your journey
                </Text>
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.cardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <InputTag
                    tagfor="FULL_NAME"
                    onTextChange={handleTextChange}
                    placeholder="Full Name"
                  />
                  <InputTag
                    tagfor="EMAIL"
                    onTextChange={handleTextChange}
                    placeholder="Email Address"
                  />
                  <InputTag
                    tagfor="PASSWORD"
                    onTextChange={handleTextChange}
                    placeholder="Password"
                  />
                  <InputTag
                    tagfor="CONFIRM_PASSWORD"
                    onTextChange={handleTextChange}
                    placeholder="Confirm Password"
                  />

                  {error ? (
                    <View style={styles.errorContainer}>
                      <FontAwesome5
                        name="exclamation-circle"
                        size={16}
                        color="#ff6b6b"
                      />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                      By signing up, you agree to our{" "}
                      <Text style={styles.termsLink}>Terms & Conditions</Text>{" "}
                      and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>

                  <LoginButton
                    handleSignIn={handleSignUp}
                    isLoading={loading || authLoading}
                    buttonText="SIGN UP"
                  />
                </LinearGradient>
              </View>

              {/* Or continue with section */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider}></View>
                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                <View style={styles.divider}></View>
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignUp}
                >
                  <LinearGradient
                    colors={["#4285F4", "#34A853"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.socialGradient}
                  >
                    <Image
                      source={require("../assets/GOOGLELOGIN.png")}
                      style={styles.socialIcon}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  decorativeElement: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  headerContainer: {
    width: "100%",
    marginTop: 40,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 10,
  },
  title: {
    color: "white",
    fontFamily: "BlackHanSans",
    fontSize: 32,
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "BlackHanSans",
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
  },
  cardContainer: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontFamily: "BlackHanSans",
    fontSize: 12,
    marginLeft: 8,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "BlackHanSans",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#5A9BFF",
    textDecorationLine: "underline",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "BlackHanSans",
    fontSize: 12,
    marginHorizontal: 12,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "BlackHanSans",
    fontSize: 14,
  },
  signInLink: {
    color: "#5A9BFF",
    fontFamily: "BlackHanSans",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default Register;
