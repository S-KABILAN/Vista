import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAdmin } from "../context/AdminContext";
import { BACKEND_URL } from "../config";

const AdminLogin = ({ navigation }) => {
  const [email, setEmail] = useState("admin@vistatravel.com");
  const [password, setPassword] = useState("admin123");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const {
    adminLogin,
    adminToken,
    isAuthenticated,
    loading,
    checkTokenValidity,
    testBackendConnection,
  } = useAdmin();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace("AdminDashboard");
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoginLoading(true);
    console.log("Attempting login with:", email);
    console.log("Backend URL:", BACKEND_URL);

    try {
      console.log(
        "Sending login request to:",
        `${BACKEND_URL}/api/admin/login`
      );
      const result = await adminLogin(email, password);
      console.log("Login result:", result.success ? "Success" : "Failed");

      if (result.success) {
        console.log("Login successful, navigating to dashboard");
        // Navigation will happen in the useEffect when isAuthenticated changes
      } else {
        console.log("Login failed:", result.message);
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);

      // More specific error messages
      if (error.message && error.message.includes("Network Error")) {
        Alert.alert(
          "Connection Error",
          `Unable to connect to server at ${BACKEND_URL}. Please check your network connection and server status.`
        );
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred during login. Please try again."
        );
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCheckToken = async () => {
    setCheckingToken(true);
    try {
      const result = await checkTokenValidity();
      if (result.success) {
        Alert.alert(
          "Token Valid",
          `Token is valid for user: ${result.user.email}`
        );
      } else {
        Alert.alert("Token Invalid", result.message);
      }
    } catch (error) {
      console.error("Token check error:", error);
      Alert.alert("Error", "Failed to check token validity");
    } finally {
      setCheckingToken(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testBackendConnection();
      if (result.success) {
        Alert.alert(
          "Connection Successful",
          `Connected to server at ${BACKEND_URL}\n\nServer responded: ${result.data.message}`
        );
      } else {
        Alert.alert(
          "Connection Failed",
          `Could not connect to server at ${BACKEND_URL}\n\nError: ${result.message}`
        );
      }
    } catch (error) {
      console.error("Connection test error:", error);
      Alert.alert("Error", "Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <Image source=" " style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Sign in to manage Vista Travel</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            >
              <Ionicons
                name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Admin Login</Text>
            )}
          </TouchableOpacity>

          {/* Debug Buttons - only visible in development */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <TouchableOpacity
                style={[styles.debugButton, { backgroundColor: "#666" }]}
                onPress={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Test Connection</Text>
                )}
              </TouchableOpacity>

              {adminToken && (
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: "#666" }]}
                  onPress={handleCheckToken}
                  disabled={checkingToken}
                >
                  {checkingToken ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Check Token</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.userLoginLink}
          >
            <Text style={styles.userLoginText}>Go to User Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  userLoginLink: {
    padding: 12,
  },
  userLoginText: {
    color: "#3498db",
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 20,
    width: "100%",
  },
  debugButton: {
    backgroundColor: "#666",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },
});

export default AdminLogin;
