/**
 * CategoryPlaceholder — the image slot for a listing card / detail hero
 * when the seller has not uploaded a photo.
 *
 * Replaces the previous "giant emoji on a pastel gradient" fallback that
 * made the marketplace read as unfurnished. Each category renders a
 * restrained, sector-specific SVG illustration on a soft gradient — clearly
 * a placeholder, but professional.
 *
 * If NEXT_PUBLIC_LISTING_PLACEHOLDER_CDN is set, the component uses a
 * <category>[-<type>].jpg from that CDN instead, and falls back to the
 * SVG on load error. This lets ops swap in real stock photography without
 * a code change.
 */

'use client'

type Section = 'ma' | 'fleet' | 'contracts' | 'jobs' | 'forum' | (string & {})
type Variant = 'sale' | 'rent' | 'wanted' | 'offer' | 'job' | 'job_seeker' | 'discussion' | 'acquisition' | (string & {})

interface Props {
  section:  Section
  variant?: Variant
  className?: string
}

const CDN = process.env.NEXT_PUBLIC_LISTING_PLACEHOLDER_CDN

/* Subject-appropriate gradient bands (Tailwind class names — stay in sync
   with tailwind.config.ts safelist if you use JIT). */
const GRADIENT: Record<string, string> = {
  fleet:     'from-sky-50 via-sky-100 to-blue-200',
  ma:        'from-indigo-50 via-indigo-100 to-indigo-200',
  contracts: 'from-amber-50 via-amber-100 to-amber-200',
  jobs:      'from-purple-50 via-purple-100 to-purple-200',
  forum:     'from-rose-50 via-rose-100 to-rose-200',
}

/* Ink colors — deep enough to read against the gradient at any size. */
const INK: Record<string, string> = {
  fleet:     '#1e40af',
  ma:        '#3730a3',
  contracts: '#92400e',
  jobs:      '#6b21a8',
  forum:     '#9f1239',
}

/* Bilingual watermark, so a card that never gets a photo still communicates
   what the seller is offering. */
const LABEL: Record<string, { ar: string; en: string }> = {
  fleet:     { ar: 'أسطول',   en: 'Fleet'      },
  ma:        { ar: 'استحواذ', en: 'M&A'        },
  contracts: { ar: 'عقود',    en: 'Contracts'  },
  jobs:      { ar: 'وظائف',   en: 'Jobs'       },
  forum:     { ar: 'نقاش',    en: 'Discussion' },
}

/* Optional glyph over the illustration — signals demand vs supply without
   changing the base drawing. */
const OVERLAY: Record<string, string> = {
  wanted:      '🔍',
  job_seeker:  '🔍',
  acquisition: '📥',
}

export default function CategoryPlaceholder({ section, variant, className = '' }: Props) {
  const gradient = GRADIENT[section] ?? 'from-slate-50 via-slate-100 to-slate-200'
  const ink      = INK[section]      ?? '#334155'
  const label    = LABEL[section]    ?? { ar: 'إعلان', en: 'Listing' }
  const overlay  = variant ? OVERLAY[variant] : undefined

  // If a real image CDN is configured, prefer it. The <img>'s onError falls
  // back to the SVG below by hiding itself, so the gradient + drawing still
  // shows when the network / file is missing.
  const cdnUrl = CDN
    ? `${CDN.replace(/\/+$/, '')}/${section}${variant ? `-${variant}` : ''}.jpg`
    : null

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${gradient} ${className}`}
      aria-hidden="true"
    >
      {cdnUrl && (
        <img
          src={cdnUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          loading="lazy"
        />
      )}

      {/* Inline SVG illustration — the reliable fallback. */}
      <svg
        viewBox="0 0 400 240"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <SectionIllustration section={section} ink={ink} />

        {/* Subtle bilingual watermark, bottom-right (LTR frame — mirrors
            visually the same in RTL because it's absolute). */}
        <text
          x="380"
          y="220"
          textAnchor="end"
          fill={ink}
          opacity="0.35"
          fontSize="14"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          {label.en.toUpperCase()}
        </text>
      </svg>

      {/* Demand overlay (wanted / job_seeker / acquisition) */}
      {overlay && (
        <div className="absolute top-3 start-3 w-8 h-8 rounded-full bg-white/90
                        shadow-sm flex items-center justify-center text-sm">
          {overlay}
        </div>
      )}
    </div>
  )
}

/* ── Per-section drawings ─────────────────────────────────────────────── */

function SectionIllustration({ section, ink }: { section: Section; ink: string }) {
  switch (section) {
    case 'fleet':     return <Truck ink={ink} />
    case 'ma':        return <Buildings ink={ink} />
    case 'contracts': return <Document ink={ink} />
    case 'jobs':      return <Briefcase ink={ink} />
    case 'forum':     return <ChatBubbles ink={ink} />
    default:          return <Package ink={ink} />
  }
}

/* Semi-transparent fills keep the drawings quiet against the gradient. */
const FILL   = { opacity: 0.9 }
const ACCENT = { opacity: 0.7 }

function Truck({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none">
      {/* Cargo box */}
      <rect x="60"  y="90"  width="160" height="80"  rx="4" fill={ink} {...FILL} opacity="0.15" />
      {/* Cab */}
      <path d="M220 110 L260 110 L290 140 L290 170 L220 170 Z" fill={ink} {...FILL} opacity="0.2" />
      {/* Window */}
      <path d="M232 118 L256 118 L275 138 L232 138 Z" fill={ink} opacity="0.4" />
      {/* Wheels */}
      <circle cx="105" cy="185" r="18" fill={ink} {...FILL} />
      <circle cx="105" cy="185" r="7"  fill="#fff" />
      <circle cx="175" cy="185" r="18" fill={ink} {...FILL} />
      <circle cx="175" cy="185" r="7"  fill="#fff" />
      <circle cx="255" cy="185" r="18" fill={ink} {...FILL} />
      <circle cx="255" cy="185" r="7"  fill="#fff" />
      {/* Cargo divider */}
      <line x1="140" y1="95" x2="140" y2="165" stroke={ink} strokeWidth="1.5" opacity="0.3" />
      {/* Ground */}
      <line x1="20" y1="205" x2="380" y2="205" stroke={ink} strokeWidth="1" opacity="0.2" strokeDasharray="4 6" />
    </g>
  )
}

function Buildings({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" fill="none">
      {/* Left tower */}
      <rect x="80"  y="70"  width="90"  height="130" fill={ink} {...FILL} opacity="0.15" />
      {/* Right tower */}
      <rect x="200" y="110" width="120" height="90"  fill={ink} {...FILL} opacity="0.2" />
      {/* Windows — left */}
      {[0,1,2,3].map(r => [0,1,2].map(c => (
        <rect key={`l-${r}-${c}`} x={92 + c * 24} y={82 + r * 26} width="14" height="14" fill={ink} opacity="0.4" />
      )))}
      {/* Windows — right */}
      {[0,1,2].map(r => [0,1,2,3].map(c => (
        <rect key={`r-${r}-${c}`} x={212 + c * 26} y={122 + r * 24} width="16" height="14" fill={ink} opacity="0.4" />
      )))}
      {/* Ground */}
      <line x1="20" y1="205" x2="380" y2="205" stroke={ink} strokeWidth="1" opacity="0.2" strokeDasharray="4 6" />
    </g>
  )
}

function Document({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" fill="none">
      {/* Back doc */}
      <rect x="140" y="55"  width="140" height="170" rx="6" fill={ink} {...ACCENT} opacity="0.15" />
      {/* Front doc */}
      <path d="M110 75 L230 75 L260 105 L260 195 L110 195 Z" fill="#fff" opacity="0.85" />
      <path d="M230 75 L230 105 L260 105 Z" fill={ink} opacity="0.25" />
      {/* Text lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="128" y1={125 + i * 14} x2={i === 4 ? 200 : 240} y2={125 + i * 14} stroke={ink} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
      ))}
      {/* Signature */}
      <path d="M128 178 Q145 172 160 178 T195 178" stroke={ink} strokeWidth="2.5" opacity="0.6" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Briefcase({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" fill="none">
      {/* Handle */}
      <path d="M160 85 Q160 65 200 65 Q240 65 240 85" stroke={ink} strokeWidth="4" fill="none" />
      {/* Body */}
      <rect x="90"  y="85"  width="220" height="130" rx="10" fill={ink} {...FILL} opacity="0.18" />
      <rect x="90"  y="85"  width="220" height="130" rx="10" stroke={ink} strokeWidth="3" fill="none" />
      {/* Clasp */}
      <rect x="180" y="140" width="40" height="16" rx="3" fill={ink} opacity="0.4" />
      {/* Divider */}
      <line x1="90"  y1="130" x2="310" y2="130" stroke={ink} strokeWidth="1.5" opacity="0.3" />
    </g>
  )
}

function ChatBubbles({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" fill="none">
      {/* Back bubble */}
      <path d="M80 70 L260 70 Q280 70 280 90 L280 150 Q280 170 260 170 L150 170 L120 200 L120 170 L100 170 Q80 170 80 150 Z"
            fill={ink} {...FILL} opacity="0.18" />
      {/* Front bubble */}
      <path d="M160 110 L340 110 Q360 110 360 130 L360 180 Q360 200 340 200 L260 200 L240 225 L240 200 L180 200 Q160 200 160 180 Z"
            fill="#fff" opacity="0.85" />
      <path d="M160 110 L340 110 Q360 110 360 130 L360 180 Q360 200 340 200 L260 200 L240 225 L240 200 L180 200 Q160 200 160 180 Z"
            stroke={ink} strokeWidth="3" fill="none" />
      {/* Dots inside front bubble */}
      {[220, 250, 280, 310].map(x => (
        <circle key={x} cx={x} cy="155" r="4" fill={ink} opacity="0.5" />
      ))}
    </g>
  )
}

function Package({ ink }: { ink: string }) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round" fill="none">
      <path d="M200 70 L310 110 L310 190 L200 230 L90 190 L90 110 Z" fill={ink} {...FILL} opacity="0.18" />
      <path d="M200 70 L310 110 L200 150 L90 110 Z" fill={ink} opacity="0.25" />
      <line x1="200" y1="150" x2="200" y2="230" stroke={ink} strokeWidth="2" opacity="0.35" />
      <line x1="90"  y1="110" x2="200" y2="150" stroke={ink} strokeWidth="2" opacity="0.35" />
      <line x1="310" y1="110" x2="200" y2="150" stroke={ink} strokeWidth="2" opacity="0.35" />
    </g>
  )
}
