
const HASH_FACTOR = process.env.COLOR_HASH ? parseFloat(process.env.COLOR_HASH)
  : (Math.sqrt(5) - 1) / 2

module.exports = function color (str) {
  const hash = stringToFloatHash(str)
  return getRandomColor(hash)
}

// random color credit https://dev.to/akhil_001/generating-random-color-with-single-line-of-js-code-fhj
function getRandomColor (hash) {
  return Math.floor(hash*16777215).toString(16).padStart(6, '0')
}

// floating-point multiplicative hash by Knuth
// code credit https://github.com/openlayers/ol2/blob/76d899f74daac84d6c2a34ce4a4f8b0f7e8e3ab2/lib/OpenLayers/Layer/HTTPRequest.js#L164

function stringToFloatHash (str) {
  var product = 1;
  for (var i=0, len=str.length; i<len; i++) {
      product *= str.charCodeAt(i) * HASH_FACTOR;
      product -= Math.floor(product);
  }
  return product;
}
