import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView, Keyboard, TouchableWithoutFeedback, Image } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri, exchangeCodeAsync, useAutoDiscovery, ResponseType } from "expo-auth-session";
import styles from "./login.stylesheet";
import useThemeStyles from "../useThemeStyle";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = "859674051212-kp746doga77holq4lqe2eiducpoqliuv.apps.googleusercontent.com";
const WEB_CLIENT_ID = "859674051212-0gn7dvr1jslospmpe8mkm4aooqct0f8p.apps.googleusercontent.com";
const IOS_CLIENT_ID = "859674051212-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com";

export default function LoginScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const { colors } = useThemeStyles();
  const { token, login, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && token) {
      navigation.replace("ApplicationStatus");
    }
  }, [loading, token, navigation]);

  const discovery = useAutoDiscovery("https://accounts.google.com");
  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      androidClientId: ANDROID_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      webClientId: WEB_CLIENT_ID,
      responseType: ResponseType.Code,
      scopes: ["openid", "email", "profile"],
      redirectUri,
    },
    discovery,
  );

  useEffect(() => {
    (async () => {
      if (!response || response.type !== "success" || !discovery || !request) return;

      try {
        setIsLoading(true);
        const { code } = response.params;
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: Platform.OS === "android" ? ANDROID_CLIENT_ID : Platform.OS === "ios" ? IOS_CLIENT_ID : WEB_CLIENT_ID,
            code,
            redirectUri: request.redirectUri,
            codeVerifier: request.codeVerifier,
          },
          discovery,
        );

        const idToken = tokenResult.idToken || tokenResult.id_token;
        if (!idToken) throw new Error("No id_token returned from Google");

        await login(idToken);
        navigation.navigate("ApplicationStatus");
      } catch (err) {
        setGlobalError(err?.message || "Google login failed");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [response, discovery, request]);

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError("");

    if (!username || !password) {
      setGlobalError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/user/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        if (data.dev_msg) {
          setErrors(data.dev_msg);
          setGlobalError(data.message || "Login failed");
        } else {
          setGlobalError(data.message || data.detail || "Login failed");
        }
        return;
      }

      await login(data.access);
      navigation.navigate("ApplicationStatus");
    } catch (error) {
      setGlobalError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!request) {
      Alert.alert("Please wait", "Google sign-in is still initializing.");
      return;
    }
    try {
      setIsLoading(true);
      await promptAsync({ useProxy: true });
    } finally {
      setIsLoading(false);
    }
  };

  const getBorderColor = (field) => {
    return errors[field] ? "#ff4d4f" : "#a580e9";
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={[styles.container, { justifyContent: "center", flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
          <Image source={require("../assets/icon.png")} style={{ ...styles.logoImage }} />

          <Text style={styles.welcome}>Welcome Back!</Text>

          {/* Global error */}
          {globalError ? (
            <View
              style={{
                backgroundColor: "#ffeaea",
                borderColor: "#ff4d4f",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#b00020", textAlign: "center" }}>{globalError}</Text>
            </View>
          ) : null}

          <TextInput
            style={[styles.input, { borderColor: getBorderColor("username"), borderWidth: 1 }]}
            placeholder="Username"
            placeholderTextColor="#a580e9"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {errors.username && <Text style={{ color: "#b00020", marginLeft: 5, marginBottom: 8 }}>{errors.username[0]}</Text>}

          <View style={[styles.passwordContainer, { borderColor: getBorderColor("password"), borderWidth: 1 }]}>
            <TextInput style={styles.passwordInput} placeholder="Password" placeholderTextColor="#a580e9" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#a580e9" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={{ color: "#b00020", marginLeft: 5, marginBottom: 8 }}>{errors.password[0]}</Text>}
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginBottom: 25 }}>
            <Text style={{ color: "#a580e9", fontWeight: "600", fontSize: 15 }}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialIcons}>
            <TouchableOpacity onPress={handleGooglePress} disabled={!request || isLoading}>
              <FontAwesome name="google" size={30} color="#a580e9" />
            </TouchableOpacity>
            <FontAwesome name="apple" size={30} color="#a580e9" />
            <FontAwesome name="linkedin" size={30} color="#a580e9" />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#004d40" />
            ) : (
              <>
                <Text style={styles.buttonText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={20} color="#004d40" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.link}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
