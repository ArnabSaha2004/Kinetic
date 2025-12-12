"use client"

import { X, BadgeCheck, ExternalLink, Download, GitFork, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WaveformVisual } from "@/components/waveform-visual"
import type { Asset } from "./asset-card"

interface AssetModalProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  onRequestAccess: (asset: Asset) => void
}

export function AssetModal({ asset, isOpen, onClose, onRequestAccess }: AssetModalProps) {
  if (!isOpen || !asset) return null

  // Mock additional data for the modal
  const mockMetadata = {
    hash: "0x7a8b9c...def123",
    signature: "ed25519:abc...xyz",
    firmwareVersion: "v1.2.3",
    timestamp: "2025-09-15T14:32:00Z",
  }

  const mockActivity = [
    { type: "view", user: "0x1234...5678", date: "2h ago" },
    { type: "fork", user: "MotionDev", date: "1d ago" },
    { type: "view", user: "ResearchLab", date: "3d ago" },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{asset.title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left - Waveform Viewer */}
            <div>
              <div className="relative mb-4 h-64 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                <WaveformVisual animated={true} color="#a855f7" />
              </div>

              {/* Playback Scrubber (mock) */}
              <div className="mb-6">
                <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/3 rounded-full bg-purple-500/70" />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0:02</span>
                  <span>{asset.duration}</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hash</span>
                    <span className="font-mono text-white">{mockMetadata.hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Signature</span>
                    <span className="font-mono text-white">{mockMetadata.signature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Firmware</span>
                    <span className="text-white">{mockMetadata.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timestamp</span>
                    <span className="text-white">{mockMetadata.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Details */}
            <div className="space-y-6">
              {/* Creator */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Creator</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white">
                    {asset.creator.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white">{asset.creator}</span>
                      {asset.verified && <BadgeCheck className="h-4 w-4 text-purple-400" fill="currentColor" />}
                    </div>
                    {asset.verified && <p className="text-xs text-gray-400">World ID Verified</p>}
                  </div>
                </div>
              </div>

              {/* Asset Info */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Asset Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Sampling Rate</p>
                    <p className="font-medium text-white">{asset.samplingRate}Hz</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="font-medium text-white">{asset.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Mint Date</p>
                    <p className="font-medium text-white">{asset.mintDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Categories</p>
                    <p className="font-medium text-white">{asset.categories.join(", ")}</p>
                  </div>
                </div>
              </div>

              {/* Licensing Terms */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Licensing Terms</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  This motion asset is licensed under Story Protocol. Commercial use requires attribution and royalty
                  payments. Derivatives must be registered.
                </p>
              </div>

              {/* Activity */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Recent Activity</h3>
                <div className="space-y-3">
                  {mockActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      {activity.type === "view" && <Eye className="h-4 w-4 text-gray-400" />}
                      {activity.type === "fork" && <GitFork className="h-4 w-4 text-gray-400" />}
                      <span className="text-gray-400">
                        <span className="text-white">{activity.user}</span>{" "}
                        {activity.type === "view" ? "viewed" : "forked"}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 px-6 py-4">
          <Button
            variant="outline"
            className="border-white/5 bg-transparent text-white transition-all duration-300 hover:border-purple-500/20 hover:bg-white/5"
            onClick={() => window.open("https://story.xyz", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Story Explorer
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-white/5 bg-transparent text-white transition-all duration-300 hover:border-purple-500/20 hover:bg-white/5"
              disabled
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              className="border border-purple-500/20 bg-purple-500/10 text-white transition-all duration-300 hover:bg-purple-500/20"
              onClick={() => onRequestAccess(asset)}
            >
              Request Access / Buy License
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
