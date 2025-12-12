import { Activity, Shield, Smartphone, FileCheck } from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "High-frequency Capture",
    description: "50–200Hz sampling rate captures every nuance of expert motion with precision.",
  },
  {
    icon: Shield,
    title: "Edge Cryptographic Signing",
    description: "Motion data is signed on-device before transmission, ensuring tamper-proof provenance.",
  },
  {
    icon: Smartphone,
    title: "Phone Gateway + Live Viz",
    description: "Real-time visualization through your phone with seamless BLE connectivity.",
  },
  {
    icon: FileCheck,
    title: "Story Protocol Minting",
    description: "Transform motion assets into licensable IP with built-in attribution and royalties.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="border-t border-white/5 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Features</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Professional-grade motion capture in a wearable form factor
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-purple-500/20 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] transition-colors duration-300 group-hover:border-purple-500/20 group-hover:bg-purple-500/5">
                <feature.icon className="h-6 w-6 text-purple-400/70 transition-colors duration-300 group-hover:text-purple-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="leading-relaxed text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
