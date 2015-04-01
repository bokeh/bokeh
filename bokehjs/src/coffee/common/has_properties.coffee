$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
{logger} = require "./logging"

_is_ref = (arg) ->
  if _.isObject(arg)
    keys = _.keys(arg).sort()
    if keys.length==2
      return keys[0]=='id' and keys[1]=='type'
    if keys.length==3
      return keys[0]=='id' and keys[1]=='subtype' and keys[2]=='type'
  return false

class HasProperties extends Backbone.Model
  # Our property system
  # we support python style computed properties, with getters
  # as well as setters. We also support caching of these properties,
  # and notifications of property. We also support weak references
  # to other models using the reference system described above.

  toString: () -> "#{@type}(#{@id})"

  destroy: (options)->
    # calls super, also unbinds any events bound by listenTo
    super(options)
    @stopListening()

  isNew: () ->
    return false

  attrs_and_props : () ->
    data = _.clone(@attributes)
    for prop_name in _.keys(@properties)
      data[prop_name] = @get(prop_name)
    return data

  constructor : (attributes, options) ->
    ## straight from backbone.js
    attrs = attributes || {}
    if not options
      options = {}
    this.cid = _.uniqueId('c')
    this.attributes = {}
    if options.collection
      this.collection = options.collection
    if options.parse
      attrs = this.parse(attrs, options) || {}
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'))
    this.set(attrs, options)
    this.changed = {}

    ## bokeh custom constructor code

    # cheap memoization, for storing the base module, requirejs doesn't seem to do it
    @_base = false

    # setting up data structures for properties
    @properties = {}
    @property_cache = {}

    # auto generating ID
    if not _.has(attrs, @idAttribute)
      this.id = _.uniqueId(this.type)
      this.attributes[@idAttribute] = this.id

    # allowing us to defer initialization when loading many models
    # when loading a bunch of models, we want to do initialization as a second pass
    # because other objects that this one depends on might not be loaded yet

    if not options.defer_initialization
      this.initialize.apply(this, arguments)

  forceTrigger: (changes) ->
    # This is "trigger" part of backbone's set() method. set() is unable to work with
    # mutable data structures, so instead of using set() we update data in-place and
    # then call forceTrigger() which will make sure all listeners are notified of any
    # changes, e.g.:
    #
    #   source.get("data")[field][index] += 1
    #   source.forceTrigger()
    #
    if not _.isArray(changes)
      changes = [changes]

    options    = {}
    changing   = @_changing
    @_changing = true

    if changes.length then @_pending = true
    for change in changes
      @trigger('change:' + change, this, @attributes[change], options)

    if changing then return this
    while @_pending
      @_pending = false
      @trigger('change', this, options)

    @_pending = false
    @_changing = false

    return this

  set_obj: (key, value, options) ->
    if _.isObject(key) or key == null
      attrs = key
      options = value
    else
      attrs = {}
      attrs[key] = value
    for own key, val of attrs
      attrs[key] = @convert_to_ref(val)
    return @set(attrs, options)

  set: (key, value, options) ->
    # checks for setters, if setters are present, call setters first
    # then remove the computed property from the dict of attrs, and call super

    # backbones set function supports 2 call signatures, either a dictionary of
    # key value pairs, and then options, or one key, one value, and then options.
    # replicating that logic here
    if _.isObject(key) or key == null
      attrs = key
      options = value
    else
      attrs = {}
      attrs[key] = value
    toremove  = []
    for own key, val of attrs
      if _.has(this, 'properties') and
         _.has(@properties, key) and
         @properties[key]['setter']
        @properties[key]['setter'].call(this, val, key)
        toremove.push(key)
    if not _.isEmpty(toremove)
      attrs = _.clone(attrs)
      for key in toremove
        delete attrs[key]
    if not _.isEmpty(attrs)
      super(attrs, options)

  convert_to_ref: (value) =>
    # converts value into a refrence if necessary
    # works vectorized
    if _.isArray(value)
      return _.map(value, @convert_to_ref)
    else
      if value instanceof HasProperties
        return value.ref()

  # ### method: HasProperties::add_dependencies
  add_dependencies:  (prop_name, object, fields) ->
    # * prop_name - name of property
    # * object - object on which dependencies reside
    # * fields - attributes on that object
    # at some future date, we should support a third arg, events
    if not _.isArray(fields)
      fields = [fields]
    prop_spec = @properties[prop_name]
    prop_spec.dependencies = prop_spec.dependencies.concat(
      obj: object
      fields: fields
    )
    # bind depdencies to change dep callback
    for fld in fields
      @listenTo(object, "change:" + fld, prop_spec['callbacks']['changedep'])

  # ### method: HasProperties::register_setter
  register_setter: (prop_name, setter) ->
    prop_spec = @properties[prop_name]
    prop_spec.setter = setter

  # ### method: HasProperties::register_property
  register_property:  (prop_name, getter, use_cache) ->
    # register a computed property. Setters, and dependencies
    # can be added with `@add_dependencies` and `@register_setter`
    # #### Parameters
    # * prop_name: name of property
    # * getter: function, calculates computed value, takes no arguments
    # * use_cache: whether to cache or not
    # #### Returns
    # * prop_spec: specification of the property, with the getter,
    # setter, dependenices, and callbacks associated with the prop
    if _.isUndefined(use_cache)
      use_cache = true
    if _.has(@properties, prop_name)
      @remove_property(prop_name)
    # we store a prop_spec, which has the getter, setter, dependencies
    # we also store the callbacks used to implement the computed property,
    # we do this so we can remove them later if the property is removed
    changedep = () =>
      @trigger('changedep:' + prop_name)
    propchange = () =>
      firechange = true
      if prop_spec['use_cache']
        old_val = @get_cache(prop_name)
        @clear_cache(prop_name)
        new_val = @get(prop_name)
        firechange = new_val != old_val
      if firechange
        @trigger('change:' + prop_name, this, @get(prop_name))
        @trigger('change', this)
    prop_spec=
      'getter': getter,
      'dependencies': [],
      'use_cache': use_cache
      'setter': null
      'callbacks':
        changedep: changedep
        propchange: propchange
    @properties[prop_name] = prop_spec
    # bind propchange callback to change dep event
    @listenTo(this, "changedep:#{prop_name}",
              prop_spec['callbacks']['propchange'])
    return prop_spec

  remove_property: (prop_name) ->
    # removes the property,
    # unbinding all associated callbacks that implemented it
    prop_spec = @properties[prop_name]
    dependencies = prop_spec.dependencies
    for dep in dependencies
      obj = dep.obj
      for fld in dep['fields']
        obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this)
    @off("changedep:" + dep)
    delete @properties[prop_name]
    if prop_spec.use_cache
      @clear_cache(prop_name)

  has_cache: (prop_name) ->
    return _.has(@property_cache, prop_name)

  add_cache: (prop_name, val) ->
    @property_cache[prop_name] = val

  clear_cache: (prop_name, val) ->
    delete @property_cache[prop_name]

  get_cache: (prop_name) ->
    return @property_cache[prop_name]

  get: (prop_name, resolve_refs=true) ->
    # ### method: HasProperties::get
    # overrides backbone get.  checks properties,
    # calls getter, or goes to cache
    # if necessary.  If it's not a property, then just call super
    if _.has(@properties, prop_name)
      return @_get_prop(prop_name)
    else
      ref_or_val = super(prop_name)
      if not resolve_refs
        return ref_or_val
      return @resolve_ref(ref_or_val)

  _get_prop: (prop_name) ->
    prop_spec = @properties[prop_name]
    if prop_spec.use_cache and @has_cache(prop_name)
      return @property_cache[prop_name]
    else
      getter = prop_spec.getter
      computed = getter.apply(this, [prop_name])
      if @properties[prop_name].use_cache
        @add_cache(prop_name, computed)
      return computed

  ref: () ->
    # ### method: HasProperties::ref
    # generates a reference to this model
    'type': this.type
    'id': this.id

  resolve_ref: (arg) =>
    # ### method: HasProperties::resolve_ref
    # converts references into an objects, leaving non-references alone
    # also works "vectorized" on arrays and objects
    if _.isUndefined(arg)
      return arg
    if _.isArray(arg)
      return (@resolve_ref(x) for x in arg)
    if _is_ref(arg)
      # this way we can reference ourselves
      # even though we are not in any collection yet
      if arg['type'] == this.type and arg['id'] == this.id
        return this
      else
        return @get_base().Collections(arg['type']).get(arg['id'])
    return arg

  get_base: ()->
    if not @_base
      @_base = require('./base')
    return @_base

  url: () ->
    # ### method HasProperties::url
    # model where our API processes this model
    doc = @get('doc')
    if not doc?
      logger.error("unset 'doc' in #{@}")

    url = @get_base().Config.prefix + "bokeh/bb/" + doc + "/" + @type + "/"
    if (@isNew())
      return url
    return url + @get('id') + "/"

  sync: (method, model, options) ->
    # this should be fixed via monkey patching when extended by an
    # environment that implements the model backend,
    # to enable normal beaviour, add this line
    #
    # HasProperties.prototype.sync = Backbone.sync
    return options.success(model.attributes, null, {})

  defaults: -> {}

  rpc: (funcname, args, kwargs) =>
    prefix = @get_base().Config.prefix
    doc = @get('doc')
    if not doc?
      throw new Error("Unset 'doc' in " + this)
    id = @get('id')
    type = @type
    url = "#{prefix}bokeh/bb/rpc/#{doc}/#{type}/#{id}/#{funcname}/"
    data =
      args: args
      kwargs: kwargs
    resp = $.ajax(
      type: 'POST'
      url: url,
      data: JSON.stringify(data)
      contentType: 'application/json'
      xhrFields:
        withCredentials: true
    )
    return resp

module.exports = HasProperties
