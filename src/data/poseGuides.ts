export interface PoseGuide {
  id: string
  name: string
  category: "couples" | "besties" | "solo" | "dynamic"
  tip: string
  description: string
  // Dynamic step index for 4-shot burst (1-4), if applicable
  burstStep?: number
  // SVG viewBox and render function or vector paths
  viewBox: string
  // SVG elements as structured path string
  svgContent: string
}

export const POSE_GUIDES: PoseGuide[] = [
  // --- Dynamic 4-Cut Sequence (Auto-advances) ---
  {
    id: "dyn-shot-1",
    name: "Shot 1: Sweet Smile",
    category: "dynamic",
    burstStep: 1,
    tip: "Look straight into camera, gentle natural smile",
    description: "Classic relaxed photobooth starter portrait",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head & Shoulders Silhouette -->
      <path d="M100 40 C75 40 60 60 60 90 C60 120 75 140 100 140 C125 140 140 120 140 90 C140 60 125 40 100 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Eyeline & Smile hints -->
      <path d="M85 85 Q90 82 95 85 M105 85 Q110 82 115 85" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M90 108 Q100 118 110 108" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Shoulders -->
      <path d="M40 210 C45 165 70 150 100 150 C130 150 155 165 160 210" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Sparkle -->
      <path d="M145 60 L148 68 L156 71 L148 74 L145 82 L142 74 L134 71 L142 68 Z" fill="currentColor" opacity="0.75" />
    `,
  },
  {
    id: "dyn-shot-2",
    name: "Shot 2: Cheek Peace",
    category: "dynamic",
    burstStep: 2,
    tip: "Tilt head slightly, V-sign right next to your cheek",
    description: "Cute playful peace sign photobooth standard",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head tilted -->
      <path d="M96 42 C72 44 58 64 60 94 C62 124 78 142 102 140 C126 138 138 118 136 88 C134 58 120 40 96 42 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Wink Eye + Smile -->
      <path d="M82 88 L92 88 M105 86 Q110 83 115 86" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <path d="M88 110 Q98 120 108 110" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Peace Hand next to cheek -->
      <g transform="translate(125, 75) rotate(15)">
        <path d="M10 40 C5 35 5 25 10 20 L15 5 C16 1 20 1 21 5 L23 18 L28 4 C29 0 33 0 34 4 L33 22 C37 22 41 26 40 32 C38 42 25 48 10 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" />
      </g>
      <!-- Shoulders -->
      <path d="M38 210 C44 165 68 150 98 150 C128 150 152 165 158 210" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "dyn-shot-3",
    name: "Shot 3: Cheek Heart",
    category: "dynamic",
    burstStep: 3,
    tip: "Curve your hand against your cheek to form half-heart",
    description: "K-Idol signature cheek-heart silhouette",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head -->
      <path d="M95 42 C70 42 56 62 56 92 C56 122 72 142 97 142 C122 142 136 122 136 92 C136 62 120 42 95 42 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Smile & Cute Eyes -->
      <path d="M78 86 Q84 82 90 86 M102 86 Q108 82 114 86" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M85 110 Q96 122 107 110" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Cheek Heart Hand Shape -->
      <path d="M56 92 C45 78 30 82 28 98 C26 112 40 125 58 135 C58 120 56 105 56 92 Z" fill="none" stroke="currentColor" stroke-width="2.5" />
      <path d="M38 74 Q42 66 50 68 Q58 70 54 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" />
      <!-- Shoulders -->
      <path d="M36 210 C42 165 66 150 96 150 C126 150 150 165 156 210" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Little heart float -->
      <path d="M138 68 C135 62 128 62 126 67 C124 62 117 62 114 67 C112 73 126 84 126 84 C126 84 140 73 138 68 Z" fill="currentColor" opacity="0.8" />
    `,
  },
  {
    id: "dyn-shot-4",
    name: "Shot 4: Goofy Fun Wink",
    category: "dynamic",
    burstStep: 4,
    tip: "Stick tongue out slightly or big laughing wink!",
    description: "Finishing high-energy goofy cut",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head -->
      <path d="M100 40 C75 40 60 60 60 90 C60 120 75 140 100 140 C125 140 140 120 140 90 C140 60 125 40 100 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
      <!-- Big Wink & Tongue -->
      <path d="M78 88 L90 88 M105 84 C112 80 118 88 110 92" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Open Laugh Mouth -->
      <path d="M84 108 Q100 128 116 108 Z" fill="none" stroke="currentColor" stroke-width="2.5" />
      <path d="M94 116 C94 126 106 126 106 116 Z" fill="currentColor" opacity="0.65" />
      <!-- Double Hand Paws on cheeks -->
      <g transform="translate(42, 100)">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <g transform="translate(142, 100)">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <!-- Shoulders -->
      <path d="M40 210 C45 165 70 150 100 150 C130 150 155 165 160 210" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },

  // --- Couple Poses ---
  {
    id: "couple-cheek-heart",
    name: "Duo Cheek Heart",
    category: "couples",
    tip: "Stand cheek-to-cheek, each make half a heart on outside cheeks",
    description: "Trending Korean couple Life4Cuts pose",
    viewBox: "0 0 240 200",
    svgContent: `
      <!-- Left Person -->
      <path d="M75 45 C55 45 45 60 45 85 C45 110 55 125 75 125 C95 125 105 110 105 85 C105 60 95 45 75 45 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <!-- Right Person -->
      <path d="M165 45 C145 45 135 60 135 85 C135 110 145 125 165 125 C185 125 195 110 195 85 C195 60 185 45 165 45 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <!-- Left Cheek Heart -->
      <path d="M45 85 C35 70 20 75 18 90 C16 105 32 118 48 128" fill="none" stroke="currentColor" stroke-width="2.5" />
      <!-- Right Cheek Heart -->
      <path d="M195 85 C205 70 220 75 222 90 C224 105 208 118 192 128" fill="none" stroke="currentColor" stroke-width="2.5" />
      <!-- Center Shared Big Heart floating -->
      <path d="M120 40 C116 32 106 32 102 38 C98 32 88 32 84 38 C80 46 102 60 102 60 C102 60 124 46 120 40 Z" fill="currentColor" opacity="0.8" transform="translate(18, -10)" />
      <!-- Both Shoulders -->
      <path d="M15 195 C25 150 48 135 75 135 C95 135 110 145 120 160 C130 145 145 135 165 135 C192 135 215 150 225 195" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "couple-forehead",
    name: "Forehead Touch & Whisper",
    category: "couples",
    tip: "Tilt foreheads together in center, eyes closed gently",
    description: "Intimate and cinematic romantic couple shot",
    viewBox: "0 0 240 200",
    svgContent: `
      <!-- Left Profile Tilted -->
      <path d="M85 50 C68 46 54 60 56 84 C58 108 72 126 92 124 C104 123 114 112 116 95" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <!-- Right Profile Tilted touching left -->
      <path d="M155 50 C172 46 186 60 184 84 C182 108 168 126 148 124 C136 123 126 112 124 95" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <!-- Touch Point Sparkle -->
      <path d="M120 70 L122 75 L127 77 L122 79 L120 84 L118 79 L113 77 L118 75 Z" fill="currentColor" opacity="0.9" />
      <!-- Soft Closed Eyelashes -->
      <path d="M88 82 Q92 86 96 82 M144 82 Q148 86 152 82" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <!-- Hug Shoulders -->
      <path d="M25 195 C35 145 60 135 88 135 C110 135 120 148 120 160 C120 148 130 135 152 135 C180 135 205 145 215 195" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "couple-peekaboo",
    name: "Peek From Behind",
    category: "couples",
    tip: "One partner in front, second peeking over shoulder with a smile",
    description: "Cute layered depth couple pose",
    viewBox: "0 0 220 230",
    svgContent: `
      <!-- Back Person Peeking High -->
      <g transform="translate(35, -15)">
        <path d="M110 40 C90 40 80 55 80 75 C80 95 90 108 110 108 C130 108 140 95 140 75 C140 55 130 40 110 40 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
        <path d="M100 70 L108 70 M116 68 Q120 64 124 68" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M102 90 Q110 98 118 90" fill="none" stroke="currentColor" stroke-width="2" />
        <!-- Peeking Hands on Shoulder -->
        <circle cx="68" cy="120" r="7" fill="none" stroke="currentColor" stroke-width="2" />
        <circle cx="152" cy="120" r="7" fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <!-- Front Person Centered -->
      <path d="M110 75 C88 75 75 92 75 118 C75 144 88 160 110 160 C132 160 145 144 145 118 C145 92 132 75 110 75 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <path d="M96 112 Q102 108 108 112 M118 112 Q124 108 130 112" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M100 135 Q110 146 120 135" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Front Shoulders -->
      <path d="M48 220 C54 180 78 168 110 168 C142 168 166 180 172 220" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },

  // --- Besties Poses ---
  {
    id: "besties-back-to-back",
    name: "Back-to-Back Cool",
    category: "besties",
    tip: "Lean backs slightly together, cross arms or flash double peace",
    description: "Classic duo photobooth best friends stance",
    viewBox: "0 0 240 200",
    svgContent: `
      <!-- Left Bestie leaning right -->
      <g transform="translate(10, 0)">
        <path d="M80 40 C60 40 50 56 52 80 C54 104 66 120 86 120 C106 120 114 104 112 80 C110 56 100 40 80 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
        <path d="M68 76 Q74 72 80 76 M88 76 Q94 72 100 76" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M74 98 Q82 106 90 98" fill="none" stroke="currentColor" stroke-width="2" />
        <!-- Sunglasses outline -->
        <rect x="66" y="70" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
        <rect x="86" y="70" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
        <line x1="82" y1="74" x2="86" y2="74" stroke="currentColor" stroke-width="1.8" />
      </g>
      <!-- Right Bestie leaning left touching back -->
      <g transform="translate(-10, 0)">
        <path d="M160 40 C140 40 130 56 128 80 C126 104 138 120 158 120 C178 120 188 104 190 80 C192 56 180 40 160 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
        <path d="M148 76 Q154 72 160 76 M168 76 Q174 72 180 76" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M154 98 Q162 106 170 98" fill="none" stroke="currentColor" stroke-width="2" />
        <!-- Peace Sign Raised -->
        <g transform="translate(192, 38) rotate(15)">
          <path d="M5 25 L8 6 L12 6 L13 15 L17 4 L21 4 L18 20 C22 20 25 24 24 28 C22 34 14 36 5 25 Z" fill="none" stroke="currentColor" stroke-width="2" />
        </g>
      </g>
      <!-- Shoulders touching at center -->
      <path d="M20 195 C30 148 54 135 85 135 C108 135 120 152 120 165 C120 152 132 135 155 135 C186 135 210 148 220 195" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "besties-cat-paws",
    name: "Cat Paws & Ears",
    category: "besties",
    tip: "Raise loose fists like cat paws next to your cheeks!",
    description: "Cute Harajuku / Purikura cat pose",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Cat ears on top of head -->
      <path d="M68 54 L52 24 L82 42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M132 54 L148 24 L118 42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Head -->
      <path d="M100 45 C75 45 60 65 60 95 C60 125 75 145 100 145 C125 145 140 125 140 95 C140 65 125 45 100 45 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <!-- Cute Eyes & Whisker marks -->
      <path d="M80 88 Q88 82 94 88 M106 88 Q112 82 120 88" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M92 110 Q100 120 108 110" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <path d="M48 94 L32 90 M48 100 L30 102 M152 94 L168 90 M152 100 L170 102" fill="none" stroke="currentColor" stroke-width="1.8" />
      <!-- Left & Right Paws (Curled fists) -->
      <g transform="translate(42, 116)">
        <ellipse cx="10" cy="10" rx="9" ry="8" fill="none" stroke="currentColor" stroke-width="2.5" />
        <circle cx="7" cy="5" r="2" fill="currentColor" />
        <circle cx="11" cy="4" r="2" fill="currentColor" />
        <circle cx="15" cy="5" r="2" fill="currentColor" />
      </g>
      <g transform="translate(138, 116)">
        <ellipse cx="10" cy="10" rx="9" ry="8" fill="none" stroke="currentColor" stroke-width="2.5" />
        <circle cx="7" cy="5" r="2" fill="currentColor" />
        <circle cx="11" cy="4" r="2" fill="currentColor" />
        <circle cx="15" cy="5" r="2" fill="currentColor" />
      </g>
      <!-- Shoulders -->
      <path d="M38 215 C44 170 68 155 98 155 C128 155 152 170 158 215" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "besties-frame-fingers",
    name: "Frame Your Face",
    category: "besties",
    tip: "Use thumb and index fingers of both hands to create a photo frame",
    description: "Framing square hands for an artsy selfie cut",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head inside frame -->
      <path d="M100 48 C78 48 65 65 65 92 C65 120 78 138 100 138 C122 138 135 120 135 92 C135 65 122 48 100 48 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
      <!-- Smile -->
      <path d="M85 86 Q90 82 95 86 M105 86 Q110 82 115 86" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M90 108 Q100 118 110 108" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Top-Left Corner Hand Frame -->
      <path d="M45 75 L45 45 L78 45" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
      <!-- Bottom-Right Corner Hand Frame -->
      <path d="M155 115 L155 145 L122 145" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
      <!-- Camera crosshair focus box -->
      <circle cx="100" cy="92" r="3" fill="currentColor" />
      <!-- Shoulders -->
      <path d="M38 215 C44 170 68 155 98 155 C128 155 152 170 158 215" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4" />
    `,
  },

  // --- Solo Poses ---
  {
    id: "solo-chin-rest",
    name: "Thinking Chin Rest",
    category: "solo",
    tip: "Rest chin gently on your palm, head tilted with thoughtful eyes",
    description: "Flattering, elegant solo photobooth angle",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head Tilted slightly -->
      <path d="M102 40 C78 40 64 58 64 88 C64 116 78 134 102 134 C126 134 140 116 140 88 C140 58 126 40 102 40 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <path d="M86 82 Q92 78 98 82 M108 82 Q114 78 120 82" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M92 104 Q102 112 112 104" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Hand resting chin -->
      <path d="M82 130 C82 120 90 122 102 124 C114 122 122 120 122 130 L115 170 C108 178 96 178 89 170 Z" fill="none" stroke="currentColor" stroke-width="2.5" />
      <path d="M96 175 L85 220" fill="none" stroke="currentColor" stroke-width="2.5" />
      <!-- Shoulder outline -->
      <path d="M40 215 C46 168 70 155 102 155 C132 155 156 168 162 215" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "solo-finger-heart",
    name: "Korean Finger Heart",
    category: "solo",
    tip: "Cross thumb and index finger to form the mini K-heart!",
    description: "Iconic K-pop miniature finger heart",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head Centered -->
      <path d="M100 42 C76 42 62 62 62 90 C62 118 76 136 100 136 C124 136 138 118 138 90 C138 62 124 42 100 42 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <path d="M82 86 Q88 82 94 86 M106 86 Q112 82 118 86" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M88 108 Q100 118 112 108" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Finger Heart Hand centered in foreground -->
      <g transform="translate(85, 140)">
        <!-- Thumb and index crossed -->
        <path d="M10 25 C8 15 15 10 20 12 L22 25 M18 11 C23 7 28 10 26 18 L24 25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <!-- Hand fist -->
        <path d="M8 25 C2 28 2 45 10 48 L28 48 C34 45 34 28 28 25 Z" fill="none" stroke="currentColor" stroke-width="2.5" />
        <!-- Glowing tiny heart right above fingers -->
        <path d="M18 4 C16 1 12 1 10 3 C8 1 4 1 2 3 C0 7 10 14 10 14 C10 14 20 7 18 4 Z" fill="currentColor" opacity="0.9" transform="translate(6, -6)" />
      </g>
      <!-- Shoulders -->
      <path d="M38 215 C44 170 68 155 98 155 C128 155 152 170 158 215" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
  {
    id: "solo-over-shoulder",
    name: "Over-the-Shoulder Chic",
    category: "solo",
    tip: "Turn body 45 degrees, look back over shoulder towards lens",
    description: "Chic editorial magazine silhouette",
    viewBox: "0 0 200 240",
    svgContent: `
      <!-- Head turned 45 deg -->
      <path d="M96 46 C74 46 62 64 64 92 C66 118 80 134 102 134 C124 134 136 118 136 92 C136 64 122 46 96 46 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" />
      <path d="M82 86 Q88 82 94 86 M108 86 Q114 82 120 86" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M88 108 Q98 116 108 108" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Angled turned back/shoulder in foreground -->
      <path d="M50 150 C50 140 70 140 100 146 L145 158 C160 162 170 185 170 215 L35 215 C35 180 40 160 50 150 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" />
    `,
  },
]

export function getPoseGuidesByCategory(category: string): PoseGuide[] {
  if (category === "all") return POSE_GUIDES
  return POSE_GUIDES.filter((p) => p.category === category)
}

export function getDynamicPoseForShot(shotNumber: number): PoseGuide {
  const dynamicPoses = POSE_GUIDES.filter((p) => p.category === "dynamic")
  const targetStep = ((shotNumber - 1) % dynamicPoses.length) + 1
  return dynamicPoses.find((p) => p.burstStep === targetStep) || dynamicPoses[0]
}
