import { Button } from "@/components/ui/button"
import { WaveformVisual } from "@/components/waveform-visual"
import { Fingerprint, Shield, FileCheck } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen pt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="text-balance">Kinetic — The Black Box for Human Skill</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-400">
              Kinetic captures expert motion as cryptographically-verifiable training data — directly from the human
              body.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4">
              <Button className="h-12 bg-purple-600 px-6 text-white hover:bg-purple-700">Get Device</Button>
              <Button
                variant="outline"
                className="h-12 border-white/10 bg-transparent px-6 text-white hover:bg-white/5"
              >
                Explore Docs
              </Button>
            </div>

            {/* Code-like Microcopy */}
            <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-500" />
                <span>Edge signing</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-cyan-500" />
                <span>World ID verification</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-cyan-500" />
                <span>Story Protocol minting</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Waveform Panel */}
            <div className="relative h-80 overflow-hidden rounded-xl border border-white/10 bg-[#14141f] p-6 lg:h-96">
              <div className="absolute inset-0 opacity-50">
                <WaveformVisual animated={true} color="#a855f7" />
              </div>
              <div className="absolute inset-x-6 bottom-6">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0a0a0f]/90 p-4 backdrop-blur">
                  <div>
                    <p className="text-xs text-gray-500">Sample Motion Data</p>
                    <p className="text-sm font-medium text-white">Expert Welding Pattern</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/30 bg-transparent text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Mint Motion
                  </Button>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-purple-500/10 bg-purple-500/5" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full border border-cyan-500/10 bg-cyan-500/5" />
          </div>
        </div>
      </div>
    </section>
  )
}
