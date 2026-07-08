"use client"

import { useState } from "react"
import { User, Mail, Shield, Edit, Lock } from "lucide-react"
import Link from "next/link"

export default function AdminProfilePage() {
  // Temporary static admin data
  const [admin] = useState({
    name: "Admin User",
    email: "admin@scholarhub.com",
    role: "Administrator",
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your admin account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Avatar Section */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {admin.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {admin.role}
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">

            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">
                  {admin.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">
                  {admin.role}
                </p>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/admin/edit-profile"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Link>

            <Link
              href="/admin/change-password"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}