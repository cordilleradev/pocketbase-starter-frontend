import PocketBase from "pocketbase";
import { loadEnvConfig } from "@next/env";

// Initialize PocketBase client with the URL from environment variable or fallback to default
let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

console.log(backendUrl);
export const pb = new PocketBase(backendUrl);

// Persist auth state in localStorage
// Only run this code in the browser environment
if (typeof window !== "undefined") {
  // Load auth state from localStorage if available
  const storedAuthData = localStorage.getItem("pocketbase_auth");
  if (storedAuthData) {
    try {
      const { token, model } = JSON.parse(storedAuthData);
      pb.authStore.save(token, model);
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      localStorage.removeItem("pocketbase_auth");
    }
  }

  // Save auth state to localStorage on change
  pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      );
    } else {
      localStorage.removeItem("pocketbase_auth");
    }
  });
}

// Helper function to check if user is authenticated
export const isUserAuthenticated = () => {
  return pb.authStore.isValid;
};

// Helper function to get current user
export const getCurrentUser = () => {
  return pb.authStore.model;
};
