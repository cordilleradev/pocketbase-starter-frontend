"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react"

// Cooldown time in seconds
const RESEND_COOLDOWN = 30

export default function VerifyEmailPage() {
  const { user, isLoading, logout, resendVerification, refreshVerificationStatus } = useAuth()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [resendStatus, setResendStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [initialEmailSent, setInitialEmailSent] = useState(false)

  // Initialize countdown and email sent status from localStorage on component mount
  useEffect(() => {
    const lastSentTime = localStorage.getItem("lastVerificationEmailSent")
    if (lastSentTime) {
      setInitialEmailSent(true)
      const elapsedSeconds = Math.floor((Date.now() - Number.parseInt(lastSentTime)) / 1000)
      const remainingSeconds = RESEND_COOLDOWN - elapsedSeconds

      if (remainingSeconds > 0) {
        setCountdown(remainingSeconds)
      }
    } else {
      setInitialEmailSent(false)
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer)
          return 0
        }
        return prevCountdown - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    if (!isLoading) {
      // If no user is logged in, redirect to login
      if (!user) {
        router.push("/login")
        return
      }

      // If user is verified, redirect to dashboard
      if (user.verified) {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router])

  // Send verification email automatically if it hasn't been sent yet
  useEffect(() => {
    const sendInitialVerificationEmail = async () => {
      if (!initialEmailSent && user && !isLoading) {
        try {
          await resendVerification()
          setInitialEmailSent(true)
          localStorage.setItem("lastVerificationEmailSent", Date.now().toString())
        } catch (error) {
          console.error("Failed to send initial verification email:", error)
        }
      }
    }

    sendInitialVerificationEmail()
  }, [initialEmailSent, user, isLoading, resendVerification])

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendStatus(null)
    setRefreshStatus(null)

    try {
      await resendVerification()
      setResendStatus({
        success: true,
        message: "Verification email sent successfully. Please check your inbox.",
      })

      // Set the last sent time in localStorage
      localStorage.setItem("lastVerificationEmailSent", Date.now().toString())
      setInitialEmailSent(true)

      // Start the countdown
      setCountdown(RESEND_COOLDOWN)
    } catch (error) {
      setResendStatus({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleRefreshVerification = async () => {
    setIsRefreshing(true)
    setRefreshStatus(null)
    setResendStatus(null)

    try {
      const isVerified = await refreshVerificationStatus()

      if (isVerified) {
        // If verified, redirect to dashboard
        router.push("/dashboard")
      } else {
        setRefreshStatus({
          success: false,
          message: "Your email is not verified yet. Please check your inbox and click the verification link.",
        })
      }
    } catch (error) {
      setRefreshStatus({
        success: false,
        message: "Failed to check verification status. Please try again.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto border border-black">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-black">
            Please verify your email address to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col items-center justify-center p-6 border border-black text-center space-y-4">
            <Mail className="h-12 w-12 text-black" />
            <h2 className="text-xl font-medium">Verification Required</h2>
            <p className="text-black">
              We've sent a verification email to <strong>{user.email}</strong>. Please check your inbox and click the
              verification link to activate your account.
            </p>
          </div>

          {resendStatus && (
            <Alert
              variant={resendStatus.success ? "default" : "destructive"}
              className={`border ${
                resendStatus.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resendStatus.message}</AlertDescription>
            </Alert>
          )}

          {refreshStatus && (
            <Alert
              variant={refreshStatus.success ? "default" : "destructive"}
              className={`border ${
                refreshStatus.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{refreshStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            <div className="relative">
              <Button
                onClick={handleResendVerification}
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={isResending || isRefreshing || countdown > 0}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>{initialEmailSent ? "Resend Verification Email" : "Send Verification Email"}</>
                )}
              </Button>

              {countdown > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-3 -right-3 bg-black text-white px-2 py-1 rounded-full min-w-[28px] h-[28px] flex items-center justify-center"
                >
                  {countdown}s
                </Badge>
              )}
            </div>

            <Button
              onClick={handleRefreshVerification}
              variant="outline"
              className="w-full border-black text-black hover:bg-black/5"
              disabled={isResending || isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  I've Verified My Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-black py-4">
          <Button variant="ghost" className="text-black hover:bg-white hover:text-black" onClick={logout}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
