// CalendarStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalendarScreen from "./CalendarScreen";
import ConsultantAvailabilityScreen from "./ConsultantAvailabilityScreen";
import SetWeeklyAvailabilityScreen from "./SetWeeklyAvailabilityScreen";
import BlockTimeSlotScreen from "./BlockTimeSlotScreen";

const CalendarStack = createNativeStackNavigator();

export default function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="ConsultantAvailability" component={ConsultantAvailabilityScreen} />
      <CalendarStack.Screen name="SetWeeklyAvailability" component={SetWeeklyAvailabilityScreen} />
      <CalendarStack.Screen name="BlockTime" component={BlockTimeSlotScreen} />
    </CalendarStack.Navigator>
  );
}
