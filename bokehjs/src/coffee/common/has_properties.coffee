$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
{logger} = require "./logging"

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
    @document = null

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
      old = {}
      for key, value of attrs
        old[key] = @get(key, resolve_refs=false)
      super(attrs, options)
      for key, value of attrs
        @_tell_document_about_change(key, old[key], @get(key, resolve_refs=false))

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

  @_is_ref: (arg) ->
    if _.isObject(arg)
      keys = _.keys(arg).sort()
      if keys.length==2
        return keys[0]=='id' and keys[1]=='type'
      if keys.length==3
        return keys[0]=='id' and keys[1]=='subtype' and keys[2]=='type'
    return false

  # TODO (havocp) I suspect any use of this is broken, because
  # if we're in a Document we should have already resolved refs,
  # and if we aren't in a Document we can't resolve refs.
  resolve_ref: (arg) =>
    # ### method: HasProperties::resolve_ref
    # converts references into an objects, leaving non-references alone
    # also works "vectorized" on arrays and objects
    if _.isUndefined(arg)
      return arg
    if _.isArray(arg)
      return (@resolve_ref(x) for x in arg)
    if HasProperties._is_ref(arg)
      # this way we can reference ourselves
      # even though we are not in any collection yet
      if arg['type'] == this.type and arg['id'] == this.id
        return this
      else if @document
        model = @document.get_model_by_id(arg['id'])
        if model == null
          throw new Error("#{@} refers to #{JSON.stringify(arg)} but it isn't in document #{@_document}")
        else
          return model
      else
        throw new Error("#{@} Cannot resolve ref #{JSON.stringify(arg)} when not in a Document")
    return arg

  get_base: ()->
    if not @_base
      @_base = require('./base')
    return @_base

  sync: (method, model, options) ->
    # make this a no-op, we sync the whole document never individual models
    return options.success(model.attributes, null, {})

  defaults: () -> { 'name' : null }

  # TODO remove this, for now it's just to help find nonserializable_attribute_names we
  # need to add.
  serializable_in_document: () -> true

  # returns a list of those names which should not be included
  # in the Document and should not go to the server. Subtypes
  # should override this. The result will be cached on the class,
  # so this only gets called one time on one instance.
  nonserializable_attribute_names: () ->
    []

  _get_nonserializable_dict: () ->
    if not @constructor._nonserializable_names_cache?
      names = {}
      for n in @nonserializable_attribute_names()
        names[n] = true
      @constructor._nonserializable_names_cache = names
    @constructor._nonserializable_names_cache

  attribute_is_serializable: (attr) ->
    (attr not of @_get_nonserializable_dict()) and (attr of @attributes)

  # dict of attributes that should be serialized to the server. We
  # sometimes stick things in attributes that aren't part of the
  # Document's models, subtypes that do that have to remove their
  # extra attributes here.
  serializable_attributes: () ->
    nonserializable = @_get_nonserializable_dict()
    attrs = {}
    for k, v of @attributes
      if k not of nonserializable
        attrs[k] = v
    attrs

  # JSON serialization requires special measures to deal with cycles,
  # which means objects can't be serialized independently but only
  # as a whole object graph. This catches mistakes where we accidentally
  # try to serialize an object in the wrong place (for example if
  # we leave an object instead of a ref in a message we try to send
  # over the websocket, or if we try to use Backbone's sync stuff)
  toJSON: (options) ->
    throw new Error("bug: toJSON should not be called on #{@}, models require special serialization measures")

  @_value_to_json: (key, value, optional_parent_object) ->
    if value instanceof HasProperties
      value.ref()
    else if _.isArray(value)
      ref_array = []
      for v, i in value
        if v instanceof HasProperties and not v.serializable_in_document()
          console.log("May need to add #{key} to nonserializable_attribute_names of #{optional_parent_object?.constructor.name} because array contains a nonserializable type #{v.constructor.name} under index #{i}")
        else
          ref_array.push(HasProperties._value_to_json(i, v, value))
      ref_array
    else if _.isObject(value)
      ref_obj = {}
      for own subkey of value
        if value[subkey] instanceof HasProperties and not value[subkey].serializable_in_document()
          console.log("May need to add #{key} to nonserializable_attribute_names of #{optional_parent_object?.constructor.name} because value of type #{value.constructor.name} contains a nonserializable type #{value[subkey].constructor.name} under #{subkey}")
        else
          ref_obj[subkey] = HasProperties._value_to_json(subkey, value[subkey], value)
      ref_obj
    else
      value

  # Convert attributes to "shallow" JSON (values which are themselves models
  # are included as just references)
  # TODO (havocp) can this just be toJSON (from Backbone / JSON.stingify?)
  # backbone will have implemented a toJSON already that we may need to override
  attributes_as_json: () ->
    # TODO remove serializable_in_document and this check once we aren't seeing these
    # warnings anymore
    fail = false
    for own key, value of @serializable_attributes()
      if value instanceof HasProperties and not value.serializable_in_document()
        console.log("May need to add #{key} to nonserializable_attribute_names of #{@.constructor.name} because value #{value.constructor.name} is not serializable")
        fail = true
    if fail
      return {}
    HasProperties._value_to_json("attributes", @serializable_attributes(), @)

  # this is like _value_record_references but expects to find refs
  # instead of models, and takes a doc to look up the refs in
  @_json_record_references: (doc, v, result, recurse) ->
    if v is null
      ;
    else if HasProperties._is_ref(v)
      if v.id not of result
        model = doc.get_model_by_id(v.id)
        HasProperties._value_record_references(model, result, recurse)
    else if _.isArray(v)
      for elem in v
        HasProperties._json_record_references(doc, elem, result, recurse)
    else if _.isObject(v)
      for own k, elem of v
        HasProperties._json_record_references(doc, elem, result, recurse)

  # add all references from 'v' to 'result', if recurse
  # is true then descend into refs, if false only
  # descend into non-refs
  @_value_record_references: (v, result, recurse) ->
    if v is null
      ;
    else if v instanceof HasProperties
      if v.id not of result
        result[v.id] = v
        attrs = v.serializable_attributes()
        for key of attrs
          value = attrs[key]
          if value instanceof HasProperties and not value.serializable_in_document()
            console.log("May need to add #{key} to nonserializable_attribute_names of #{v.constructor.name} because value #{value.constructor.name} is not serializable")
          HasProperties._value_record_references(value, result, recurse)
    else if _.isArray(v)
      for elem in v
        if elem instanceof HasProperties and not elem.serializable_in_document()
          console.log("Array contains nonserializable item, we shouldn't traverse this property ", elem)
          throw new Error("Trying to record refs for array with nonserializable item")
        HasProperties._value_record_references(elem, result, recurse)
    else if _.isObject(v)
      for own k, elem of v
        if elem instanceof HasProperties and not elem.serializable_in_document()
          console.log("Dict contains nonserializable item under #{k}, we shouldn't traverse this property ", elem)
          throw new Error("Trying to record refs for dict with nonserializable item")
        HasProperties._value_record_references(elem, result, recurse)

  # Get models that are immediately referenced by our properties
  # (do not recurse, do not include ourselves)
  _immediate_references: () ->
    result = {}
    HasProperties._value_record_references(@, result, false) # false = no recurse
    delete result[@id]
    _.values(result)

  attach_document: (doc) ->
    if @document != null and @document != doc
      throw new Error("Models must be owned by only a single document")
    first_attach = @document == null
    @document = doc
    if doc != null
      doc._notify_attach(@)
      if first_attach
        for c in @_immediate_references()
          c.attach_document(doc)

  detach_document: () ->
    if @document != null
      if @document._notify_detach(@) == 0
        @document = null
        for c in @_immediate_references()
          c.detach_document()

  _tell_document_about_change: (attr, old, new_) ->
    if not @attribute_is_serializable(attr)
      return

    # TODO remove serializable_in_document and these checks once we aren't seeing these
    # warnings anymore
    if old instanceof HasProperties and not old.serializable_in_document()
      console.log("May need to add #{attr} to nonserializable_attribute_names of #{@constructor.name} because old value #{old.constructor.name} is not serializable")
      return

    if new_ instanceof HasProperties and not new_.serializable_in_document()
      console.log("May need to add #{attr} to nonserializable_attribute_names of #{@constructor.name} because new value #{new_.constructor.name} is not serializable")
      return

    if new_ instanceof HasProperties and @document != null
      new_.attach_document(@document)
    if old instanceof HasProperties
      old.detach_document()
    if @document != null
      @document._notify_change(@, attr, old, new_)

module.exports = HasProperties
