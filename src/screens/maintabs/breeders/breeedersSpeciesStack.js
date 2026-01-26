// SpeciesStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BreederSpeciesScreen from "./BreederSpeciesScreen";

const SpeciesStack = createNativeStackNavigator();

export default function SpeciesStackNavigator() {
  return (
    <SpeciesStack.Navigator screenOptions={{ headerShown: false }}>
      <SpeciesStack.Screen name="SpeciesHome" component={BreederSpeciesScreen} />
    </SpeciesStack.Navigator>
  );
}
