import { cn } from "@/lib/utils"
import type { JoseMood } from "@/features/shop/vaultLines"

const SKIN = "#f6d7b6"
const INK = "#3b2417"
const MOUTH = "#7f1d1d"
const SPARKS = [
  { x: 34, y: 62, delay: "0s" },
  { x: 168, y: 50, delay: "0.12s" },
  { x: 26, y: 122, delay: "0.24s" },
  { x: 176, y: 112, delay: "0.06s" },
]
const SPARK_PATH =
  "M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z"

// José, keeper of the vault. Touching him is the "validate" button: the mood
// (data-mood) drives his face and pose in index.css. The svg is re-keyed with
// `tick` so a repeated mood plays its one-shot animation again.
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
        <ellipse
          cx="100"
          cy="201"
          rx="52"
          ry="6"
          className="fill-foreground/10"
        />

        <g className="jose-body">
          <path
            d="M40 202 C40 152 62 122 100 122 C138 122 160 152 160 202 Z"
            className="fill-primary"
          />
          <path d="M100 150 L110 158 L100 177 L90 158 Z" fill="#e11d48" />
          <path d="M90 158 L100 150 L110 158 Z" fill="#fb7185" />

          <g className="jose-head">
            <circle cx="55" cy="96" r="9" fill={SKIN} />
            <circle cx="145" cy="96" r="9" fill={SKIN} />
            <circle cx="100" cy="90" r="46" fill={SKIN} />
            <circle cx="72" cy="108" r="7" fill="#f9a8a8" opacity="0.5" />
            <circle cx="128" cy="108" r="7" fill="#f9a8a8" opacity="0.5" />

            <g transform="translate(0 -9)">
              <path
                d="M54 76 C52 36 148 36 146 76 C130 66 70 66 54 76 Z"
                fill="#9f1239"
              />
              <rect
                x="50"
                y="72"
                width="100"
                height="8"
                rx="4"
                fill="#881337"
              />
              <circle cx="100" cy="40" r="5" fill="#9f1239" />
            </g>

            {[82, 118].map((x) => (
              <g key={x}>
                <g className="jose-eye-open">
                  <circle cx={x} cy="93" r="9" fill="#fff" />
                  <circle
                    cx={x}
                    cy="93"
                    r="4.5"
                    fill={INK}
                    className="jose-pupil"
                  />
                </g>
                <path
                  d={`M${x - 9} 95 Q${x} 83 ${x + 9} 95`}
                  stroke={INK}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  className="jose-eye-happy"
                />
                <rect
                  x={x - 10}
                  y="83"
                  width="20"
                  height="20"
                  rx="10"
                  fill={SKIN}
                  className="jose-lid"
                />
              </g>
            ))}
            <path
              d="M71 77 Q82 72 93 76"
              stroke={INK}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              className="jose-brow jose-brow-l"
            />
            <path
              d="M107 76 Q118 72 129 77"
              stroke={INK}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              className="jose-brow jose-brow-r"
            />

            <ellipse cx="100" cy="104" rx="6" ry="5" fill="#eab58a" />

            <path
              d="M91 126 Q100 130 109 126"
              stroke={MOUTH}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-idle"
            />
            <path
              d="M87 122 Q100 148 113 122 Z"
              fill={MOUTH}
              className="jose-mouth-happy"
            />
            <ellipse
              cx="100"
              cy="127"
              rx="4.5"
              ry="5.5"
              fill={MOUTH}
              className="jose-mouth-o"
            />
            <path
              d="M91 132 Q100 122 109 132"
              stroke={MOUTH}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-nope"
            />
            <path
              d="M91 128 Q101 130 110 122"
              stroke={MOUTH}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="jose-mouth-near"
            />

            <path
              d="M70 111 C78 98 94 102 100 111 C106 102 122 98 130 111 C122 123 106 115 100 115 C94 115 78 123 70 111 Z"
              fill={INK}
            />
          </g>

          <circle cx="58" cy="178" r="9" fill={SKIN} className="jose-hand-l" />
          <circle cx="142" cy="178" r="9" fill={SKIN} className="jose-hand-r" />
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
