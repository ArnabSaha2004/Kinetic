"use client"

import { useState } from "react"
import { Grid3X3, List, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FiltersSidebar, type FilterState } from "./filters-sidebar"
import { AssetCard, type Asset } from "./asset-card"
import { AssetList } from "./asset-list"

// Mock data
const mockAssets: Asset[] = [
  {
    id: "1",
    title: "Expert Welding Pattern A",
    creator: "0x1a2b...3c4d",
    verified: true,
    samplingRate: 100,
    duration: "6s",
    mintDate: "2025-09-15",
    categories: ["Welding", "Assembly"],
  },
  {
    id: "2",
    title: "Laparoscopic Suturing Demo",
    creator: "DrMotion",
    verified: true,
    samplingRate: 200,
    duration: "12s",
    mintDate: "2025-09-14",
    categories: ["Surgery"],
  },
  {
    id: "3",
    title: "Pick-and-Place Routine",
    creator: "RoboticsLab",
    verified: false,
    samplingRate: 150,
    duration: "8s",
    mintDate: "2025-09-13",
    categories: ["Assembly", "Animation"],
  },
  {
    id: "4",
    title: "Tennis Serve Analysis",
    creator: "SportsCapture",
    verified: true,
    samplingRate: 200,
    duration: "4s",
    mintDate: "2025-09-12",
    categories: ["Sports"],
  },
  {
    id: "5",
    title: "Precision Soldering",
    creator: "ElectraMaker",
    verified: true,
    samplingRate: 100,
    duration: "15s",
    mintDate: "2025-09-11",
    categories: ["Assembly", "Other"],
  },
  {
    id: "6",
    title: "Dance Motion Capture",
    creator: "AnimStudio",
    verified: false,
    samplingRate: 150,
    duration: "30s",
    mintDate: "2025-09-10",
    categories: ["Animation", "Sports"],
  },
]

interface MarketplaceProps {
  onAssetView: (asset: Asset) => void
  onRequestAccess: (asset: Asset) => void
}

export function Marketplace({ onAssetView, onRequestAccess }: MarketplaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    minHz: 50,
    maxHz: 200,
    verifiedOnly: false,
    sort: "newest",
  })

  // Filter assets (client-side for demo)
  const filteredAssets = mockAssets.filter((asset) => {
    if (filters.search && !asset.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.categories.length > 0 && !asset.categories.some((c) => filters.categories.includes(c))) {
      return false
    }
    if (asset.samplingRate < filters.minHz || asset.samplingRate > filters.maxHz) {
      return false
    }
    if (filters.verifiedOnly && !asset.verified) {
      return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredAssets.length / 6)

  return (
    <section id="marketplace" className="border-t border-white/5 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Marketplace</h2>
            <p className="mt-2 text-lg text-gray-400">Discover and license verified motion assets</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/20 bg-transparent text-white hover:bg-purple-500/10 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-white/5 bg-white/[0.02] p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-300 ${
                  viewMode === "grid" ? "bg-purple-500/20 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-300 ${
                  viewMode === "list" ? "bg-purple-500/20 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <FiltersSidebar
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Assets */}
          <div className="flex-1">
            {filteredAssets.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.02]">
                  <Grid3X3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">No assets found</h3>
                <p className="mb-6 max-w-sm text-center text-gray-400">
                  Try adjusting your filters or search terms to find motion assets.
                </p>
                <Button
                  variant="outline"
                  className="border-white/5 bg-transparent text-white hover:border-purple-500/20 hover:bg-white/5"
                  onClick={() =>
                    setFilters({
                      search: "",
                      categories: [],
                      minHz: 50,
                      maxHz: 200,
                      verifiedOnly: false,
                      sort: "newest",
                    })
                  }
                >
                  Clear filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onView={onAssetView} onRequestAccess={onRequestAccess} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02]">
                <AssetList assets={filteredAssets} onView={onAssetView} onRequestAccess={onRequestAccess} />
              </div>
            )}

            {/* Pagination */}
            {filteredAssets.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-white/5 bg-transparent text-white transition-all duration-300 hover:border-purple-500/20 hover:bg-white/5"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-white/5 bg-transparent text-white transition-all duration-300 hover:border-purple-500/20 hover:bg-white/5"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* API Integration Hint */}
            <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="mb-2 text-sm font-medium text-white">API Integration</p>
              <code className="block overflow-x-auto whitespace-pre rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-purple-300/70">
                {`GET /api/assets?category=welding&verified=true&page=1`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
