import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useAdmin } from "../context/AdminContext";

const AdminSettings = ({ navigation }) => {
  const { admin } = useAdmin();

  // Settings state
  const [settings, setSettings] = useState({
    // General settings
    allowUserRegistration: true,
    enablePushNotifications: true,
    autoApproveReviews: false,

    // Privacy settings
    storeUserSearchHistory: true,
    collectAnalyticsData: true,

    // API settings
    enableAIFeatures: true,
    mapApiKey: "********************",
    weatherApiEnabled: true,

    // Cache settings
    cacheDuration: "24", // hours
    clearCacheOnLogout: false,
  });

  // Handle settings toggle
  const handleToggleSetting = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // Handle text input changes
  const handleTextChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, would call an API to save settings
    Alert.alert("Success", "Settings saved successfully", [{ text: "OK" }]);
  };

  // Handle system actions
  const handleSystemAction = (action) => {
    switch (action) {
      case "clearCache":
        Alert.alert(
          "Clear Cache",
          "Are you sure you want to clear all system cache?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Clear",
              onPress: () =>
                Alert.alert("Success", "Cache cleared successfully"),
            },
          ]
        );
        break;

      case "backupDb":
        Alert.alert(
          "Database Backup",
          "This will create a backup of the entire database. Continue?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Backup",
              onPress: () =>
                Alert.alert("Success", "Database backup created successfully"),
            },
          ]
        );
        break;

      case "resetSystem":
        Alert.alert(
          "Reset System",
          "WARNING: This will reset all system settings to defaults. This action cannot be undone. Are you absolutely sure?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Reset",
              style: "destructive",
              onPress: () =>
                Alert.alert("Success", "System reset successfully"),
            },
          ]
        );
        break;

      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info */}
        <View style={styles.adminInfoCard}>
          <Text style={styles.adminName}>
            {admin?.fullName || "Admin User"}
          </Text>
          <Text style={styles.adminRole}>{admin?.role || "Admin"}</Text>
          <Text style={styles.adminEmail}>
            {admin?.email || "admin@vistatravel.com"}
          </Text>
        </View>

        {/* General Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>General Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="person-add-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Allow User Registration</Text>
            </View>
            <Switch
              value={settings.allowUserRegistration}
              onValueChange={() => handleToggleSetting("allowUserRegistration")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={
                settings.allowUserRegistration ? "#3498db" : "#f4f3f4"
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Enable Push Notifications</Text>
            </View>
            <Switch
              value={settings.enablePushNotifications}
              onValueChange={() =>
                handleToggleSetting("enablePushNotifications")
              }
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={
                settings.enablePushNotifications ? "#3498db" : "#f4f3f4"
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="rate-review" size={20} color="#666" />
              <Text style={styles.settingLabel}>Auto-Approve Reviews</Text>
            </View>
            <Switch
              value={settings.autoApproveReviews}
              onValueChange={() => handleToggleSetting("autoApproveReviews")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={settings.autoApproveReviews ? "#3498db" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Store User Search History</Text>
            </View>
            <Switch
              value={settings.storeUserSearchHistory}
              onValueChange={() =>
                handleToggleSetting("storeUserSearchHistory")
              }
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={
                settings.storeUserSearchHistory ? "#3498db" : "#f4f3f4"
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="analytics-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Collect Analytics Data</Text>
            </View>
            <Switch
              value={settings.collectAnalyticsData}
              onValueChange={() => handleToggleSetting("collectAnalyticsData")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={settings.collectAnalyticsData ? "#3498db" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* API Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>API Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.settingLabel}>Enable AI Features</Text>
            </View>
            <Switch
              value={settings.enableAIFeatures}
              onValueChange={() => handleToggleSetting("enableAIFeatures")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={settings.enableAIFeatures ? "#3498db" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingInputItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="map" size={20} color="#666" />
              <Text style={styles.settingLabel}>Maps API Key</Text>
            </View>
            <TextInput
              style={styles.settingInput}
              value={settings.mapApiKey}
              onChangeText={(value) => handleTextChange("mapApiKey", value)}
              secureTextEntry={true}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="cloud-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Weather API Enabled</Text>
            </View>
            <Switch
              value={settings.weatherApiEnabled}
              onValueChange={() => handleToggleSetting("weatherApiEnabled")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={settings.weatherApiEnabled ? "#3498db" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Cache Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Cache Settings</Text>

          <View style={styles.settingInputItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="timelapse" size={20} color="#666" />
              <Text style={styles.settingLabel}>Cache Duration (hours)</Text>
            </View>
            <TextInput
              style={styles.settingInput}
              value={settings.cacheDuration}
              onChangeText={(value) => handleTextChange("cacheDuration", value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="logout" size={20} color="#666" />
              <Text style={styles.settingLabel}>Clear Cache on Logout</Text>
            </View>
            <Switch
              value={settings.clearCacheOnLogout}
              onValueChange={() => handleToggleSetting("clearCacheOnLogout")}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={settings.clearCacheOnLogout ? "#3498db" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* System Actions */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>System Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSystemAction("clearCache")}
          >
            <Ionicons name="trash-outline" size={20} color="#3498db" />
            <Text style={styles.actionButtonText}>Clear System Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSystemAction("backupDb")}
          >
            <Ionicons name="save-outline" size={20} color="#3498db" />
            <Text style={styles.actionButtonText}>Backup Database</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerActionButton]}
            onPress={() => handleSystemAction("resetSystem")}
          >
            <MaterialIcons name="restore" size={20} color="#e74c3c" />
            <Text style={[styles.actionButtonText, { color: "#e74c3c" }]}>
              Reset System Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  adminInfoCard: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  adminRole: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginTop: 8,
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInputItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  settingInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    fontSize: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  dangerActionButton: {
    backgroundColor: "#fef5f5",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#3498db",
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AdminSettings;
