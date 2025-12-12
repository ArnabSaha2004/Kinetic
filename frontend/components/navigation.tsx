"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Github } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#hardware", label: "Hardware" },
  { href: "#marketplace", label: "Marketplace" },
  { href: "#docs", label: "Docs" },
]

interface NavigationProps {
  onAuthClick: () => void
}

export function Navigation({ onAuthClick }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold tracking-tight text-white">
          Kinetic
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:bg-white/5 hover:text-white"
            onClick={onAuthClick}
          >
            Log in
          </Button>
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/20 bg-transparent text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30"
          >
            Get Device
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/5 bg-[#0a0a0f] md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-white/5 hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onAuthClick()
                }}
              >
                Log in
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/20 bg-transparent text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30"
              >
                Get Device
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
