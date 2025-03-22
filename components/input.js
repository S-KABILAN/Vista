import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Easing } from "react-native";

const InputTag = ({ tagfor, onTextChange }) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const animatedIsFocused = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    BlackHanSans: require("../assets/BlackHanSans-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || text.length > 0 ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0.2, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [isFocused, text, animatedIsFocused]);

  if (!fontsLoaded) {
    return undefined;
  } else {
    SplashScreen.hideAsync();
  }

  const handleFocus = () => {
    setIsFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getIconName = () => {
    if (tagfor === "EMAIL") return "mail";
    if (tagfor === "PASSWORD") return "lock";
    return "user";
  };

  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const inputBorderColor = animatedIsFocused.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.8)"],
  });

  return (
    <Animated.View
      style={[style.box, { borderColor: inputBorderColor, borderWidth: 1 }]}
    >
      <View style={style.iconContainer}>
        <Feather name={getIconName()} size={20} color="#ffffff" />
      </View>

      <TextInput
        style={style.input}
        placeholder={tagfor === "EMAIL" ? "Email" : "Password"}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        onChangeText={(newText) => {
          setText(newText);
          onTextChange(tagfor, newText);
        }}
        value={text}
        secureTextEntry={tagfor === "PASSWORD" && !isPasswordVisible}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        keyboardType={tagfor === "EMAIL" ? "email-address" : "default"}
      />

      {tagfor === "PASSWORD" && text.length > 0 && (
        <TouchableOpacity
          style={style.eyeIcon}
          onPress={togglePasswordVisibility}
        >
          <Feather
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const style = StyleSheet.create({
  box: {
    height: 55,
    width: "100%",
    marginBottom: 30,
    borderRadius: 16,
    backgroundColor: "rgba(114, 155, 236, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  iconContainer: {
    width: 55,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "BlackHanSans",
    paddingHorizontal: 15,
    height: "100%",
  },
  eyeIcon: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InputTag;
