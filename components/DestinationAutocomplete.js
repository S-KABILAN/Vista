import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import axios from 'axios';
import { googleapis } from "../constants/constant"; // Your Google API key

const DestinationAutocomplete = ({ onSelectDestination, placeholder = "Where do you want to go?" }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let timeoutId;
    
    if (query.length >= 3) {
      setLoading(true);
      setError(null);
      
      // Add a small delay to prevent too many API calls while typing
      timeoutId = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [query]);
  
  const fetchSuggestions = async (text) => {
    try {
      console.log(`Fetching suggestions for: ${text}`);
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: text,
            key: googleapis,
            types: "(cities)", // Limit to cities
          },
        }
      );
      
      console.log('Suggestions response:', response.data);
      
      if (response.data.status === 'OK') {
        setSuggestions(response.data.predictions);
      } else if (response.data.status === 'ZERO_RESULTS') {
        setSuggestions([]);
      } else {
        setError(`Error: ${response.data.status}`);
        console.error('API error:', response.data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectDestination = async (prediction) => {
    try {
      setLoading(true);
      
      // Get detailed information about the place
      const detailsResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: prediction.place_id,
            key: googleapis,
            fields: 'name,geometry,formatted_address',
          },
        }
      );
      
      if (detailsResponse.data.status === 'OK') {
        const result = detailsResponse.data.result;
        
        // Extract main destination name from the description
        const destinationName = prediction.structured_formatting?.main_text || result.name;
        
        // Pass back complete destination data
        onSelectDestination({
          name: destinationName,
          placeId: prediction.place_id,
          fullName: prediction.description,
          formattedAddress: result.formatted_address,
          coordinates: result.geometry?.location,
        });
        
        // Clear input and suggestions
        setQuery(destinationName);
        setSuggestions([]);
      } else {
        setError(`Error fetching place details: ${detailsResponse.data.status}`);
      }
    } catch (err) {
      console.error('Error selecting destination:', err);
      setError('Failed to select destination');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.searchbar}>
        <AntDesign name="search1" size={20} color="#666" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />
        {loading && <ActivityIndicator size="small" color="#4466EE" />}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <AntDesign name="close" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectDestination(item)}
              >
                <Text style={styles.mainText}>
                  {item.structured_formatting?.main_text || item.description}
                </Text>
                <Text style={styles.secondaryText}>
                  {item.structured_formatting?.secondary_text || ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    height: 50,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mainText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    marginTop: 5,
    color: 'red',
    fontSize: 14,
  }
});

export default DestinationAutocomplete;
