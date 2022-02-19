// returns color of electrode
/**
 * 
 * @param {string} type - seizure type
 * @returns {array} - the RGB color
 */
const getSeizTypeColor = (type) => {

  // if type is null, return white
  if (!type) return [1, 1, 1];

  // the JSON is not always the same form for strings, so we trim space and make lowercase
  const lowerCaseType = type.toString().toLowerCase().replace(/\s+/g, ' ').trim()

  const electrodeColors = {

    // Seizure Type X
    "early spread": [1, 1, 0], "onset": [1, 0, 0], "late spread": [0, 1, 0.19],
    "very early spread": [1, 0.35, 0.12], "rapid spread": [0, 0, 1], "early onset": [0, 1, 1],

    // int pop
    "0": [1, 1, 1], "1": [0, 1, 0.19], "2": [0, 0, 0.9], "3": [1, 0, 1],
    "4": [0, 1, 1], "5": [0.27, 0.46, 0.2], "6": [0.4, 0.17, 0.57],
    "7": [0.76, 0.76, 0.76], "8": [0.46, 0.55, 0.65], 

    // default (no color)
    "":  [1, 1, 1] 
  };
  return electrodeColors[lowerCaseType];
}

export { getSeizTypeColor };