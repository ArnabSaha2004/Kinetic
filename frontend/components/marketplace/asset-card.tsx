"use client"

import { useState } from "react"
import { BadgeCheck, MoreHorizontal, Play, Share, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WaveformVisual } from "@/components/waveform-visual"

export interface Asset {
  id: string
  title: string
  creator: string
  verified: boolean
  samplingRate: number
  duration: string
  mintDate: string
  categories: string[]
  thumbnail?: string
}

interface AssetCardProps {
  asset: Asset
  onView: (asset: Asset) => void
  onRequestAccess: (asset: Asset) => void
}

export function AssetCard({ asset, onView, onRequestAccess }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-purple-500/20 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-purple-500/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail / Waveform */}
      <div className="relative mb-4 h-32 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
        <WaveformVisual animated={isHovered} color="#a78bfa" />

        {/* Hover Play Button */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center bg-black/40 
            transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        >
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-purple-500/30">
            <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
          </button>
        </div>

        {/* Device Icon */}
        <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-black/40 backdrop-blur">
          <div className="h-3 w-2 rounded-sm border border-purple-400/40" />
        </div>
      </div>

      {/* Title & Creator */}
      <div className="mb-3">
        <h3 className="font-semibold text-white line-clamp-1">{asset.title}</h3>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm text-gray-400">{asset.creator}</span>
          {asset.verified && <BadgeCheck className="h-4 w-4 text-purple-300" fill="rgb(88, 28, 135)" />}
        </div>
      </div>

      {/* Metadata */}
      <p className="mb-3 text-xs text-gray-400">
        {asset.samplingRate}Hz • {asset.duration} • signed • {asset.mintDate}
      </p>

      {/* Categories */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {asset.categories.slice(0, 2).map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-xs text-gray-400"
          >
            {cat}
          </span>
        ))}
        {asset.categories.length > 2 && (
          <span className="rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-xs text-gray-400">
            +{asset.categories.length - 2}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-white/5 bg-transparent text-gray-300 transition-all duration-300 hover:border-purple-500/20 hover:bg-purple-500/5 hover:text-white"
          onClick={() => onView(asset)}
        >
          View
        </Button>
        <Button
          size="sm"
          className="flex-1 border border-purple-500/20 bg-purple-500/10 text-white transition-all duration-300 hover:bg-purple-500/20"
          onClick={() => onRequestAccess(asset)}
        >
          Request Access
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/10 bg-[#0a0a0f]/95 backdrop-blur">
            <DropdownMenuItem className="text-gray-300 focus:bg-white/5 focus:text-white">
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 focus:bg-white/5 focus:text-white">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
