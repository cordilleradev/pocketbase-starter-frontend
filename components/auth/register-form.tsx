"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientResponseError } from "pocketbase"
import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    passwordConfirm: z.string().min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      await register(data.email, data.password, data.passwordConfirm, data.name)
      router.push("/dashboard")
    } catch (err) {
      if (err instanceof ClientResponseError) {
        // Check for the specific email already exists error
        if (err.response?.data?.email?.message === "This email already exists.") {
          setError("This email already exists.")
        } else if (err.response?.data?.email?.message) {
          // Handle other email-related errors
          setError(err.response.data.email.message)
        } else {
          // Handle other errors
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border border-black">
      <CardHeader className="border-b border-black">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription className="text-black">Enter your details to create a new account</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4 border border-black bg-white text-black">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="border-black focus:ring-black" />
                  </FormControl>
                  <FormMessage className="text-black" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} className="border-black focus:ring-black" />
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
                  <FormMessage className="text-black" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Confirm Password</FormLabel>
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
            <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-black py-4">
        <p className="text-sm text-black">
          Already have an account?{" "}
          <Link href="/login" className="text-black font-bold underline underline-offset-4">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
