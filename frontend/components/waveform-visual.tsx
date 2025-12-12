"use client"

import { useEffect, useRef } from "react"

interface WaveformVisualProps {
  className?: string
  animated?: boolean
  color?: string
}

export function WaveformVisual({ className = "", animated = true, color = "#ffffff" }: WaveformVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    let offset = 0

    const drawWaveform = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Draw multiple waveform lines (simulating 6-axis IMU data)
      const lines = [
        { amplitude: 30, frequency: 0.02, phase: 0, opacity: 0.8 },
        { amplitude: 20, frequency: 0.03, phase: 2, opacity: 0.5 },
        { amplitude: 25, frequency: 0.015, phase: 4, opacity: 0.3 },
      ]

      lines.forEach((line) => {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.globalAlpha = line.opacity
        ctx.lineWidth = 1.5

        for (let x = 0; x < rect.width; x++) {
          const y =
            rect.height / 2 +
            Math.sin((x + offset) * line.frequency + line.phase) * line.amplitude +
            Math.sin((x + offset) * line.frequency * 2.5) * (line.amplitude * 0.3)

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      })

      ctx.globalAlpha = 1

      if (animated) {
        offset += 1.5
        animationRef.current = requestAnimationFrame(drawWaveform)
      }
    }

    drawWaveform()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animated, color])

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} style={{ display: "block" }} />
}
