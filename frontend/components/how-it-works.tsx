import { Watch, Smartphone, Server, FileCheck, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Watch,
    title: "Wearable",
    description: "Capture motion with IMU sensors",
  },
  {
    icon: Smartphone,
    title: "Phone App",
    description: "Real-time BLE gateway & visualization",
  },
  {
    icon: Server,
    title: "Backend",
    description: "Secure storage & processing",
  },
  {
    icon: FileCheck,
    title: "Story Protocol",
    description: "Mint & license your motion data",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">How Kinetic Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            From motion capture to minted asset in four simple steps
          </p>
        </div>

        {/* Desktop Flow */}
        <div className="hidden items-center justify-center gap-4 lg:flex">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-950/30">
                  <step.icon className="h-8 w-8 text-purple-300" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-1 max-w-32 text-center text-sm text-gray-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && <ArrowRight className="mx-6 h-6 w-6 text-purple-500/20" />}
            </div>
          ))}
        </div>

        {/* Mobile Flow */}
        <div className="space-y-4 lg:hidden">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-center gap-4 rounded-xl border border-purple-500/10 bg-purple-950/30 p-4"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-purple-500/10 bg-purple-900/30">
                <step.icon className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Step {index + 1}</span>
                </div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
