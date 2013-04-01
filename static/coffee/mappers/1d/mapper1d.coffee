HasProperties = require('../../base').HasProperties


class LinearMapper extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)
    @source_range = options.source_range
    @target_range = options.target_range

