/**
 * The two ways this room can be lit.
 *
 * Light is the white cube: daylight through the skylights, work lit evenly, walls
 * that stay out of the way. Dark is the same hall after hours — the skylights are
 * dim, the walls fall back to charcoal, and the spots carry the whole room. It is
 * a different hang, not an inverted screenshot.
 *
 * Every value the scene reads when re-theming lives here, so switching themes is
 * a matter of assigning colours and intensities rather than rebuilding anything.
 */

export const THEMES = {
  light: {
    background: '#efece6',
    fog: { color: '#efece6', near: 22, far: 48 },

    walls: '#f2f0ec',
    skirting: '#e4e0d8',
    ceiling: '#ffffff',
    ceilingEmissive: '#fbf6ec',
    ceilingEmissiveIntensity: 0.35,
    skylight: '#fff8ec',
    floorTint: '#ffffff', // the floor texture, untinted
    vestibuleFloor: '#cfc4b0',
    vestibuleWalls: '#e8e4dc',
    vestibuleCeiling: '#f6f3ee',

    frame: '#2a2723',
    pedestal: '#f4f2ee',
    sculpture: '#e3d7c4',
    benchWood: '#b99a6d',
    benchLegs: '#55504a',
    contactShadow: 0.5,

    hemisphere: { sky: '#fff8ee', ground: '#d6cbb6', intensity: 1.15 },
    ambient: 0.5,
    sun: { colour: '#fff3e0', intensity: 0.55 },
    spot: { colour: '#ffe9c9', intensity: 22, hover: 30, penumbra: 0.55 },
    key: { colour: '#fff1dc', intensity: 30 },

    /** Matches --paper, so the browser chrome agrees with the page. */
    themeColor: '#f2f0ec',
  },

  dark: {
    background: '#141311',
    fog: { color: '#141311', near: 14, far: 40 },

    walls: '#242220',
    skirting: '#1b1a18',
    ceiling: '#131211',
    ceilingEmissive: '#2a2521',
    ceilingEmissiveIntensity: 0.5,
    skylight: '#3a332a',
    floorTint: '#6b5b47', // the same boards, in far less light
    vestibuleFloor: '#211e1a',
    vestibuleWalls: '#1e1c1a',
    vestibuleCeiling: '#191817',

    frame: '#0f0e0d',
    pedestal: '#2b2825',
    sculpture: '#c9b99f',
    benchWood: '#6e5942',
    benchLegs: '#2e2b28',
    contactShadow: 0.72,

    hemisphere: { sky: '#3d3830', ground: '#151412', intensity: 0.42 },
    ambient: 0.14,
    sun: { colour: '#4a4238', intensity: 0.16 },
    // The spots do the work here, so they are brighter and tighter.
    spot: { colour: '#ffe2b4', intensity: 38, hover: 52, penumbra: 0.42 },
    key: { colour: '#ffeacb', intensity: 46 },

    themeColor: '#141311',
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export function paletteFor(theme) {
  return THEMES[theme] ?? THEMES.light;
}
