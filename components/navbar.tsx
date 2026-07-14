"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { GraduationCap, Menu, X, Search } from "lucide-react"

export function Navbar() {
  const { t } = useLanguage()
  const pathname = usePathname()

  const hideLogin =
    pathname.startsWith("/student") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register"

  // Hide entire navbar on login/register
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (pathname !== "/") return

    const handleScroll = () => {
      const section = document.getElementById("scholarships")
      if (!section) return

      const rect = section.getBoundingClientRect()

      if (rect.top <= 120 && rect.bottom >= 120) {
        setActive("scholarships")
      } else {
        setActive("home")
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  useEffect(() => {
    if (pathname === "/contact") {
      setActive("contact")
    }
  }, [pathname])

  const navItems = [
    { id: "home", label: t("home"), href: "/" },
    { id: "scholarships", label: t("scholarships"), href: "/#scholarships" },
    { id: "contact", label: t("contactUs"), href: "/contact" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-semibold text-gray-800">
            ScholarPath
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">

          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === item.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Login (Hidden on admin/student/auth pages) */}
          {!hideLogin && (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {t("login") || "Login"}
            </Link>
          )}
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-6 space-y-4 bg-white border-t">

          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}

          {!hideLogin && (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm bg-primary text-white text-center"
            >
              {t("login") || "Login"}
            </Link>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

        </div>
      )}
    </nav>
  )
}
