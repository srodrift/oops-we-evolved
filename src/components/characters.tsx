export function NovaSpark() {
  return (
    <svg viewBox="0 0 280 340" className="h-full w-full" role="img" aria-label="NOVA, Spark form">
      <defs>
        <radialGradient id="sparkGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#f0abff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sparkBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="35%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="sparkBelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7ff" />
          <stop offset="100%" stopColor="#e9d5ff" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="176" rx="108" ry="112" fill="url(#sparkGlow)" />
      <path d="M78 132 C70 70 108 58 124 108" fill="#7c3aed" />
      <path d="M202 132 C210 70 172 58 156 108" fill="#7c3aed" />
      <path d="M96 118 C92 86 112 78 122 108" fill="#f5d0fe" />
      <path d="M184 118 C188 86 168 78 158 108" fill="#f5d0fe" />
      <path d="M132 78 L140 42 L148 78 L158 58 L146 92 L164 86 L140 118 L116 86 L134 92 L122 58 Z" fill="#fef08a" />
      <ellipse cx="140" cy="186" rx="78" ry="90" fill="url(#sparkBody)" />
      <ellipse cx="140" cy="214" rx="46" ry="52" fill="url(#sparkBelly)" />
      <ellipse cx="108" cy="176" rx="22" ry="26" fill="#fff" />
      <ellipse cx="172" cy="176" rx="22" ry="26" fill="#fff" />
      <ellipse cx="112" cy="180" rx="10" ry="12" fill="#3b0764" />
      <ellipse cx="176" cy="180" rx="10" ry="12" fill="#3b0764" />
      <circle cx="116" cy="174" r="4" fill="#fff" />
      <circle cx="180" cy="174" r="4" fill="#fff" />
      <path d="M122 214 Q140 228 158 214" fill="none" stroke="#6b21a8" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="86" cy="206" rx="12" ry="8" fill="#f0abfc" opacity="0.85" />
      <ellipse cx="194" cy="206" rx="12" ry="8" fill="#f0abfc" opacity="0.85" />
      <path d="M70 196 C48 188 46 214 72 220" fill="#a855f7" />
      <path d="M210 196 C232 188 234 214 208 220" fill="#a855f7" />
      <ellipse cx="112" cy="286" rx="18" ry="10" fill="#5b21b6" />
      <ellipse cx="168" cy="286" rx="18" ry="10" fill="#5b21b6" />
      <path d="M214 150 L236 132 L222 158 Z" fill="#fef9c3" />
      <path d="M46 164 L24 146 L40 172 Z" fill="#fef9c3" />
    </svg>
  );
}

export function NovaPulse() {
  return (
    <svg viewBox="0 0 280 340" className="h-full w-full" role="img" aria-label="NOVA, Pulse form">
      <defs>
        <radialGradient id="pulseGlow" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="28%" stopColor="#f0abfc" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pulseBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8ff" />
          <stop offset="40%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="pulseWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="176" rx="126" ry="124" fill="url(#pulseGlow)" />
      <path d="M78 168 C18 120 8 196 70 214 C40 188 48 156 78 168" fill="url(#pulseWing)" />
      <path d="M202 168 C262 120 272 196 210 214 C240 188 232 156 202 168" fill="url(#pulseWing)" />
      <path d="M92 128 C78 36 124 48 132 112" fill="#6d28d9" />
      <path d="M188 128 C202 36 156 48 148 112" fill="#6d28d9" />
      <path d="M108 112 C104 62 128 54 134 108" fill="#fef08a" />
      <path d="M172 112 C176 62 152 54 146 108" fill="#fef08a" />
      <path d="M140 28 L150 62 L176 48 L154 78 L186 86 L150 96 L158 124 L140 104 L122 124 L130 96 L94 86 L126 78 L104 48 L130 62 Z" fill="#fef9c3" />
      <ellipse cx="140" cy="186" rx="80" ry="92" fill="url(#pulseBody)" />
      <ellipse cx="140" cy="210" rx="44" ry="48" fill="#fae8ff" />
      <path d="M140 176 L150 198 L174 202 L156 218 L162 242 L140 228 L118 242 L124 218 L106 202 L130 198 Z" fill="#fef08a" />
      <ellipse cx="108" cy="168" rx="22" ry="24" fill="#fff" />
      <ellipse cx="172" cy="168" rx="22" ry="24" fill="#fff" />
      <ellipse cx="112" cy="170" rx="10" ry="12" fill="#3b0764" />
      <ellipse cx="176" cy="170" rx="10" ry="12" fill="#3b0764" />
      <circle cx="116" cy="164" r="4" fill="#fff" />
      <circle cx="180" cy="164" r="4" fill="#fff" />
      <path d="M118 206 Q140 226 162 206" fill="none" stroke="#6b21a8" strokeWidth="5" strokeLinecap="round" />
      <path d="M64 188 C36 176 34 210 68 214" fill="#c026d3" />
      <path d="M216 188 C244 176 246 210 212 214" fill="#c026d3" />
      <ellipse cx="112" cy="292" rx="20" ry="11" fill="#4c1d95" />
      <ellipse cx="172" cy="292" rx="20" ry="11" fill="#4c1d95" />
      <path d="M228 124 L258 96 L236 138 Z" fill="#fff" />
      <path d="M52 124 L22 96 L44 138 Z" fill="#fff" />
    </svg>
  );
}

export function GlitchFox() {
  return (
    <svg viewBox="0 0 280 320" className="h-full w-full" role="img" aria-label="GLITCH, fox detective">
      <defs>
        <linearGradient id="foxFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb020" />
          <stop offset="55%" stopColor="#ff7a18" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M48 210 C20 160 36 120 78 138 C58 168 52 196 70 214 Z" fill="#fb923c" />
      <path d="M62 196 C40 188 38 210 66 208" fill="#ffedd5" />
      <ellipse cx="158" cy="196" rx="78" ry="62" fill="url(#foxFur)" />
      <path d="M96 168 C70 40 150 36 168 150" fill="#ea580c" />
      <path d="M118 150 C110 78 148 70 156 142" fill="#ffedd5" />
      <path d="M188 150 C214 48 250 70 214 156" fill="#ea580c" />
      <path d="M196 142 C210 86 236 96 214 150" fill="#ffedd5" />
      <ellipse cx="176" cy="168" rx="58" ry="50" fill="url(#foxFur)" />
      <ellipse cx="186" cy="186" rx="34" ry="26" fill="#fff7ed" />
      <ellipse cx="206" cy="188" rx="8" ry="6" fill="#431407" />
      <ellipse cx="158" cy="162" rx="12" ry="14" fill="#fff" />
      <ellipse cx="196" cy="156" rx="12" ry="14" fill="#fff" />
      <circle cx="160" cy="164" r="6" fill="#431407" />
      <circle cx="198" cy="158" r="6" fill="#431407" />
      <circle cx="162" cy="161" r="2" fill="#fff" />
      <circle cx="200" cy="155" r="2" fill="#fff" />
      <path d="M96 150 L70 118 L108 132 Z" fill="#7c2d12" />
      <path d="M214 92 L248 70 L230 118" fill="none" stroke="#7c2d12" strokeWidth="8" strokeLinecap="round" />
      <circle cx="214" cy="92" r="22" fill="#ecfeff" stroke="#0f172a" strokeWidth="6" />
      <circle cx="214" cy="92" r="8" fill="#67e8f9" opacity="0.7" />
      <path d="M118 214 C100 250 150 268 168 236" fill="#9a3412" />
      <ellipse cx="126" cy="258" rx="16" ry="9" fill="#9a3412" />
      <ellipse cx="176" cy="258" rx="16" ry="9" fill="#9a3412" />
    </svg>
  );
}

export function MorphCreature() {
  return (
    <svg viewBox="0 0 260 320" className="morph-svg h-full w-full" role="img" aria-label="MORPH, shapeshifter">
      <defs>
        <linearGradient id="shardA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="shardB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="shardC" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path className="shard shard-a" d="M70 90 C40 140 60 210 110 230 C70 180 60 120 70 90" fill="url(#shardA)" />
      <path className="shard shard-b" d="M180 70 C230 110 220 200 160 240 C210 170 210 110 180 70" fill="url(#shardB)" />
      <path className="shard shard-c" d="M90 200 C70 250 130 290 170 250 C130 280 80 240 90 200" fill="url(#shardC)" />
      <path d="M128 78 C90 110 86 190 130 236 C176 190 184 110 140 78 C148 120 120 150 128 78" fill="#1e1b4b" />
      <path d="M118 150 Q132 168 150 146" fill="none" stroke="#fef3c7" strokeWidth="6" strokeLinecap="round" />
      <circle cx="132" cy="146" r="5" fill="#fef08a" />
      <path d="M96 120 C70 100 78 70 108 92" fill="#2dd4bf" opacity="0.85" />
      <path d="M168 214 C210 230 196 270 154 250" fill="#a78bfa" />
      <path d="M150 96 C170 60 210 80 184 112" fill="#fb7185" opacity="0.9" />
    </svg>
  );
}

export function AtlasGuardian() {
  return (
    <svg viewBox="0 0 280 330" className="h-full w-full" role="img" aria-label="ATLAS, emerald guardian">
      <defs>
        <linearGradient id="atlasPlate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="55%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="atlasGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path d="M70 120 C40 180 46 270 90 300 L140 250 L190 300 C234 270 240 180 210 120 Z" fill="#022c22" />
      <path d="M108 168 L92 250 L124 236 Z" fill="url(#atlasPlate)" />
      <path d="M172 168 L188 250 L156 236 Z" fill="url(#atlasPlate)" />
      <path d="M96 150 L78 210 L112 196 Z" fill="url(#atlasGold)" />
      <path d="M184 150 L202 210 L168 196 Z" fill="url(#atlasGold)" />
      <path d="M104 132 H176 L190 230 H90 Z" fill="url(#atlasPlate)" />
      <path d="M118 156 H162 L156 196 H124 Z" fill="url(#atlasGold)" />
      <path d="M140 164 L146 180 L164 182 L150 194 L154 212 L140 202 L126 212 L130 194 L116 182 L134 180 Z" fill="#022c22" />
      <path d="M100 78 H180 L196 132 H84 Z" fill="url(#atlasPlate)" />
      <path d="M112 96 H168 L160 124 H120 Z" fill="#042f2e" />
      <path d="M124 108 H156" stroke="#f5c542" strokeWidth="6" strokeLinecap="round" />
      <path d="M140 46 L156 78 H124 Z" fill="url(#atlasGold)" />
      <circle cx="128" cy="112" r="4" fill="#bbf7d0" />
      <circle cx="152" cy="112" r="4" fill="#bbf7d0" />
      <path d="M90 132 H190" stroke="url(#atlasGold)" strokeWidth="8" />
    </svg>
  );
}
