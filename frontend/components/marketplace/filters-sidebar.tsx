"use client"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = ["Welding", "Surgery", "Assembly", "Sports", "Animation", "Other"]

export interface FilterState {
  search: string
  categories: string[]
  minHz: number
  maxHz: number
  verifiedOnly: boolean
  sort: string
}

interface FiltersSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
}

export function FiltersSidebar({ filters, onFiltersChange, isOpen, onClose }: FiltersSidebarProps) {
  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      categories: [],
      minHz: 50,
      maxHz: 200,
      verifiedOnly: false,
      sort: "newest",
    })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-80 
          transform overflow-y-auto border-r border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl
          transition-transform lg:static lg:z-auto lg:h-auto lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={clearFilters}>
                Clear all
              </Button>
              <button className="lg:hidden text-gray-400 hover:text-white" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Label className="mb-2 block text-sm text-gray-400">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="e.g., welding, suturing"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="border-white/5 bg-white/[0.02] pl-10 text-white placeholder:text-gray-500 transition-colors duration-300 focus:border-purple-500/20"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm text-gray-400">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`
                    rounded-full px-3 py-1.5 text-sm transition-all duration-300
                    ${
                      filters.categories.includes(category)
                        ? "border border-purple-500/30 bg-purple-500/10 text-white"
                        : "border border-white/5 bg-white/[0.02] text-gray-400 hover:border-purple-500/20 hover:text-white"
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Sampling Rate */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm text-gray-400">Sampling Rate (Hz)</Label>
            <div className="space-y-4">
              <Slider
                value={[filters.minHz, filters.maxHz]}
                onValueChange={([min, max]) => onFiltersChange({ ...filters, minHz: min, maxHz: max })}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{filters.minHz}Hz</span>
                <span>{filters.maxHz}Hz</span>
              </div>
            </div>
          </div>

          {/* Verified Only */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white">Verified Only</Label>
              <Switch
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, verifiedOnly: checked })}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Only show World ID verified creators</p>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <Label className="mb-2 block text-sm text-gray-400">Sort by</Label>
            <Select value={filters.sort} onValueChange={(value) => onFiltersChange({ ...filters, sort: value })}>
              <SelectTrigger className="border-white/5 bg-white/[0.02] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="verified">Most Verified</SelectItem>
                <SelectItem value="used">Most Used</SelectItem>
                <SelectItem value="rate">Highest Sample Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </aside>
    </>
  )
}
