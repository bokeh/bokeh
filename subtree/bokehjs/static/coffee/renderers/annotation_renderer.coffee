base = require('../base')
Collections = base.Collections

annotations = require('./annotations')


class AnnotationRenderers extends Backbone.Collection
  model: (attrs, options) ->
    if not attrs.annotationspec?.type?
      console.log "missing annotation type"
      return

    type = attrs.annotationspec.type

    if not (type of annotations)
      console.log "unknown annotation type '" + type + "'"
      return

    model = annotations[type]
    return new model(attrs, options)


exports.annotationrenderers = new AnnotationRenderers
