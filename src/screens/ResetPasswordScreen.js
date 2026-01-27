import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { baseUrl } from "../config";

const ResetPasswordScreen = ({ navigation }) => {
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetSubmit = async () => {
    if (!resetToken || !password) return Alert.alert("Error", "Please fill all fields.");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/user/password-reset/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, password }),
      });

      console;

      if (res.ok) {
        Alert.alert("Success", "Password has been reset successfully!");
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", "Invalid or expired reset token.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your reset token and new password.</Text>

      <TextInput style={styles.input} placeholder="Reset Token" placeholderTextColor="#aaa" autoCapitalize="none" value={resetToken} onChangeText={setResetToken} />

      <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={handleResetSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Updating..." : "Reset Password"}</Text>
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

export default ResetPasswordScreen;
