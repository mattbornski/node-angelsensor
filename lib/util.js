var isString = function(v) {
  return (typeof v === 'string') || (v instanceof String)
}

var stripUuid = function(uuid) {
	
}

var rpad = function(string, length) {
  if (string.length >= length) {
    return string
  } else {
    return rpad(string + ' ', length)
  }
}

module.exports = {
  isString: isString,
  rpad: rpad,
}
