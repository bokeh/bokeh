_ = require "underscore"

monkey_patch = ->

  _.uniqueId = (prefix) ->
    # from ipython project
    # http://www.ietf.org/rfc/rfc4122.txt
    s = []
    hexDigits = "0123456789ABCDEF"
    for i in [0..31]
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    s[12] = "4"  # bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1)  # bits 6-7 of the clock_seq_hi_and_reserved to 01

    uuid = s.join("")
    if (prefix)
      return prefix + "-" + uuid
    else
      return uuid;

_.isNullOrUndefined = (x) ->
  return _.isNull(x) || _.isUndefined(x)

_.setdefault = (obj, key, value) ->
  if _.has(obj, key)
    return obj[key]
  else
    obj[key] = value
    return value

module.exports =
  monkey_patch: monkey_patch
