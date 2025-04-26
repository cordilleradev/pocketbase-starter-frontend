"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientResponseError } from "pocketbase"
import { AlertCircle, ArrowLeft, Loader2, Mail } from "lucide-react"

import { pb } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setStatus(null)

    try {
      await pb.collection("users").requestPasswordReset(data.email)
      setStatus({
        success: true,
        message: "Password reset instructions have been sent to your email.",
      })
      form.reset()
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setStatus({
          success: false,
          message: err.message,
        })
      } else {
        setStatus({
          success: false,
          message: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto border border-black">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription className="text-black">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {status && (
            <Alert
              variant={status.success ? "default" : "destructive"}
              className={`mb-4 border ${
                status.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {status?.success ? (
            <div className="flex flex-col items-center justify-center p-6 border border-black text-center space-y-4">
              <Mail className="h-12 w-12 text-black" />
              <h2 className="text-xl font-medium">Check Your Email</h2>
              <p className="text-black">
                We've sent password reset instructions to your email. Please check your inbox and follow the link to
                reset your password.
              </p>
            </div>
          ) : (
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
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
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
