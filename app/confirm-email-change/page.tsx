"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { pb } from "@/lib/pocketbase"
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const passwordSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
})

type PasswordFormValues = z.infer<typeof passwordSchema>

// Token validation types
type TokenData = {
  collectionId: string
  email: string
  exp: number
  id: string
  newEmail: string
  type: string
}

export default function ConfirmEmailChangePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "password" | "success" | "error">("loading")
  const [errorType, setErrorType] = useState<"invalid" | "expired" | "password" | "other" | null>(null)
  const [message, setMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  })

  // Function to validate the token
  const validateToken = (token: string): { valid: boolean; data?: TokenData; error?: string } => {
    try {
      // Check if token is in JWT format (has 3 parts separated by dots)
      if (token.split(".").length !== 3) {
        return { valid: false, error: "Invalid token format" }
      }

      // Decode the token payload (middle part)
      const payload = JSON.parse(atob(token.split(".")[1]))

      // Check if it has the expected structure
      if (!payload.type || payload.type !== "emailChange" || !payload.email || !payload.newEmail || !payload.exp) {
        return { valid: false, error: "Invalid token structure" }
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        return { valid: false, error: "Token expired", data: payload }
      }

      return { valid: true, data: payload }
    } catch (e) {
      console.error("Token validation error:", e)
      return { valid: false, error: "Token validation failed" }
    }
  }

  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        setStatus("error")
        setErrorType("invalid")
        setMessage("Email change token is missing. Please check your email link.")
        return
      }

      // Validate the token
      const validation = validateToken(token)

      if (!validation.valid) {
        setStatus("error")

        if (validation.error === "Token expired" && validation.data) {
          setErrorType("expired")
          setTokenData(validation.data as TokenData)
          setMessage(`Your email change link has expired. Please request a new email change.`)
        } else {
          setErrorType("invalid")
          setMessage("Invalid email change link. Please request a new email change.")
        }
        return
      }

      // Token is valid, store the data
      setTokenData(validation.data as TokenData)

      // Proceed to password confirmation
      setStatus("password")
    }

    checkTokenValidity()
  }, [token])

  const onSubmit = async (data: PasswordFormValues) => {
    if (!token) {
      setStatus("error")
      setErrorType("invalid")
      setMessage("Email change token is missing. Please check your email link.")
      return
    }

    setIsSubmitting(true)
    setPasswordError(null) // Clear previous password errors

    try {
      // Confirm the email change using the token and password
      await pb.collection("users").confirmEmailChange(token, data.password)

      // If successful, update status
      setStatus("success")
      setMessage("Your email has been successfully changed!")
    } catch (error: any) {
      console.error("Email change confirmation error:", error)

      // Check if it's a password-related error
      if (
        error.status === 400 &&
        (error.message.includes("password") ||
          error.message.includes("Password") ||
          error.response?.data?.password?.message)
      ) {
        // Set password error but keep the form visible
        setPasswordError("Incorrect password. Please try again.")
        // Don't change the status - keep it as "password" to show the form
      } else {
        setStatus("error")
        setErrorType("other")
        setMessage("Failed to change your email. Please try again or contact support.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto border border-black">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-2xl">Email Change Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-black" />
              <p className="text-center text-black">Verifying your email change request...</p>
            </>
          )}

          {status === "password" && (
            <>
              <div className="w-full">
                {passwordError && (
                  <Alert variant="destructive" className="mb-4 border border-black bg-white text-black">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <p className="text-center text-black mb-4">
                  Please enter your password to confirm changing your email
                  {tokenData && ` from ${tokenData.email} to ${tokenData.newEmail}`}.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <FormMessage className="text-black" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-black text-white hover:bg-black/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        "Confirm Email Change"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-black" />
              <p className="text-center text-black font-medium">{message}</p>
              {tokenData && (
                <div className="text-center text-black">
                  <p>Your email has been changed from:</p>
                  <p className="font-medium">{tokenData.email}</p>
                  <p>to:</p>
                  <p className="font-medium">{tokenData.newEmail}</p>
                </div>
              )}
            </>
          )}

          {status === "error" && (
            <>
              {errorType === "expired" ? (
                <AlertTriangle className="h-16 w-16 text-black" />
              ) : (
                <XCircle className="h-16 w-16 text-black" />
              )}

              <p className="text-center text-black font-medium">{message}</p>

              {errorType === "expired" && tokenData && (
                <div className="text-center text-black">
                  <p>Your request to change email from:</p>
                  <p className="font-medium">{tokenData.email}</p>
                  <p>to:</p>
                  <p className="font-medium">{tokenData.newEmail}</p>
                  <p>has expired. Please try again from the settings page.</p>
                </div>
              )}

              <Button
                onClick={() => router.push("/dashboard/settings")}
                className="mt-4 bg-black text-white hover:bg-black/90"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-black py-4">
          <p className="text-sm text-black">
            <Link href="/login" className="text-black font-bold underline underline-offset-4">
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
