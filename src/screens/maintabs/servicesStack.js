// ServicesStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ServicesScreen from "./services";
import AddServiceScreen from "./servicesAdd";
import UpdateServicePriceScreen from "./ServicePriceUpdate";

const ServicesStack = createNativeStackNavigator();

export default function ServicesStackNavigator() {
  return (
    <ServicesStack.Navigator screenOptions={{ headerShown: false }}>
      <ServicesStack.Screen name="ServicesHome" component={ServicesScreen} />
      <ServicesStack.Screen name="AddService" component={AddServiceScreen} />
      <ServicesStack.Screen name="UpdateServicePrice" component={UpdateServicePriceScreen} />
    </ServicesStack.Navigator>
  );
}
