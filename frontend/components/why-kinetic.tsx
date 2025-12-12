import { Shield, Fingerprint, Cpu } from "lucide-react"

const benefits = [
  {
    icon: Shield,
    title: "Provenance",
    description: "On-edge cryptographic signing ensures dataset integrity from the moment of capture.",
  },
  {
    icon: Fingerprint,
    title: "Verified Humans",
    description: "World ID verification prevents data poisoning and ensures authentic human motion.",
  },
  {
    icon: Cpu,
    title: "Affordable MoCap",
    description: "Low-cost wearable with open hardware design, accessible to researchers worldwide.",
  },
]

export function WhyKinetic() {
  return (
    <section className="border-t border-white/5 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Why Kinetic</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Built for the next generation of human-AI training data
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-purple-500/20 hover:bg-white/[0.03]"
            >
              <benefit.icon className="mb-4 h-8 w-8 text-purple-400/70" />
              <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
              <p className="leading-relaxed text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
