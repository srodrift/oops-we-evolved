export function NovaSpark() {
  return (
    <svg viewBox="0 0 300 400" className="h-full w-full" role="img" aria-label="NOVA, Spark form">
      <defs>
        <linearGradient id="sparkFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="42%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="sparkShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
        <radialGradient id="sparkAura" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="210" rx="120" ry="130" fill="url(#sparkAura)" />
      <ellipse cx="150" cy="368" rx="72" ry="12" fill="#1e1033" opacity="0.45" />
      <path d="M108 268 C58 250 36 300 72 334 C96 312 104 286 124 274 Z" fill="url(#sparkShade)" />
      <path d="M86 318 L74 300 L92 312 L80 292 L102 318 Z" fill="#fde68a" />
      <path d="M118 292 C104 330 108 358 132 364 C148 354 146 324 140 292 Z" fill="url(#sparkFur)" />
      <path d="M176 290 C188 328 196 356 176 366 C158 356 160 324 166 292 Z" fill="url(#sparkShade)" />
      <path d="M150 176 C104 188 92 236 108 300 L148 312 C156 286 170 286 180 312 L202 300 C222 236 208 186 168 176 Q150 166 150 176 Z" fill="url(#sparkFur)" />
      <ellipse cx="156" cy="262" rx="38" ry="46" fill="#f5f3ff" />
      <path d="M112 214 C74 236 68 286 98 300 C112 276 118 244 132 214 Z" fill="url(#sparkShade)" />
      <path d="M196 198 C236 168 258 128 236 112 C214 132 206 174 184 198 Z" fill="url(#sparkFur)" />
      <ellipse cx="232" cy="112" rx="14" ry="12" fill="#f5f3ff" />
      <ellipse cx="154" cy="148" rx="64" ry="58" fill="url(#sparkFur)" />
      <path d="M112 124 C92 52 62 64 104 132 Z" fill="#6d28d9" />
      <path d="M198 122 C222 48 252 66 206 132 Z" fill="#6d28d9" />
      <path d="M118 122 C108 78 128 70 136 118 Z" fill="#f5d0fe" />
      <path d="M190 120 C202 74 182 68 174 116 Z" fill="#f5d0fe" />
      <path d="M146 86 L154 52 L162 86 L176 70 L160 98 L150 78 L140 98 L124 70 Z" fill="#fde68a" />
      <ellipse cx="130" cy="146" rx="18" ry="22" fill="#fff" />
      <ellipse cx="182" cy="146" rx="18" ry="22" fill="#fff" />
      <ellipse cx="134" cy="150" rx="8" ry="10" fill="#2e1065" />
      <ellipse cx="186" cy="150" rx="8" ry="10" fill="#2e1065" />
      <circle cx="137" cy="146" r="3" fill="#fff" />
      <circle cx="189" cy="146" r="3" fill="#fff" />
      <path d="M118 138 Q128 132 140 138" fill="none" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
      <path d="M170 138 Q182 132 194 138" fill="none" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
      <path d="M136 176 Q156 190 176 176" fill="none" stroke="#5b21b6" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="108" cy="166" rx="10" ry="6" fill="#d8b4fe" opacity="0.7" />
      <ellipse cx="202" cy="166" rx="10" ry="6" fill="#d8b4fe" opacity="0.7" />
    </svg>
  );
}

export function NovaPulse() {
  return (
    <svg viewBox="0 0 300 400" className="h-full w-full" role="img" aria-label="NOVA, Pulse form">
      <defs>
        <linearGradient id="pulseFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8ff" />
          <stop offset="40%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id="pulseWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <radialGradient id="pulseAura" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="35%" stopColor="#f0abfc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="200" rx="140" ry="140" fill="url(#pulseAura)" />
      <ellipse cx="150" cy="368" rx="78" ry="12" fill="#1e1033" opacity="0.4" />
      <path d="M96 196 C18 120 8 230 86 248 C48 210 58 170 96 196 Z" fill="url(#pulseWing)" />
      <path d="M204 196 C282 120 292 230 214 248 C252 210 242 170 204 196 Z" fill="url(#pulseWing)" />
      <path d="M118 286 C104 328 110 356 134 364 C150 352 146 322 140 286 Z" fill="url(#pulseFur)" />
      <path d="M176 286 C190 328 184 356 162 364 C146 352 150 322 158 286 Z" fill="#6b21a8" />
      <path d="M150 168 C102 180 90 232 108 300 L150 314 L192 300 C210 232 198 180 150 168 Z" fill="url(#pulseFur)" />
      <path d="M150 214 L162 236 L188 240 L168 256 L174 282 L150 268 L126 282 L132 256 L112 240 L138 236 Z" fill="#fef08a" />
      <path d="M108 200 C62 168 48 210 92 228 C78 200 90 186 108 200 Z" fill="#c026d3" />
      <path d="M192 200 C238 168 252 210 208 228 C222 200 210 186 192 200 Z" fill="#c026d3" />
      <ellipse cx="154" cy="140" rx="62" ry="56" fill="url(#pulseFur)" />
      <path d="M108 112 C78 28 48 48 102 124 Z" fill="#6d28d9" />
      <path d="M200 112 C230 28 260 48 198 124 Z" fill="#6d28d9" />
      <path d="M116 112 C102 58 128 46 138 112 Z" fill="#fef08a" />
      <path d="M192 112 C206 58 180 46 170 112 Z" fill="#fef08a" />
      <path d="M150 36 L160 68 L190 56 L166 84 L198 96 L162 104 L168 132 L150 112 L132 132 L138 104 L102 96 L134 84 L110 56 L140 68 Z" fill="#fef9c3" />
      <ellipse cx="130" cy="138" rx="16" ry="18" fill="#fff" />
      <ellipse cx="180" cy="138" rx="16" ry="18" fill="#fff" />
      <ellipse cx="132" cy="140" rx="7" ry="9" fill="#3b0764" />
      <ellipse cx="182" cy="140" rx="7" ry="9" fill="#3b0764" />
      <circle cx="135" cy="136" r="3" fill="#fff" />
      <circle cx="185" cy="136" r="3" fill="#fff" />
      <path d="M128 166 Q154 184 180 166" fill="none" stroke="#6b21a8" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function GlitchFox() {
  return (
    <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="GLITCH, fox detective">
      <defs>
        <linearGradient id="foxFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="foxCoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b21a8" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
      </defs>
      <ellipse cx="168" cy="372" rx="78" ry="12" fill="#1e1033" opacity="0.4" />
      <path d="M96 250 C28 210 18 280 62 328 C40 300 48 250 92 268 C78 300 70 330 108 336 C96 300 100 270 96 250 Z" fill="#fb923c" />
      <ellipse cx="70" cy="318" rx="22" ry="16" fill="#ffedd5" />
      <path d="M132 300 C120 340 128 366 150 372 C166 360 162 332 156 300 Z" fill="url(#foxFur)" />
      <path d="M188 298 C200 338 214 364 192 372 C174 360 176 330 180 298 Z" fill="#c2410c" />
      <path d="M118 168 L104 312 L156 324 L168 230 L196 324 L236 308 L214 164 Z" fill="url(#foxCoat)" />
      <path d="M150 176 L168 300 L186 176 Z" fill="#fff7ed" />
      <path d="M124 190 C96 230 100 270 128 262 C118 230 122 206 140 188 Z" fill="#7c3aed" />
      <path d="M206 176 C248 150 262 118 236 108 C220 132 214 160 196 176 Z" fill="url(#foxFur)" />
      <ellipse cx="176" cy="132" rx="58" ry="52" fill="url(#foxFur)" />
      <path d="M136 112 C112 36 78 52 122 124 Z" fill="#ea580c" />
      <path d="M214 108 C242 28 278 52 222 122 Z" fill="#ea580c" />
      <path d="M140 112 C128 64 156 56 160 112 Z" fill="#ffedd5" />
      <path d="M208 108 C222 58 196 52 190 108 Z" fill="#ffedd5" />
      <ellipse cx="186" cy="156" rx="34" ry="24" fill="#fff7ed" />
      <ellipse cx="204" cy="154" rx="8" ry="6" fill="#431407" />
      <ellipse cx="154" cy="128" rx="12" ry="14" fill="#fff" />
      <ellipse cx="196" cy="120" rx="11" ry="13" fill="#fff" />
      <circle cx="156" cy="130" r="6" fill="#431407" />
      <circle cx="198" cy="122" r="5" fill="#431407" />
      <circle cx="236" cy="100" r="26" fill="#ecfeff" stroke="#1e1b4b" strokeWidth="6" />
      <circle cx="236" cy="100" r="10" fill="#67e8f9" opacity="0.65" />
      <path d="M214 118 L206 168" stroke="#1e1b4b" strokeWidth="6" strokeLinecap="round" />
      <path d="M168 168 L188 188" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function MorphCreature() {
  return (
    <svg viewBox="0 0 300 400" className="morph-svg h-full w-full" role="img" aria-label="MORPH, shapeshifter">
      <defs>
        <linearGradient id="morphCloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="morphTeal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="morphGold" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="368" rx="70" ry="12" fill="#020617" opacity="0.45" />
      <path d="M92 150 C48 210 56 330 120 360 L150 300 L186 360 C246 320 250 200 206 146 Z" fill="url(#morphCloak)" />
      <path d="M118 168 C96 210 100 280 132 300 L150 250 L118 168 Z" fill="#4c1d95" />
      <path className="shard shard-a" d="M168 160 L214 120 L236 188 L190 210 Z" fill="url(#morphTeal)" />
      <path className="shard shard-b" d="M196 188 L250 176 L236 236 L188 220 Z" fill="url(#morphGold)" />
      <path className="shard shard-c" d="M150 210 L186 198 L176 248 L142 236 Z" fill="#c4b5fd" />
      <path d="M128 96 C96 120 100 180 140 196 C168 176 176 120 150 96 C142 120 124 140 128 96 Z" fill="#1e1b4b" />
      <path d="M156 108 L196 86 L186 140 L150 132 Z" fill="url(#morphTeal)" />
      <path d="M132 132 Q146 150 162 130" fill="none" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
      <circle cx="144" cy="128" r="4" fill="#fef08a" />
      <path d="M214 112 L236 92 L228 128 Z" fill="#fde68a" />
    </svg>
  );
}

export function AtlasGuardian() {
  return (
    <svg viewBox="0 0 300 420" className="h-full w-full" role="img" aria-label="ATLAS, emerald guardian">
      <defs>
        <linearGradient id="atlasPlate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="45%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="atlasGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="55%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="392" rx="72" ry="12" fill="#022c22" opacity="0.5" />
      <path d="M78 150 C36 210 40 340 96 390 L150 320 L210 392 C262 330 258 200 214 146 Z" fill="#022c22" />
      <path d="M112 250 L96 360 L132 368 L140 250 Z" fill="url(#atlasPlate)" />
      <path d="M188 250 L204 360 L168 368 L160 250 Z" fill="#047857" />
      <path d="M108 352 H136 L132 378 H112 Z" fill="url(#atlasGold)" />
      <path d="M164 352 H192 L188 378 H168 Z" fill="url(#atlasGold)" />
      <path d="M104 150 H196 L214 268 H86 Z" fill="url(#atlasPlate)" />
      <path d="M128 176 H172 L164 220 H136 Z" fill="url(#atlasGold)" />
      <path d="M150 188 L156 204 L174 206 L160 216 L164 234 L150 224 L136 234 L140 216 L126 206 L144 204 Z" fill="#022c22" />
      <path d="M86 168 L52 250 L96 236 Z" fill="url(#atlasPlate)" />
      <path d="M214 150 L262 96 L236 168 Z" fill="url(#atlasGold)" />
      <path d="M96 118 H204 L220 168 H80 Z" fill="url(#atlasPlate)" />
      <path d="M118 132 H182 L174 158 H126 Z" fill="#042f2e" />
      <path d="M132 146 H168" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round" />
      <path d="M150 78 L168 118 H132 Z" fill="url(#atlasGold)" />
      <path d="M92 150 H208" stroke="url(#atlasGold)" strokeWidth="8" />
      <path d="M70 228 L96 214 L92 248 Z" fill="url(#atlasGold)" />
    </svg>
  );
}
