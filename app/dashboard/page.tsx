"use client"

import { useAuth } from "@/context/auth-context"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="h-full w-full">
      {/* Empty dashboard content area - ready for new content */}
      <div className="flex h-full items-center justify-center">
        <h1 className="text-3xl font-bold text-black">Hello {user?.name || user?.email}!</h1>
      </div>
    </div>
  )
}
