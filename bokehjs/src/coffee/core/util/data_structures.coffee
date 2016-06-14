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

module.exports =
  MultiDict: MultiDict