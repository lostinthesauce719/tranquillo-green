"use client"

import { useEffect, useRef, useState } from "react"

interface SparklineGraphProps {
  data: number[]
  label: string
  color?: "green" | "amber"
}

const COLORS = {
  green: "#22855a",
  amber: "#d4922a",
}

export function SparklineGraph({ data, label, color = "green" }: SparklineGraphProps) {
  const lineRef = useRef<SVGPathElement>(null)
  const [drawn, setDrawn] = useState(false)
  const stroke = COLORS[color]

  const w = 300
  const h = 120
  const pad = { top: 16, bottom: 12, left: 4, right: 4 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * plotW,
    y: pad.top + plotH - ((v - min) / range) * plotH,
  }))

  // Catmull-Rom to cubic bezier conversion
  function buildPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return ""
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(i + 2, pts.length - 1)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  const linePath = buildPath(points)
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + plotH} L${points[0].x},${pad.top + plotH} Z`

  useEffect(() => {
    if (!lineRef.current) return
    const len = lineRef.current.getTotalLength()
    lineRef.current.style.strokeDasharray = `${len}`
    lineRef.current.style.strokeDashoffset = `${len}`
    requestAnimationFrame(() => {
      lineRef.current!.style.transition = "stroke-dashoffset 1.2s ease-out"
      lineRef.current!.style.strokeDashoffset = "0"
    })
    const t = setTimeout(() => setDrawn(true), 1200)
    return () => clearTimeout(t)
  }, [data])

  const last = points[points.length - 1]
  const latest = data[data.length - 1]

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-text-muted tracking-wide uppercase">{label}</span>
        <span className="text-lg font-semibold tabular-nums" style={{ color: stroke }}>
          {latest.toLocaleString()}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`pulse-${color}`}>
            <stop offset="0%" stopColor={stroke} stopOpacity={0.6} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Y-axis labels */}
        <text x={w - 2} y={pad.top + 2} textAnchor="end" fontSize="9" fill={stroke} opacity={0.35}>
          {max.toLocaleString()}
        </text>
        <text x={w - 2} y={pad.top + plotH} textAnchor="end" fontSize="9" fill={stroke} opacity={0.35}>
          {min.toLocaleString()}
        </text>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#grad-${color})`} />

        {/* Line */}
        <path ref={lineRef} d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />

        {/* Latest point */}
        {drawn && (
          <g>
            <circle cx={last.x} cy={last.y} r={8} fill={`url(#pulse-${color})`}>
              <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={last.x} cy={last.y} r={3} fill={stroke} />
          </g>
        )}
      </svg>
    </div>
  )
}
