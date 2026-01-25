// AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseUrl } from "./config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState(null);
  const [activeTankId, setActiveTankId] = useState(null);

  /* 🔑 Permissions */
  const [tier, setTier] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  /* ---------------------------------- */
  /* Active Tank */
  /* ---------------------------------- */
  useEffect(() => {
    AsyncStorage.getItem("activeTankId").then((id) => {
      if (id) setActiveTankId(id);
    });
  }, []);

  const activateTank = async (tankId) => {
    setActiveTankId(tankId);
    await AsyncStorage.setItem("activeTankId", String(tankId));
  };

  const clearActiveTank = async () => {
    setActiveTankId(null);
    await AsyncStorage.removeItem("activeTankId");
  };

  /* ---------------------------------- */
  /* Fetch User Permissions (FETCH) */
  /* ---------------------------------- */
  const fetchUserPermissions = useCallback(async (accessToken) => {
    if (!accessToken) return;

    try {
      setPermissionsLoading(true);

      const res = await fetch(`${baseUrl}/user/me/permissions/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json?.data) {
        setTier(json.data.tier);
        setPermissions(json.data.features);

        await AsyncStorage.setItem("userPermissions", JSON.stringify(json.data));
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Load Token + Permissions on App Start */
  /* ---------------------------------- */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const storedPermissions = await AsyncStorage.getItem("userPermissions");

        if (storedToken) {
          setToken(storedToken);

          if (storedPermissions) {
            const parsed = JSON.parse(storedPermissions);
            setTier(parsed.tier);
            setPermissions(parsed.features);
          } else {
            fetchUserPermissions(storedToken);
          }
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [fetchUserPermissions]);

  /* ---------------------------------- */
  /* Login */
  /* ---------------------------------- */
  const login = async (newToken) => {
    setToken(newToken);
    await AsyncStorage.setItem("authToken", newToken);

    // 🔥 Fetch permissions right after login
    fetchUserPermissions(newToken);
  };

  /* ---------------------------------- */
  /* Logout */
  /* ---------------------------------- */
  const logout = async () => {
    setToken(null);
    setTier(null);
    setPermissions(null);
    setActiveTankId(null);

    await AsyncStorage.multiRemove(["authToken", "userPermissions", "activeTankId"]);
  };

  return (
    <AuthContext.Provider
      value={{
        /* Auth */
        token,
        loading,
        role,
        setRole,
        login,
        logout,

        /* Tank */
        activeTankId,
        activateTank,
        clearActiveTank,

        /* Permissions */
        tier,
        permissions,
        permissionsLoading,
        refreshPermissions: () => fetchUserPermissions(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
