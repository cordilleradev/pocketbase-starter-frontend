"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientResponseError } from "pocketbase"
import { AlertCircle, Loader2, Mail, KeyRound, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { pb } from "@/lib/pocketbase"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

const otpSchema = z.object({
  otp: z.string().min(6, { message: "Please enter the verification code" }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type OtpFormValues = z.infer<typeof otpSchema>

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [existingUser, setExistingUser] = useState<{ name: string; email: string } | null>(null)

  // OTP related states
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [isLoadingOtp, setIsLoadingOtp] = useState(false)

  useEffect(() => {
    // Check if token exists in PocketBase's auth store
    const hasToken = pb.authStore.isValid

    if (hasToken && pb.authStore.model) {
      // Set existing user data for the "Continue as" button
      setExistingUser({
        name: pb.authStore.model.name || pb.authStore.model.email,
        email: pb.authStore.model.email,
      })
    } else {
      setExistingUser(null)
    }
  }, [])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // First, try to authenticate with password
      await pb.collection("users").authWithPassword(data.email, data.password)

      // If MFA is enabled, request OTP
      setUserEmail(data.email)
      const result = await pb.collection("users").requestOTP(data.email)
      setOtpId(result.otpId)

      // Show OTP form
      setShowOtpForm(true)
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setError("Invalid username or password")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onOtpSubmit = async (data: OtpFormValues) => {
    if (!otpId) {
      setError("Authentication error. Please try again.")
      return
    }

    setIsLoadingOtp(true)
    setError(null)

    try {
      // Authenticate with the OTP
      await pb.collection("users").authWithOTP(otpId, data.otp)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoadingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (!userEmail) return

    setIsLoadingOtp(true)
    setError(null)

    try {
      const result = await pb.collection("users").requestOTP(userEmail)
      setOtpId(result.otpId)
      setError(null)
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setError(err.message)
      } else {
        setError("Failed to resend verification code. Please try again.")
      }
    } finally {
      setIsLoadingOtp(false)
    }
  }

  const handleBackToLogin = () => {
    setShowOtpForm(false)
    setOtpId(null)
    setError(null)
  }

  const handleContinueAsExistingUser = () => {
    router.push("/dashboard")
  }

  // Helper function to truncate name
  const truncateName = (name: string, maxLength = 10) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + "..."
  }

  return (
    <Card className="w-full max-w-md mx-auto border border-black">
      <CardHeader className="border-b border-black">
        <CardTitle className="text-2xl">{showOtpForm ? "Two-Factor Authentication" : "Login"}</CardTitle>
        <CardDescription className="text-black">
          {showOtpForm
            ? "Enter the verification code sent to your email"
            : "Enter your email and password to access your dashboard"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4 border border-black bg-white text-black">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showOtpForm ? (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          {...field}
                          className="border-black focus:ring-black"
                        />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="border-black focus:ring-black"
                        />
                      </FormControl>
                      <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs text-black underline underline-offset-4">
                          Forgot password?
                        </Link>
                      </div>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>

            {/* Continue as existing user section */}
            {existingUser && (
              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black"></div>
                  </div>
                  <div className="relative bg-white px-4 text-sm text-black">or</div>
                </div>

                <Button
                  onClick={handleContinueAsExistingUser}
                  variant="outline"
                  className="w-full mt-4 border-black text-black hover:bg-black/5"
                >
                  Continue as {truncateName(existingUser.name)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 border border-black text-center space-y-4 mb-4">
              <Mail className="h-12 w-12 text-black" />
              <h2 className="text-xl font-medium">Verification Required</h2>
              <p className="text-black">
                We've sent a verification code to <strong>{userEmail}</strong>. Please check your inbox and enter the
                code below.
              </p>
            </div>

            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter code"
                          {...field}
                          className="border-black focus:ring-black text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoadingOtp}>
                  {isLoadingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                onClick={handleBackToLogin}
                className="text-black hover:bg-black/5"
                disabled={isLoadingOtp}
              >
                Back to Login
              </Button>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                className="text-black hover:bg-black/5"
                disabled={isLoadingOtp}
              >
                Resend Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-black py-4">
        {!showOtpForm && (
          <p className="text-sm text-black">
            Don't have an account?{" "}
            <Link href="/register" className="text-black font-bold underline underline-offset-4">
              Register
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
