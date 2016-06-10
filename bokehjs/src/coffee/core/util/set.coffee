
class Set
  constructor: (array) ->
    if not array
      @values = []
    else
      if array.constructor is Set
        return new Set array.values
      if array.constructor is Array
        @values = Set.compact(array)
      else
        @values = [array]

  @compact: (array) ->
    newArray = []

    for item in array
      newArray.push item if newArray.indexOf(item) is -1

    return newArray

  push: (item) ->
    if @missing(item)
      @values.push(item)

  remove: (item) ->
    i = @values.indexOf item
    @values = @values.slice(0,i).concat @values.slice(i+1)

  length: ->
    @values.length

  includes: (item) ->
    @values.indexOf(item) isnt -1

  missing: (item) ->
    not @includes item

  slice: (from, to) ->
    @values.slice from, to

  join: (str) ->
    @values.join str

  toString: ->
    @join ', '

  includes: (item) ->
    @values.indexOf(item) isnt -1

  union: (set) ->
    set = new Set(set)
    new Set @values.concat set.values

  intersect: (set) ->
    set = new Set(set)
    newSet = new Set

    for item in set.values
      newSet.push item if @includes(item) and set.includes(item)

    return newSet

  diff: (set) ->
    set = new Set(set)
    newSet = new Set

    for item in @values
      newSet.push item if set.missing(item)

    return newSet

module.exports = Set