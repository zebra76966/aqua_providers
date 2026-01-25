// MarketplaceStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BreedersScreen from "./BreedersScreen";
import BreederDetailScreen from "./BreederDetailScreen";

const BreedersStack = createNativeStackNavigator();

export default function BreedersStackNavigator() {
  return (
    <BreedersStack.Navigator screenOptions={{ headerShown: false }}>
      <BreedersStack.Screen name="BreedersHome" component={BreedersScreen} />
      <BreedersStack.Screen name="BreederDetail" component={BreederDetailScreen} />
    </BreedersStack.Navigator>
  );
}
