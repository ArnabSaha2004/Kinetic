"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { WhyKinetic } from "@/components/why-kinetic"
import { FeaturesGrid } from "@/components/features-grid"
import { HowItWorks } from "@/components/how-it-works"
import { HardwareShowcase } from "@/components/hardware-showcase"
import { Marketplace } from "@/components/marketplace/marketplace"
import { AssetModal } from "@/components/marketplace/asset-modal"
import { AuthModal } from "@/components/auth-modal"
import { DeveloperPanel } from "@/components/developer-panel"
import { Footer } from "@/components/footer"
import type { Asset } from "@/components/marketplace/asset-card"

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMethod, setAuthMethod] = useState<"worldid" | "wallet" | null>(null)

  const handleAssetView = (asset: Asset) => {
    setSelectedAsset(asset)
    setAssetModalOpen(true)
  }

  const handleRequestAccess = (asset: Asset) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
    } else {
      // Handle access request
      console.log("Requesting access to:", asset.title)
    }
  }

  const handleAuth = (method: "worldid" | "wallet") => {
    setIsAuthenticated(true)
    setAuthMethod(method)
  }

  return (
    <main className="min-h-screen">
      <Navigation onAuthClick={() => setAuthModalOpen(true)} />
      <Hero />
      <WhyKinetic />
      <FeaturesGrid />
      <HowItWorks />
      <HardwareShowcase />
      <Marketplace onAssetView={handleAssetView} onRequestAccess={handleRequestAccess} />
      <DeveloperPanel />
      <Footer />

      {/* Modals */}
      <AssetModal
        asset={selectedAsset}
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onRequestAccess={handleRequestAccess}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuth={handleAuth} />
    </main>
  )
}
