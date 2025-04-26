"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"

interface TopbarProps {
  onToggleSidebar: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth()

  return (
    <div className="h-16 border-b flex items-center justify-between px-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold ml-2">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-muted-foreground hidden md:inline-block">
            Welcome, {user.name || user.email}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </div>
  )
}
