HasProperties = require('../../base').HasProperties


class Mapper1D extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)
    #@source_range = options.source_range
    #@target_range = options.target_range


exports.Mapper1D = Mapper1D