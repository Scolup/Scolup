import { cn } from "@/lib/utils"
import type { JoseMood } from "@/features/shop/vaultLines"

// Fixed colours (not theme tokens): the primary colour flips between light and
// dark mode, and José has to stay a ruby-red padlock on both.
const BODY = "#e11d48"
const METAL = "#94a3b8"
const INK = "#4c0519"
const EYES = [
  { x: 76, side: "l" },
  { x: 124, side: "r" },
]
const SPARKS = [
  { x: 34, y: 62, delay: "0s" },
  { x: 168, y: 50, delay: "0.12s" },
  { x: 26, y: 122, delay: "0.24s" },
  { x: 176, y: 112, delay: "0.06s" },
]
const SPARK_PATH =
  "M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z"

// José, keeper of the vault: a padlock with a face. Touching him is the
// "validate" button: the mood (data-mood) drives his face and pose in
// index.css. The svg is re-keyed with `tick` so a repeated mood plays its
// one-shot animation again.
export function Jose({
  mood,
  tick,
  busy,
  onTouch,
  className,
}: {
  mood: JoseMood
  tick: number
  busy: boolean
  onTouch: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onTouch}
      aria-busy={busy}
      aria-label="José, gardien du coffre. Touche-le pour valider ton code, ou pour demander un indice si le champ est vide."
      className={cn(
        "mx-auto block size-44 press rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        className
      )}
    >
      <svg
        key={tick}
        viewBox="0 0 200 210"
        data-mood={mood}
        aria-hidden="true"
        className="jose size-full overflow-visible"
      >
        <g className="jose-body">
          <g className="jose-head">
            <path
              d="M72 100 V70 A28 28 0 0 1 128 70 V100"
              stroke={METAL}
              strokeWidth="14"
              fill="none"
            />
            <rect x="40" y="92" width="120" height="98" rx="30" fill={BODY} />

            {EYES.map(({ x, side }) => (
              <g key={side} className={`jose-eye-${side}`}>
                <g className="jose-eye-open">
                  <circle cx={x} cy="132" r="12" fill="#fff" />
                  <circle
                    cx={x}
                    cy="132"
                    r="6"
                    fill={INK}
                    className="jose-pupil"
                  />
                </g>
                <path
                  d={`M${x - 11} 135 Q${x} 121 ${x + 11} 135`}
                  stroke={INK}
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  className="jose-eye-happy"
                />
                <rect
                  x={x - 13}
                  y="118"
                  width="26"
                  height="28"
                  rx="13"
                  fill={BODY}
                  className="jose-lid"
                />
              </g>
            ))}

            <path
              d="M88 164 Q100 170 112 164"
              stroke={INK}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-idle"
            />
            <path
              d="M84 160 Q100 184 116 160 Z"
              fill={INK}
              stroke={INK}
              strokeWidth="4"
              strokeLinejoin="round"
              className="jose-mouth-happy"
            />
            <ellipse
              cx="100"
              cy="166"
              rx="6"
              ry="7"
              fill={INK}
              className="jose-mouth-o"
            />
            <path
              d="M88 172 Q100 160 112 172"
              stroke={INK}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-nope"
            />
            <path
              d="M88 167 Q102 170 113 161"
              stroke={INK}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-near"
            />
          </g>

          <circle
            cx="24"
            cy="164"
            r="10"
            fill={METAL}
            className="jose-hand-l"
          />
          <circle
            cx="176"
            cy="164"
            r="10"
            fill={METAL}
            className="jose-hand-r"
          />
        </g>

        {SPARKS.map((spark) => (
          <g key={spark.x} transform={`translate(${spark.x} ${spark.y})`}>
            <path
              d={SPARK_PATH}
              fill="#fbbf24"
              className="jose-spark"
              style={{ animationDelay: spark.delay }}
            />
          </g>
        ))}
      </svg>
    </button>
  )
}
