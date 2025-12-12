"use client"

import { useState } from "react"
import { X, Fingerprint, Wallet } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuth: (method: "worldid" | "wallet") => void
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [authState, setAuthState] = useState<"idle" | "connecting" | "success">("idle")
  const [selectedMethod, setSelectedMethod] = useState<"worldid" | "wallet" | null>(null)

  if (!isOpen) return null

  const handleAuth = (method: "worldid" | "wallet") => {
    setSelectedMethod(method)
    setAuthState("connecting")

    // Mock authentication delay
    setTimeout(() => {
      setAuthState("success")
      setTimeout(() => {
        onAuth(method)
        onClose()
        setAuthState("idle")
        setSelectedMethod(null)
      }, 1000)
    }, 1500)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.06] bg-[#0a1120] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Log in to Kinetic</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Options */}
        {authState === "idle" && (
          <div className="space-y-4">
            <p className="text-[#94a3b8]">Choose your authentication method to access the marketplace.</p>

            {/* World ID */}
            <button
              onClick={() => handleAuth("worldid")}
              className="flex w-full items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0f172a] p-4 text-left transition-all hover:border-white/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">World ID</p>
                <p className="text-sm text-[#94a3b8]">Verify with World ID for verified creator status</p>
              </div>
            </button>

            {/* Wallet */}
            <button
              onClick={() => handleAuth("wallet")}
              className="flex w-full items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0f172a] p-4 text-left transition-all hover:border-white/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Connect Wallet</p>
                <p className="text-sm text-[#94a3b8]">Use MetaMask, WalletConnect, or other wallets</p>
              </div>
            </button>

            <p className="pt-4 text-center text-xs text-[#94a3b8]">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}

        {/* Connecting State */}
        {authState === "connecting" && (
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            <p className="font-medium text-white">
              {selectedMethod === "worldid" ? "Verifying with World ID..." : "Connecting wallet..."}
            </p>
            <p className="mt-2 text-sm text-[#94a3b8]">Please check your device</p>
          </div>
        )}

        {/* Success State */}
        {authState === "success" && (
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0a1120]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-white">Successfully authenticated!</p>
            <p className="mt-2 text-sm text-[#94a3b8]">
              {selectedMethod === "worldid" ? "World ID verified" : "Wallet connected"}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
