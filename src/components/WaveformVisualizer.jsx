'use client'
import { useEffect, useRef } from 'react'

export default function WaveformVisualizer({ analyser, barCount = 40, color = '#818CF8', isActive = true }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      let bars
      if (analyser && isActive) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        // Sample barCount values evenly
        bars = Array.from({ length: barCount }, (_, i) => {
          const idx = Math.floor((i / barCount) * bufferLength)
          return dataArray[idx] / 255
        })
      } else {
        // Idle gentle animation
        const t = Date.now() / 1000
        bars = Array.from({ length: barCount }, (_, i) => {
          const phase = (i / barCount) * Math.PI * 2
          return (Math.sin(t * 1.5 + phase) * 0.3 + 0.35) * (isActive ? 1 : 0.3)
        })
      }

      const barWidth = (W / barCount) * 0.6
      const gap = (W / barCount) * 0.4
      const maxBarH = H * 0.85

      bars.forEach((val, i) => {
        const x = i * (barWidth + gap) + gap / 2
        const barH = Math.max(4, val * maxBarH)
        const y = (H - barH) / 2

        // Gradient per bar
        const grad = ctx.createLinearGradient(0, y, 0, y + barH)
        grad.addColorStop(0, `${color}CC`)
        grad.addColorStop(0.5, `${color}FF`)
        grad.addColorStop(1, `${color}66`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barH, barWidth / 2)
        ctx.fill()
      })
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [analyser, barCount, color, isActive])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full max-w-2xl h-40"
      style={{ maxWidth: '100%' }}
    />
  )
}
