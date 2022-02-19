// inspired by https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another
/**
 * 
 * @param {number} input 
 * @param {array} inputRange 
 * @param {array} outputRange 
 * @returns {number}
 * 
 * This is the function that can map a coordinate on one interval to a coodinate on another.
 * This is primarily how we get a coordinate on the range of [-127.5, 127.5] to a slice index
 * on [0, 255]. This was originally called in multiple places, but it should now only be 
 * called when each electrode object is created. Since we always use thw two above intervals,
 * our conversion fraction is always one. But it might be useful in other cases, so it is good
 * to keep as is.
 */

const mapInterval = (input, inputRange, outputRange) => {
  const [inputStart, inputEnd] = inputRange;
  const [outputStart, outputEnd] = outputRange;
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart))
    * (input - inputStart);
}

export { mapInterval };