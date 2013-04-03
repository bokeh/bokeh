base = require('../base')
Collections = base.Collections

glyphs = require('./glyphs')


class GlyphRenderers extends Backbone.Collection
  model: (attrs, options) ->
    if not attrs.glyphspec?.type?
      console.log "missing type"
      return

    type = attrs.glyphspec.type

    if not (type of glyphs)
      console.log "Unknown type '" + attrs.type + "'"
      return

    model = glyphs[type]
    return new model(attrs, options)


exports.glyphrenderers = new GlyphRenderers
