const hslToHex = require('hsl-to-hex')

module.exports = function color (str) {
  const hash = stringToFloatHash(str)
  return getRandomColor(hash)
}

// random color credit https://dev.to/akhil_001/generating-random-color-with-single-line-of-js-code-fhj
// function getRandomColor (hash) {
//  return Math.floor(hash*16777215).toString(16).padStart(6, '0')
// }

function getRandomColor (hash) {
  return hslToHex(Math.ceil(hash * 360), 100, 70)
}

// floating-point multiplicative hash by Knuth
// code credit https://github.com/openlayers/ol2/blob/76d899f74daac84d6c2a34ce4a4f8b0f7e8e3ab2/lib/OpenLayers/Layer/HTTPRequest.js#L164
// I am looking for npm module for this

// Golden ratio conjugate or Silver Ratio
// https://en.wikipedia.org/wiki/Golden_ratio#Golden_ratio_conjugate
const SILVER_RATIO = process.env.SILVER_RATIO ? parseFloat(process.env.SILVER_RATIO)
  : (Math.sqrt(5) - 1) / 2

function stringToFloatHash (str) {
  var product = 1;
  for (var i=0, len=str.length; i<len; i++) {
    product *= str.charCodeAt(i) * SILVER_RATIO;
    product -= Math.floor(product);
  }
  return product;
}


// References
// https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
// https://stackoverflow.com/questions/43193341/how-to-generate-random-pastel-or-brighter-color-in-javascript/43195379#43195379

// Other libraries to generate unique random color from text
// https://github.com/sterlingwes/RandomColor
// https://github.com/dastoori/uniqolor

// best Javascript color conversion and manipulation library 
// https://www.npmjs.com/package/color

// About knuth multiplicative hash
// https://lowrey.me/exploring-knuths-multiplicative-hash-2/
// https://stackoverflow.com/questions/11871245/knuth-multiplicative-hash
// https://github.com/wan2land/inthash
// https://stackoverflow.com/questions/664014/what-integer-hash-function-are-good-that-accepts-an-integer-hash-key

// other userful color related points
// https://stackoverflow.com/questions/10014271/generate-random-color-distinguishable-to-humans

// color scale lib
// https://www.npmjs.com/package/chroma-js
