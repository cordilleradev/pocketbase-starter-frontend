"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Bell, ChevronLeft, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NavbarProps {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutConfirm(false)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-black bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden text-black hover:bg-black/5">
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-sm font-medium text-black">Home</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-black hover:bg-black/5">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-black hover:bg-black/5">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black bg-white">
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="border border-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              You will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black text-black hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-black text-white hover:bg-black/90">
              Yes, log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
