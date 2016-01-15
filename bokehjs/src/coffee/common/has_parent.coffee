_ = require "underscore"
HasProperties = require "./has_properties"

class HasParent extends HasProperties

  initialize: (attrs, options) ->
    super(attrs, options)
    @_parent = HasProperties.prototype.get.apply(this, ['parent'])

  nonserializable_attribute_names: () ->
    super().concat(['parent'])

  get: (attr, resolve_refs=true) ->
    if attr == 'parent'
      return @_parent
    val = super(attr, resolve_refs)
    if not _.isUndefined(val)
      return val
    if @_parent and _.indexOf(@_parent.parent_properties, attr) >= 0
      val = @_parent.get(attr, resolve_refs)
      if not _.isUndefined(val)
        return val

module.exports = HasParent
