// BoookingStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingsScreen from "./BookingsScreen";
import BookingDetailsScreen from "./BookingsDetailScreen";

const BoookingStack = createNativeStackNavigator();

export default function BoookingStackNavigator() {
  return (
    <BoookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BoookingStack.Screen name="BookingHome" component={BookingsScreen} />
      <BoookingStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    </BoookingStack.Navigator>
  );
}
