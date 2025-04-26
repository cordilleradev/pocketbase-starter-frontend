"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientResponseError } from "pocketbase"
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react"

import { pb } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    passwordConfirm: z.string().min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  })

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Reset token is missing. Please check your email link.")
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setStatus("error")
      setMessage("Reset token is missing. Please check your email link.")
      return
    }

    setIsSubmitting(true)

    try {
      await pb.collection("users").confirmPasswordReset(token, data.password, data.passwordConfirm)
      setStatus("success")
      setMessage("Your password has been reset successfully!")
      form.reset()
    } catch (err) {
      setStatus("error")
      if (err instanceof ClientResponseError) {
        setMessage(err.message)
      } else {
        setMessage("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto border border-black">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription className="text-black">Create a new password for your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {status === "error" && (
            <Alert variant="destructive" className="mb-4 border border-black bg-white text-black">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "success" ? (
            <div className="flex flex-col items-center justify-center p-6 border border-black text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-black" />
              <h2 className="text-xl font-medium">Password Reset Successful</h2>
              <p className="text-black">
                Your password has been reset successfully. You can now login with your new password.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">New Password</FormLabel>
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
                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Confirm New Password</FormLabel>
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
                  disabled={isSubmitting || status === "error" || !token}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-black py-4">
          <Link href="/login" className="text-sm text-black flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
