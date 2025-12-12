import { Battery, Radio, Gauge, Package } from "lucide-react"

const specs = [
  { label: "Processor", value: "ESP32-C3" },
  { label: "IMU", value: "6-axis (Accel + Gyro)" },
  { label: "Battery", value: "400mAh LiPo" },
  { label: "Connectivity", value: "BLE 5.0" },
]

const features = [
  {
    icon: Battery,
    title: "8+ Hour Battery",
    description: "Full day of continuous capture",
  },
  {
    icon: Gauge,
    title: "50-200Hz Sampling",
    description: "Adjustable for your use case",
  },
  {
    icon: Radio,
    title: "BLE 5.0",
    description: "Low latency, reliable connection",
  },
  {
    icon: Package,
    title: "Modular Design",
    description: "Multiple mounting options",
  },
]

export function HardwareShowcase() {
  return (
    <section id="hardware" className="border-t border-white/[0.06] py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - Device Illustration */}
          <div className="relative">
            <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-2xl border border-purple-500/10 bg-purple-950/30 p-8 backdrop-blur-sm">
              {/* Device Silhouette */}
              <div className="flex h-full items-center justify-center">
                <div className="relative">
                  <div className="h-48 w-32 rounded-2xl border-2 border-purple-400/20 bg-purple-900/40">
                    <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-purple-400/60" />
                    <div className="absolute bottom-4 left-1/2 h-8 w-8 -translate-x-1/2 rounded-lg border border-purple-400/20 bg-purple-500/10" />
                  </div>
                  {/* Pulse rings */}
                  <div className="absolute inset-0 -m-8 animate-pulse rounded-full border border-purple-500/10" />
                  <div className="absolute inset-0 -m-16 animate-pulse rounded-full border border-purple-500/5" />
                </div>
              </div>

              {/* Specs Overlay */}
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-purple-500/10 bg-purple-950/90 p-4 backdrop-blur">
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <p className="text-xs text-gray-400">{spec.label}</p>
                      <p className="text-sm font-medium text-white">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Features */}
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Hardware Specifications</h2>
            <p className="mt-4 text-lg text-gray-400">
              Professional-grade sensors in a compact, wearable design built for researchers and developers.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-500/10 bg-purple-950/30">
                    <feature.icon className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
