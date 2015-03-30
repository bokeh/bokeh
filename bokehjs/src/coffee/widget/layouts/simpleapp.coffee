define [
  "./hbox"
  "backbone"
], (hbox, Backbone) ->
  class SimpleAppLayoutView extends hbox.View

  class SimpleAppLayout extends hbox.Model
    initialize : (attrs, options) ->
      @register_property('children', @children, true)
      @add_dependencies('children', this, ['widgets', 'output'])
    children : () =>
      return [@get('widgets'), @get('output')]

  class SimpleAppLayouts extends Backbone.Collection
    model : SimpleAppLayout

  simpleapplayouts = new SimpleAppLayouts()
  return {
    "Model" : SimpleAppLayout
    "Collection" : simpleapplayouts
    "View" : SimpleAppLayoutView
  }
