hbox = require "../hbox"

class SimpleAppLayoutView extends hbox.View

class SimpleAppLayout extends hbox.Model

  initialize: (attrs, options) ->
    @register_property('children', @children, true)
    @add_dependencies('children', this, ['widgets', 'output'])

  children: () =>
    return [@get('widgets'), @get('output')]

module.exports =
  Model: SimpleAppLayout
  View: SimpleAppLayoutView