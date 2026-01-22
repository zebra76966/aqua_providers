import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LoginScreen from "./src/screens/login";
import SignupScreen from "./src/screens/signup";
import TankSetupScreen from "./src/screens/tanksetup";
import TankScanScreen from "./src/screens/tankScanSreen";
import TankSuccessScreen from "./src/screens/TankSuccessScreen";
import PhScanScreen from "./src/screens/phScanSreen";
import MainTabs from "./src/components/MainTabs";

import { ThemeProvider } from "./src/themecontext";
import { AuthProvider } from "./src/authcontext";
import ImagePreview from "./src/screens/imageprevirew";
import AddTank from "./src/screens/maintabs/forms/addTank";
import TankAddWaterParams from "./src/screens/tankWaterParams";
import FirstScreen from "./src/screens/home";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import SettingsScreen from "./src/screens/maintabs/settings";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import { DeviceEventEmitter } from "react-native";
import PlansScreen from "./src/screens/maintabs/PlansScreen";
import ApplicationStatusScreen from "./src/screens/ApplicationStatusScreen";
import CreateBusinessProfileScreen from "./src/screens/CreateBusinessProfileScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const linking = {
    prefixes: ["aqua://"],
  };

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      console.log("Deep link received:", url);

      if (url === "aqua://payment-success") {
        DeviceEventEmitter.emit("PAYMENT_SUCCESS");
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <Stack.Navigator initialRouteName="First" screenOptions={{ headerShown: false }}>
              {/* Screens WITHOUT navbar */}
              <Stack.Screen name="First" component={FirstScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="tankSetup" component={TankSetupScreen} />
              <Stack.Screen name="TankScan" component={TankScanScreen} />
              <Stack.Screen name="PhScanScreen" component={PhScanScreen} />
              <Stack.Screen name="TankAddWaterParams" component={TankAddWaterParams} />
              <Stack.Screen name="TankSuccess" component={TankSuccessScreen} />
              <Stack.Screen name="ImagePreview" component={ImagePreview} />

              {/* Screens WITH navbar */}
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Plans" component={PlansScreen} />
              <Stack.Screen name="ApplicationStatus" component={ApplicationStatusScreen} />
              <Stack.Screen name="CreateBusinessProfile" component={CreateBusinessProfileScreen} />

              {/* <Stack.Screen name="UpdateTank" component={UpdateTankScreen} /> */}
              {/* <Stack.Screen name="AddTank" component={AddTank} /> */}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
