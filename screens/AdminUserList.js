import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  MaterialIcons,
  Ionicons,
  AntDesign,
  Feather,
} from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "../config";

const AdminUserList = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch users from API
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);

      const response = await axios.retryRequest(
        {
          url: "/api/admin/users",
          method: "get",
          params: { page, limit: pagination.limit },
          timeout: 8000,
        },
        2
      ); // 2 retries

      if (response.data.success) {
        if (page === 1) {
          setUsers(response.data.users);
          setFilteredUsers(response.data.users);
        } else {
          setUsers([...users, ...response.data.users]);
          setFilteredUsers([...filteredUsers, ...response.data.users]);
        }
        setPagination(response.data.pagination);
      } else {
        console.error("Failed to fetch users:", response.data.message);
        Alert.alert("Error", "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert(
        "Error",
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    fetchUsers(1);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      fetchUsers(pagination.page + 1);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(text.toLowerCase()) ||
          user.email.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleViewUser = (user) => {
    // Navigate to user details screen
    navigation.navigate("AdminUserDetail", { user });
  };

  const handleSuspendUser = (user) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${user.isActive ? "suspend" : "activate"} ${
        user.fullName
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: user.isActive ? "Suspend" : "Activate",
          style: user.isActive ? "destructive" : "default",
          onPress: async () => {
            try {
              // Make API call to update user status
              const response = await axios.retryRequest(
                {
                  url: `/api/admin/users/${user._id}/status`,
                  method: "put",
                  data: { isActive: !user.isActive },
                  timeout: 8000,
                },
                1
              ); // 1 retry

              if (response.data.success) {
                // Update local state with the updated user
                const updatedUsers = users.map((u) =>
                  u._id === user._id ? { ...u, isActive: !u.isActive } : u
                );
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);

                Alert.alert(
                  "Success",
                  `User ${
                    user.isActive ? "suspended" : "activated"
                  } successfully`
                );
              } else {
                Alert.alert(
                  "Error",
                  response.data.message || "Failed to update user status"
                );
              }
            } catch (error) {
              console.error("Error updating user status:", error);
              Alert.alert("Error", "Failed to update user status");
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.fullName.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMetaRow}>
            <Text style={styles.userMeta}>
              Joined: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.userMeta}>Trips: {item.trips || 0}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.isActive ? "#2ecc71" : "#e74c3c" },
          ]}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewUser(item)}
        >
          <Feather name="eye" size={18} color="#3498db" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSuspendUser(item)}
        >
          <MaterialIcons
            name={item.isActive ? "block" : "check-circle"}
            size={18}
            color={item.isActive ? "#e74c3c" : "#2ecc71"}
          />
          <Text
            style={[
              styles.actionText,
              { color: item.isActive ? "#e74c3c" : "#2ecc71" },
            ]}
          >
            {item.isActive ? "Suspend" : "Activate"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() =>
            Alert.alert("Filter", "Filter options would appear here")
          }
        >
          <Ionicons name="filter" size={22} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* User List */}
      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3498db" />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3498db"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No users match your search" : "No users found"}
              </Text>
            </View>
          }
          ListFooterComponent={
            pagination.page < pagination.pages && !loading ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          Alert.alert(
            "Add User",
            "Add user functionality would be implemented here"
          )
        }
      >
        <AntDesign name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  userMeta: {
    fontSize: 12,
    color: "#999",
    marginRight: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginLeft: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#3498db",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  loadMoreButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  loadMoreText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#3498db",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AdminUserList;
