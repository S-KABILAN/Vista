import * as Location from "expo-location";

// Request location permission
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      throw new Error("Location permission not granted");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    throw error;
  }
};

// Get address for coordinates
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return {
        city: address.city || address.subregion || address.region,
        country: address.country,
        street: address.street,
        postalCode: address.postalCode,
        formattedAddress: `${address.street || ""} ${
          address.city || address.subregion || ""
        }, ${address.region || ""} ${address.country || ""}`,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting address:", error);
    throw error;
  }
};

// Get coordinates for an address
export const getCoordinatesFromAddress = async (address) => {
  try {
    const locations = await Location.geocodeAsync(address);

    if (locations && locations.length > 0) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
};
