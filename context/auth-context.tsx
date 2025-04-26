"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pb } from "@/lib/pocketbase"

type User = {
  id: string
  email: string
  name?: string
  username?: string
  avatar?: string
  verified?: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, passwordConfirm: string, name: string) => Promise<void>
  logout: () => void
  resendVerification: () => Promise<void>
  refreshVerificationStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    if (pb.authStore.isValid) {
      const userData = pb.authStore.model
      setUser({
        id: userData?.id,
        email: userData?.email,
        name: userData?.name,
        username: userData?.username,
        avatar: userData?.avatar,
        verified: userData?.verified,
      })
    }
    setIsLoading(false)

    // Subscribe to auth state changes
    pb.authStore.onChange(() => {
      if (pb.authStore.isValid) {
        const userData = pb.authStore.model
        setUser({
          id: userData?.id,
          email: userData?.email,
          name: userData?.name,
          username: userData?.username,
          avatar: userData?.avatar,
          verified: userData?.verified,
        })
      } else {
        setUser(null)
      }
    })
  }, [])

  // Note: We're not using this login function anymore since we're handling the OTP flow directly in the login form
  const login = async (email: string, password: string) => {
    try {
      // This is now handled in the login form component with the OTP flow
      await pb.collection("users").authWithPassword(email, password)

      // Check if email is verified
      if (!pb.authStore.model?.verified) {
        router.push("/verify-email")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, passwordConfirm: string, name: string) => {
    try {
      // Create the user
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm,
        name,
      })

      // Log the user in
      await login(email, password)

      // Automatically send verification email
      if (user) {
        await pb.collection("users").requestVerification(email)

        // Set the last sent time in localStorage
        localStorage.setItem("lastVerificationEmailSent", Date.now().toString())
      }
    } catch (error) {
      throw error
    }
  }

  const resendVerification = async () => {
    try {
      if (user) {
        await pb.collection("users").requestVerification(user.email)
        return { success: true }
      }
      throw new Error("No user logged in")
    } catch (error) {
      throw error
    }
  }

  const refreshVerificationStatus = async () => {
    try {
      if (!user || !pb.authStore.isValid) {
        return false
      }

      // Refresh the auth data
      const userData = await pb.collection("users").authRefresh()

      // Update the user state with fresh data
      setUser({
        id: userData.record.id,
        email: userData.record.email,
        name: userData.record.name,
        username: userData.record.username,
        avatar: userData.record.avatar,
        verified: userData.record.verified,
      })

      return userData.record.verified || false
    } catch (error) {
      console.error("Failed to refresh verification status:", error)
      return false
    }
  }

  const logout = () => {
    pb.authStore.clear()
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, resendVerification, refreshVerificationStatus }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
