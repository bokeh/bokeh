base = require('../base')
Collections = base.Collections

guides = require('./guides')


class GuideRenderers extends Backbone.Collection
  model: (attrs, options) ->
    if not attrs.guidespec?.type?
      console.log "missing guide type"
      return

    type = attrs.guidespec.type

    if not (type of guides)
      console.log "unknown guide type '" + type + "'"
      return

    model = guides[type]
    return new model(attrs, options)


exports.guiderenderers = new GuideRenderers
