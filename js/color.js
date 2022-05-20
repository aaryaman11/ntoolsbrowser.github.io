// color object according to the actual name of the original hex code
// multiply 255 by each val to get RGB decimal value
const COLOR = {
  white: [1, 1, 1],
  black: [0, 0, 0],
  red: [1, 0, 0],
  green: [0, 1, 0],
  blue: [0, 0, 1],
  yellow: [1, 1, 0],
  cyan: [0, 1, 1],
  magenta: [1, 0, 1],
  orange: [1, 0.65, 0],
  pink: [1, 0.41, 0.70],
  electricGreen: [0, 1, 0.19],
  giantsOrange: [1, 0.35, 0.12],
  sapGreen: [0.27, 0.46, 0.2],
  eminence: [0.4, 0.17, 0.57],
  silverSand: [0.76, 0.76, 0.76],
  shadowBlue: [0.46, 0.55, 0.65],
}

// returns color of electrode
/**
 *
 * @param {string} type - seizure type
 * @returns {array} - the RGB color
 */
const getSeizTypeColor = (type) => {
  // if type is null, return white
  if (!type) return COLOR.white;

  // the JSON is not always the same form for strings, so we trim space and make lowercase
  const lowerCaseType = type
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const electrodeColors = {
    // Seizure Type X
    "early spread": COLOR.yellow,
    "onset": COLOR.red,
    "late spread": COLOR.electricGreen,
    "very early spread": COLOR.giantsOrange,
    "rapid spread": COLOR.blue,
    "early onset": COLOR.cyan,
    "variable": COLOR.pink,

    // int pop
    0: COLOR.white,
    1: COLOR.electricGreen,
    2: COLOR.blue,
    3: COLOR.magenta,
    4: COLOR.cyan,
    5: COLOR.sapGreen,
    6: COLOR.eminence,
    7: COLOR.silverSand,
    8: COLOR.shadowBlue,

    // default (no color)
    "": COLOR.white,
  };
  return electrodeColors[lowerCaseType] ?? COLOR.white;
};

export { getSeizTypeColor, COLOR };
