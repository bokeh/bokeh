_ = require "underscore"

class MultiDict

    constructor : () ->
      @_dict = {}

    _existing: (key) ->
      if key of @_dict
        return @_dict[key]
      else
        return null

    add_value: (key, value) ->
      if value == null
        throw new Error("Can't put null in this dict")
      if _.isArray(value)
        throw new Error("Can't put arrays in this dict")
      existing = @_existing(key)
      if existing == null
        @_dict[key] = value
      else if _.isArray(existing)
        existing.push(value)
      else
        @_dict[key] = [existing, value]

    remove_value: (key, value) ->
      existing = @_existing(key)
      if _.isArray(existing)
        new_array = _.without(existing, value)
        if new_array.length > 0
          @_dict[key] = new_array
        else
          delete @_dict[key]
      else if _.isEqual(existing, value)
        delete @_dict[key]

    get_one: (key, duplicate_error) ->
      existing = @_existing(key)
      if _.isArray(existing)
        if existing.length == 1
          return existing[0]
        else
          throw new Error(duplicate_error)
      else
        return existing


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

module.exports =
  MultiDict: MultiDict
  Set: Set
