
define [
  "underscore",
  "./has_properties",
], (_, HasProperties) ->

  # hasparent
  # display_options can be passed down to children
  # defaults for display_options should be placed
  # in a class var display_defaults
  # the get function, will resolve an instances defaults first
  # then check the parents actual val, and finally check class defaults.
  # display options cannot go into defaults

  # defaults vs display_defaults
  # backbone already has a system for attribute defaults, however we wanted to
  # impose a secondary inheritance system for attributes based on GUI hierarchies
  # the idea being that you generally want to inherit UI attributes from
  # your container/parent.  Here is how we do this.
  # HasParent models can have a parent attribute, which is our
  # continuum reference.  when we try to get an attribute, first we try to
  # get the attribute via super (so try properties, and if not that, normal
  # backbone resolution) if that results in something which is undefined,
  # then try to grab the attribute from the parent.

  # the reason why we need to segregate display_defaults into a separate object
  # form backbones normal default is because backbone defaults are automatically
  # set on the object, so you have no way of knowing whether the attr exists
  # because it was a default, or whether it was intentionally set.  In the
  # parent case, we want to try parent settings BEFORE we rely on
  # display defaults.

  # functionally, since this is mostly there to facilitate deferred lookups,
  # perhaps a name besides display_defaults would be appropriate, we might want
  # to store non-display related defaults here.

  class HasParent extends HasProperties

    initialize: (attrs, options) ->
      super(attrs, options)
      @_parent = HasProperties.prototype.get.apply(this, ['parent'])

    get: (attr) ->
      if not @_display_defaults
        @_display_defaults = @display_defaults()
      if attr == 'parent'
        return @_parent
      val = super(attr)
      if not _.isUndefined(val)
        return val
      if @_parent and _.indexOf(@_parent.parent_properties, attr) >= 0
        val = @_parent.get(attr)
        if not _.isUndefined(val)
          return val
      return @_display_defaults[attr]

    display_defaults: () ->
      return {}

  return HasParent
