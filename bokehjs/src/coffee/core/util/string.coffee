export startsWith = (str, searchString, position=0) ->
  return str.substr(position, searchString.length) == searchString
