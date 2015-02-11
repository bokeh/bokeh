define [
  "./hbox"
  "backbone"
], (hbox, Backbone) ->
  class SimpleAppView extends hbox.View

  class SimpleApp extends hbox.Model
    initialize : (attrs, options) ->
      @register_property('children', @children, true)
      @add_dependencies('children', this, ['widgets', 'output'])
    children : () =>
      return [@get('widgets'), @get('output')]
  class SimpleApps extends Backbone.Collection
    model : SimpleApp

  simpleapps = new SimpleApps()
  return {
    "Model" : SimpleApp
    "Collection" : simpleapps
    "View" : SimpleAppView
  }
