base = require('../base')
Collections = base.Collections

glyphs = require('./glyphs')


class GlyphRenderers extends Backbone.Collection
  model: (attrs, options) ->
    if not attrs.glyphspec?.type?
      console.log "missing glyph type"
      return

    type = attrs.glyphspec.type

    if not (type of glyphs)
      console.log "unknown glyph type '" + type + "'"
      return

    model = glyphs[type]
    return new model(attrs, options)


exports.glyphrenderers = new GlyphRenderers
