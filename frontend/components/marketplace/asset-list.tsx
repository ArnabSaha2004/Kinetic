"use client"

import { BadgeCheck, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Asset } from "./asset-card"

interface AssetListProps {
  assets: Asset[]
  onView: (asset: Asset) => void
  onRequestAccess: (asset: Asset) => void
}

export function AssetList({ assets, onView, onRequestAccess }: AssetListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Duration</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Rate</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Creator</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Minted</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-[#94a3b8]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]">
              <td className="px-4 py-4">
                <span className="font-medium text-white">{asset.title}</span>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-[#94a3b8]">{asset.categories[0]}</span>
              </td>
              <td className="px-4 py-4 text-sm text-[#94a3b8]">{asset.duration}</td>
              <td className="px-4 py-4 text-sm text-[#94a3b8]">{asset.samplingRate}Hz</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[#94a3b8]">{asset.creator}</span>
                  {asset.verified && <BadgeCheck className="h-4 w-4 text-white" fill="#0a1120" />}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-[#94a3b8]">{asset.mintDate}</td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#94a3b8] hover:bg-white/5 hover:text-white"
                    onClick={() => onView(asset)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#94a3b8] hover:bg-white/5 hover:text-white"
                    onClick={() => onRequestAccess(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
