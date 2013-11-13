
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
    get_fallback: (attr) ->
      if (@get_obj('parent') and
          _.indexOf(@get_obj('parent').parent_properties, attr) >= 0 and
          not _.isUndefined(@get_obj('parent').get(attr)))
        return @get_obj('parent').get(attr)
      else
        if _.isFunction(@display_defaults)
          return @display_defaults()[attr]
        return @display_defaults[attr]

    get: (attr) ->
      ## no fallback for 'parent'
      normalval = super(attr)
      if not _.isUndefined(normalval)
        return normalval
      else if not (attr == 'parent')
        return @get_fallback(attr)

    display_defaults: {}
  return HasParent