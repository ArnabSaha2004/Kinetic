"use client"

import { useState } from "react"
import { ChevronDown, Copy, Check } from "lucide-react"

export function DeveloperPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const apiExample = `GET /api/assets?category=welding&verified=true&page=1
Response: { data: [ { id, title, metadata, signature, creator, tags } ], total }`

  const cliExample = `npx kinetic-demo fetch --asset-id 0x1234`

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between py-4 text-left">
          <span className="text-sm font-medium text-white">Developer / API</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="space-y-4 pb-6">
            {/* API Example */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">API Request</p>
                <button
                  onClick={() => copyToClipboard(apiExample, "api")}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                >
                  {copied === "api" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "api" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-purple-950/30 border border-purple-500/10 p-4 text-xs text-gray-400">
                <code>{apiExample}</code>
              </pre>
            </div>

            {/* CLI Example */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">CLI Command</p>
                <button
                  onClick={() => copyToClipboard(cliExample, "cli")}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                >
                  {copied === "cli" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "cli" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-purple-950/30 border border-purple-500/10 p-4 text-xs text-gray-400">
                <code>{cliExample}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
