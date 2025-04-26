"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { pb } from "@/lib/pocketbase"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfirmVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Verification token is missing. Please check your email link.")
        return
      }

      try {
        // Confirm the email verification using the token
        await pb.collection("users").confirmVerification(token)

        // If successful, update status
        setStatus("success")
        setMessage("Your email has been successfully verified! Please login to access your account.")

        // No automatic redirect
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("Failed to verify your email. The token may be invalid or expired.")
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto border border-black">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-black" />
              <p className="text-center text-black">Verifying your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-black" />
              <p className="text-center text-black font-medium">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-black" />
              <p className="text-center text-black font-medium">{message}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-black py-4">
          {status === "success" && (
            <p className="text-sm text-black">
              Please{" "}
              <Link href="/login" className="text-black font-bold underline underline-offset-4">
                login
              </Link>{" "}
              to access your account.
            </p>
          )}

          {status === "error" && (
            <div className="flex flex-col space-y-2 w-full">
              <Link href="/login" className="text-center text-sm text-black underline underline-offset-4">
                Return to Login
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
