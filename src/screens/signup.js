import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform } from "react-native";
import { baseUrl } from "../config";

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const handleSignup = async () => {
    setErrors({});
    setGlobalError("");

    if (!username || !email || !name || !password) {
      setGlobalError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/user/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          name,
          password,
        }),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        // Backend returns this structure:
        // {"dev_msg": {"username": ["A user with that username already exists."]}, ...}
        if (data.dev_msg) {
          setErrors(data.dev_msg);
          setGlobalError(data.message || "Signup failed");
        } else {
          setGlobalError(data.message || "Signup failed");
        }
        return;
      }

      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (error) {
      setGlobalError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getBorderColor = (field) => {
    return errors[field] ? "#ff4d4f" : "#a580e9";
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#ffffff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <Text style={styles.logo}>aqua</Text>

          {/* Welcome */}
          <Text style={styles.welcome}>Sign Up</Text>

          {/* Global error message */}
          {globalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          ) : null}

          <TextInput placeholder="Full Name" placeholderTextColor="#a580e9" style={[styles.input, { borderColor: getBorderColor("name") }]} value={name} onChangeText={setName} />
          {errors.name && <Text style={styles.fieldError}>{errors.name[0]}</Text>}

          <TextInput placeholder="Username" placeholderTextColor="#a580e9" style={[styles.input, { borderColor: getBorderColor("username") }]} value={username} onChangeText={setUsername} />
          {errors.username && <Text style={styles.fieldError}>{errors.username[0]}</Text>}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#a580e9"
            keyboardType="email-address"
            style={[styles.input, { borderColor: getBorderColor("email") }]}
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email[0]}</Text>}

          <TextInput
            placeholder="Password"
            placeholderTextColor="#a580e9"
            secureTextEntry
            style={[styles.input, { borderColor: getBorderColor("password") }]}
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password[0]}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.link}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    justifyContent: "center",
    paddingVertical: 40,
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#a580e9",
    textAlign: "center",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: "#ffeaea",
    borderWidth: 1,
    borderColor: "#ff4d4f",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: "#b00020",
    textAlign: "center",
  },
  fieldError: {
    color: "#b00020",
    fontSize: 13,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    color: "#000",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchText: {
    color: "#aaa",
    marginTop: 15,
    textAlign: "center",
  },
  link: {
    color: "#a580e9",
    fontWeight: "bold",
    fontSize: 18,
  },
});
