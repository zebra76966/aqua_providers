import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordResetRequest = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email.");
    setLoading(true);

    try {
      const res = await fetch("{{base_url}}/user/password-reset/request/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        Alert.alert("Check Your Email", "We’ve sent a password reset link to your email address.");
        navigation.navigate("ResetPassword");
      } else {
        Alert.alert("Error", "Failed to send password reset email.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Forgot Password?</Text>
      <Text style={styles.subtitle}>Enter your email and we’ll send you a password reset link.</Text>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

      <TouchableOpacity style={styles.button} onPress={handlePasswordResetRequest} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#a580e9",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: "#000",
  },
  button: {
    backgroundColor: "#a580e9",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
    fontSize: 17,
  },
  backText: {
    color: "#a580e9",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
