"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientResponseError } from "pocketbase"
import { AlertCircle, Loader2, Save, User, Lock, Mail } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { pb } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
})

// Schema for email update
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

// Schema for password update
const passwordSchema = z
  .object({
    oldPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    passwordConfirm: z.string().min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type EmailFormValues = z.infer<typeof emailSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, refreshVerificationStatus } = useAuth()
  const [profileStatus, setProfileStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  })

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  })

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      passwordConfirm: "",
    },
  })

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return

    setIsUpdatingProfile(true)
    setProfileStatus(null)

    try {
      await pb.collection("users").update(user.id, {
        name: data.name,
      })

      setProfileStatus({
        success: true,
        message: "Profile updated successfully!",
      })

      // Refresh user data
      await refreshVerificationStatus()
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setProfileStatus({
          success: false,
          message: err.message,
        })
      } else {
        setProfileStatus({
          success: false,
          message: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle email update
  const onEmailSubmit = async (data: EmailFormValues) => {
    if (!user) return

    setIsUpdatingEmail(true)
    setEmailStatus(null)

    try {
      await pb.collection("users").requestEmailChange(data.email)

      setEmailStatus({
        success: true,
        message:
          "Verification email sent to your new email address. Please check your inbox and verify to complete the change.",
      })
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setEmailStatus({
          success: false,
          message: err.message,
        })
      } else {
        setEmailStatus({
          success: false,
          message: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // Handle password update
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return

    setIsUpdatingPassword(true)
    setPasswordStatus(null)

    try {
      await pb.collection("users").update(user.id, {
        oldPassword: data.oldPassword,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      })

      setPasswordStatus({
        success: true,
        message: "Password updated successfully!",
      })

      // Reset form
      passwordForm.reset({
        oldPassword: "",
        password: "",
        passwordConfirm: "",
      })
    } catch (err) {
      if (err instanceof ClientResponseError) {
        setPasswordStatus({
          success: false,
          message: err.message,
        })
      } else {
        setPasswordStatus({
          success: false,
          message: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-black">Account Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 border border-black">
          <TabsTrigger value="profile" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Lock className="mr-2 h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-black">
            <CardHeader className="border-b border-black">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription className="text-black">Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {profileStatus && (
                <Alert
                  variant={profileStatus.success ? "default" : "destructive"}
                  className={`mb-4 border ${
                    profileStatus.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{profileStatus.message}</AlertDescription>
                </Alert>
              )}

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} className="border-black focus:ring-black" />
                        </FormControl>
                        <FormDescription>This is your public display name.</FormDescription>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-black/90"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card className="border-black">
            <CardHeader className="border-b border-black">
              <CardTitle>Change Email</CardTitle>
              <CardDescription className="text-black">Update your email address</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {emailStatus && (
                <Alert
                  variant={emailStatus.success ? "default" : "destructive"}
                  className={`mb-4 border ${
                    emailStatus.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{emailStatus.message}</AlertDescription>
                </Alert>
              )}

              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">New Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.new.email@example.com"
                            {...field}
                            className="border-black focus:ring-black"
                          />
                        </FormControl>
                        <FormDescription>
                          You will need to verify your new email address before the change takes effect.
                        </FormDescription>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-black/90"
                    disabled={isUpdatingEmail}
                  >
                    {isUpdatingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Email
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="border-black">
            <CardHeader className="border-b border-black">
              <CardTitle>Change Password</CardTitle>
              <CardDescription className="text-black">Update your password</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {passwordStatus && (
                <Alert
                  variant={passwordStatus.success ? "default" : "destructive"}
                  className={`mb-4 border ${
                    passwordStatus.success ? "border-black bg-white text-black" : "border-black bg-white text-black"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordStatus.message}</AlertDescription>
                </Alert>
              )}

              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Current Password</FormLabel>
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
                    control={passwordForm.control}
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
                        <FormDescription>Password must be at least 8 characters.</FormDescription>
                        <FormMessage className="text-black" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
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
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
