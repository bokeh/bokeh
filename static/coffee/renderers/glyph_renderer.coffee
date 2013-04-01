base = require('../base')
Collections = base.Collections

prim = require('./primitives')


class GlyphRenderers extends Backbone.Collection
  model: (attrs, options) ->
    if not attrs.glyphspec?.type?
      console.log "missing type"
      return

    type = attrs.glyphspec.type

    if not (type of prim)
      console.log "Unknown type '" + attrs.type + "'"
      return

    model = prim[type]
    return new model(attrs, options)


exports.glyphrenderers = new GlyphRenderers
