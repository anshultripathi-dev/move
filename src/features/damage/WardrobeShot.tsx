export function WardrobeShot({ after, label, annotate = true }: { after?: boolean; label: string; annotate?: boolean }) {
  const uid = label.replace(/[^a-zA-Z0-9]/g, '') + (after ? 'a' : 'b')
  return (
    <svg viewBox="0 0 480 560" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2130" /><stop offset="1" stopColor="#10151f" /></linearGradient>
        <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b8977a" /><stop offset="0.5" stopColor="#a68a6d" /><stop offset="1" stopColor="#9a7e62" /></linearGradient>
        <linearGradient id={`side-${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6f55" /><stop offset="1" stopColor="#6f573f" /></linearGradient>
        <filter id={`blur-${uid}`}><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <rect width="480" height="560" fill={`url(#wall-${uid})`} />
      <rect y="490" width="480" height="70" fill="#0c1018" />
      <ellipse cx="240" cy="500" rx="190" ry="18" fill="#000" opacity="0.5" filter={`url(#blur-${uid})`} />
      {/* wardrobe */}
      <polygon points="300,60 380,92 380,508 300,480" fill={`url(#side-${uid})`} />
      <rect x="90" y="60" width="210" height="420" fill={`url(#wood-${uid})`} />
      <rect x="96" y="66" width="97" height="408" fill="none" stroke="#00000033" strokeWidth="2" />
      <rect x="197" y="66" width="97" height="408" fill="none" stroke="#00000033" strokeWidth="2" />
      <rect x="180" y="250" width="6" height="70" rx="3" fill="#d1d5db" />
      <rect x="204" y="250" width="6" height="70" rx="3" fill="#d1d5db" />
      <rect x="90" y="480" width="210" height="14" fill="#6f573f" />
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="96" x2="294" y1={90 + i * 62} y2={92 + i * 62} stroke="#ffffff" strokeOpacity="0.04" strokeWidth="2" />)}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${306 + i * 10} ${70 + i * 4} V${480 + i * 4 - 6}`} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="3" />)}
      {after && (
        <g>
          <path d="M318 205 L331 238 L324 262 L345 296 L338 318 L360 338" stroke="#e8cda6" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M322 214 L336 247 L330 266 L350 301" stroke="#f3e0c0" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M327 200 L340 230" stroke="#e8cda6" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
          {annotate && (
            <g>
              <rect x="304" y="182" width="72" height="170" fill="#f87171" fillOpacity="0.08" stroke="#f87171" strokeWidth="1.6" strokeDasharray="5 3" />
              {[[304, 182], [376, 182], [304, 352], [376, 352]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="#fff" />)}
              <rect x="304" y="162" width="104" height="18" rx="3" fill="#f87171" />
              <text x="310" y="175" fontSize="11" fontWeight="700" fill="#1a0505" fontFamily="ui-monospace,monospace">SCRATCH · 92%</text>
            </g>
          )}
        </g>
      )}
      <rect x="0" y="528" width="480" height="32" fill="#00000088" />
      <text x="14" y="548" fontSize="12" fontWeight="700" fill="#e2e8f0" letterSpacing="1.5" fontFamily="ui-monospace,monospace">{label}</text>
    </svg>
  )
}
