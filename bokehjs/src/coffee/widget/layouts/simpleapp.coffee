Backbone = require "backbone"
hbox = require "../hbox"

class SimpleAppLayoutView extends hbox.View

class SimpleAppLayout extends hbox.Model

  initialize: (attrs, options) ->
    @register_property('children', @children, true)
    @add_dependencies('children', this, ['widgets', 'output'])

  children: () =>
    return [@get('widgets'), @get('output')]

class SimpleAppLayouts extends Backbone.Collection
  model: SimpleAppLayout

module.exports =
  Model: SimpleAppLayout
  Collection: new SimpleAppLayouts()
  View: SimpleAppLayoutView