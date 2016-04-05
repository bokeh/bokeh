$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"

{logger} = require "./logging"
property_mixins = require "./property_mixins"
refs = require "./util/refs"

class HasProps extends Backbone.Model

  props: {}
  mixins: []

  @define: (name_or_object, type, default_value) ->
    if _.isString(name_or_object)
      name = name_or_object
      prop = if _.isUndefined(default_value) then [type] else [type, default_value]
      object = {}
      object[name] = prop
    else
      object = name_or_object

    for name, prop of object
      do (name, prop) =>
        if this.prototype.props[name]?
          throw new Error("attempted to redefine property '#{this.name}.#{name}'")

        if this.prototype[name]?
          # XXX: should be an error, but Backbone.Model.url must be removed first
          console.log("attempted to redefine attribute '#{this.name}.#{name}'")

        Object.defineProperty(this.prototype, name, {
          get: ()      -> this.get(name)
          set: (value) -> this.set(name, value)
        }, {
          configurable: false
          enumerable: true
        })

        props = _.clone(this.prototype.props)
        props[name] = prop
        this.prototype.props = props

  @mixin: (names...) ->
    @define(property_mixins.create(names))
    mixins = this.prototype.mixins.concat(names)
    this.prototype.mixins = mixins

  @mixins: (names) -> @mixin(names...)

  @override: (name_or_object, default_value) ->
    if _.isString(name_or_object)
      object = {}
      object[name] = default_value
    else
      object = name_or_object

    for name, default_value of object
      do (name, default_value) =>
        value = this.prototype.props[name]
        if not value?
          throw new Error("attempted to override property '#{this.name}.#{name}' (which wasn't defined)")
        [type, _1, rest...] = value
        props = _.clone(this.prototype.props)
        props[name] = [type, default_value, rest...]
        this.prototype.props = props

  toString: () -> "#{@type}(#{@id})"

  destroy: (options)->
    # calls super, also unbinds any events bound by listenTo
    super(options)
    @stopListening()

  isNew: () ->
    return false

  attrs_and_props : () ->
    data = _.clone(@attributes)
    for prop_name in _.keys(@_computed)
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

    @properties = {}
    props = _.result(this, 'props')
    for name, [type, default_value] of props
      if not type?
        throw new Error("undefined property type for #{@type}.#{name}")
      @properties[name] = new type({obj: @, attr: name, default_value: default_value})

    if options.parse
      attrs = this.parse(attrs, options) || {}
    defaults = _.result(this, 'defaults')
    this.set(defaults, { defaults: true })

    # Bokeh specific
    this._set_after_defaults = {}

    this.set(attrs, options)

    # this is maintained by backbone ("changes since the last
    # set()") and probably isn't relevant to us
    this.changed = {}

    ## bokeh custom constructor code

    # setting up data structures for properties
    @_computed = {}

    # auto generating ID
    if not _.has(attrs, @idAttribute)
      this.id = _.uniqueId(this.type)
      this.attributes[@idAttribute] = this.id

    # allowing us to defer initialization when loading many models
    # when loading a bunch of models, we want to do initialization as a second pass
    # because other objects that this one depends on might not be loaded yet

    if not options.defer_initialization
      this.initialize.apply(this, arguments)

  set: (key, value, options) ->
    # backbones set function supports 2 call signatures, either a dictionary of
    # key value pairs, and then options, or one key, one value, and then options.
    # replicating that logic here
    if _.isObject(key) or key == null
      attrs = key
      options = value
    else
      attrs = {}
      attrs[key] = value
    for own key, val of attrs
      if not (options? and options.defaults)
        @_set_after_defaults[key] = true
    if not _.isEmpty(attrs)
      old = {}
      for key, value of attrs
        old[key] = @get(key, resolve_refs=false)
      super(attrs, options)

      if not options?.silent?
        for key, value of attrs
          @_tell_document_about_change(key, old[key], @get(key, resolve_refs=false))

  add_dependencies:  (prop_name, object, fields) ->
    # * prop_name - name of property
    # * object - object on which dependencies reside
    # * fields - attributes on that object
    if not _.isArray(fields)
      fields = [fields]
    prop_spec = @_computed[prop_name]
    prop_spec.dependencies = prop_spec.dependencies.concat(
      obj: object
      fields: fields
    )
    # bind depdencies to change dep callback
    for fld in fields
      @listenTo(object, "change:" + fld, prop_spec['callbacks']['changedep'])

  register_property:  (prop_name, getter, use_cache) ->
    # #### Parameters
    # * prop_name: name of property
    # * getter: function, calculates computed value, takes no arguments
    # * use_cache: whether to cache or not
    # #### Returns
    # * prop_spec: specification of the property, with the getter,
    if _.isUndefined(use_cache)
      use_cache = true
    if _.has(@_computed, prop_name)
      @remove_property(prop_name)

    changedep = () =>
      @trigger('changedep:' + prop_name)

    propchange = () =>
      firechange = true
      if prop_spec['use_cache']
        old_val = prop_spec.cache
        prop_spec.cache = undefined
        new_val = @get(prop_name)
        firechange = new_val != old_val
      if firechange
        @trigger('change:' + prop_name, this, @get(prop_name))
        @trigger('change', this)

    prop_spec =
      'getter': getter,
      'dependencies': [],
      'use_cache': use_cache
      'callbacks':
        changedep: changedep
        propchange: propchange

    @_computed[prop_name] = prop_spec

    # bind propchange callback to change dep event
    @listenTo(this, "changedep:#{prop_name}", prop_spec['callbacks']['propchange'])

    return prop_spec

  remove_property: (prop_name) ->
    # removes the property, unbinding all callbacks that implemented it
    prop_spec = @_computed[prop_name]
    dependencies = prop_spec.dependencies
    for dep in dependencies
      obj = dep.obj
      for fld in dep['fields']
        obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this)
    @off("changedep:" + dep)
    delete @_computed[prop_name]

  get: (prop_name, resolve_refs=true) ->
    if _.has(@_computed, prop_name)
      return @_get_prop(prop_name)
    else
      ref_or_val = super(prop_name)
      if not resolve_refs
        return ref_or_val
      return @resolve_ref(ref_or_val)

  _get_prop: (prop_name) ->
    prop_spec = @_computed[prop_name]
    if prop_spec.use_cache and prop_spec.cache
      return prop_spec.cache
    else
      getter = prop_spec.getter
      computed = getter.apply(this, [prop_name])
      if prop_spec.use_cache
        prop_spec.cache = computed
      return computed

  ref: () -> refs.create_ref(@)

  # we only keep the subtype so we match Python;
  # only Python cares about this
  set_subtype: (subtype) ->
    @_subtype = subtype

  # TODO (havocp) I suspect any use of this is broken, because
  # if we're in a Document we should have already resolved refs,
  # and if we aren't in a Document we can't resolve refs.
  resolve_ref: (arg) =>
    # ### method: HasProps::resolve_ref
    # converts references into an objects, leaving non-references alone
    # also works "vectorized" on arrays and objects
    if _.isUndefined(arg)
      return arg
    if _.isArray(arg)
      return (@resolve_ref(x) for x in arg)
    if refs.is_ref(arg)
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

  sync: (method, model, options) ->
    # make this a no-op, we sync the whole document never individual models
    return options.success(model.attributes, null, {})

  defaults: -> { }

  # TODO remove this, for now it's just to help find nonserializable_attribute_names we
  # need to add.
  serializable_in_document: () -> true

  # returns a list of those names which should not be included
  # in the Document and should not go to the server. Subtypes
  # should override this. The result will be cached on the class,
  # so this only gets called one time on one instance.
  nonserializable_attribute_names: () -> []

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
    if value instanceof HasProps
      value.ref()
    else if _.isArray(value)
      ref_array = []
      for v, i in value
        if v instanceof HasProps and not v.serializable_in_document()
          console.log("May need to add #{key} to nonserializable_attribute_names of #{optional_parent_object?.constructor.name} because array contains a nonserializable type #{v.constructor.name} under index #{i}")
        else
          ref_array.push(HasProps._value_to_json(i, v, value))
      ref_array
    else if _.isObject(value)
      ref_obj = {}
      for own subkey of value
        if value[subkey] instanceof HasProps and not value[subkey].serializable_in_document()
          console.log("May need to add #{key} to nonserializable_attribute_names of #{optional_parent_object?.constructor.name} because value of type #{value.constructor.name} contains a nonserializable type #{value[subkey].constructor.name} under #{subkey}")
        else
          ref_obj[subkey] = HasProps._value_to_json(subkey, value[subkey], value)
      ref_obj
    else
      value

  # Convert attributes to "shallow" JSON (values which are themselves models
  # are included as just references)
  # TODO (havocp) can this just be toJSON (from Backbone / JSON.stingify?)
  # backbone will have implemented a toJSON already that we may need to override
  # optional value_to_json is for test to override with a "deep" version to replace the
  # standard "shallow" HasProps._value_to_json
  attributes_as_json: (include_defaults=true, value_to_json=HasProps._value_to_json) ->
    attrs = {}
    fail = false
    for own key, value of @serializable_attributes()
      if include_defaults
        attrs[key] = value
      else if key of @_set_after_defaults
        attrs[key] = value
      # TODO remove serializable_in_document and this check once we aren't seeing these
      # warnings anymore
      if value instanceof HasProps and not value.serializable_in_document()
        console.log("May need to add #{key} to nonserializable_attribute_names of #{@.constructor.name} because value #{value.constructor.name} is not serializable")
        fail = true
    if fail
      return {}
    value_to_json("attributes", attrs, @)

  # this is like _value_record_references but expects to find refs
  # instead of models, and takes a doc to look up the refs in
  @_json_record_references: (doc, v, result, recurse) ->
    if v is null
      ;
    else if refs.is_ref(v)
      if v.id not of result
        model = doc.get_model_by_id(v.id)
        HasProps._value_record_references(model, result, recurse)
    else if _.isArray(v)
      for elem in v
        HasProps._json_record_references(doc, elem, result, recurse)
    else if _.isObject(v)
      for own k, elem of v
        HasProps._json_record_references(doc, elem, result, recurse)

  # add all references from 'v' to 'result', if recurse
  # is true then descend into refs, if false only
  # descend into non-refs
  @_value_record_references: (v, result, recurse) ->
    if v is null
      ;
    else if v instanceof HasProps
      if v.id not of result
        result[v.id] = v
        if recurse
          immediate = v._immediate_references()
          for obj in immediate
            HasProps._value_record_references(obj, result, true) # true=recurse
    else if _.isArray(v)
      for elem in v
        if elem instanceof HasProps and not elem.serializable_in_document()
          console.log("Array contains nonserializable item, we shouldn't traverse this property ", elem)
          throw new Error("Trying to record refs for array with nonserializable item")
        HasProps._value_record_references(elem, result, recurse)
    else if _.isObject(v)
      for own k, elem of v
        if elem instanceof HasProps and not elem.serializable_in_document()
          console.log("Dict contains nonserializable item under #{k}, we shouldn't traverse this property ", elem)
          throw new Error("Trying to record refs for dict with nonserializable item")
        HasProps._value_record_references(elem, result, recurse)

  # Get models that are immediately referenced by our properties
  # (do not recurse, do not include ourselves)
  _immediate_references: () ->
    result = {}
    attrs = @serializable_attributes()
    for key of attrs
      value = attrs[key]
      if value instanceof HasProps and not value.serializable_in_document()
          console.log("May need to add #{key} to nonserializable_attribute_names of #{@constructor.name} because value #{value.constructor.name} is not serializable")
      HasProps._value_record_references(value, result, false) # false = no recurse

    _.values(result)

  references: () ->
    references = {}
    HasProps._value_record_references(this, references, true)
    return _.values(references)

  attach_document: (doc) ->
    if @document != null
      if @document != doc
        throw new Error("models must be owned by only a single document")
      else
        @document._notify_attach(@)
    else
      @document = doc
      @document._notify_attach(@)

      for ref in @_immediate_references()
        ref.attach_document(@document)

      # TODO (bev) is there are way to get rid of this?
      for name, prop of @properties
        prop.update()

      if @_doc_attached?
        @_doc_attached()

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
    if old instanceof HasProps and not old.serializable_in_document()
      console.log("May need to add #{attr} to nonserializable_attribute_names of #{@constructor.name} because old value #{old.constructor.name} is not serializable")
      return

    if new_ instanceof HasProps and not new_.serializable_in_document()
      console.log("May need to add #{attr} to nonserializable_attribute_names of #{@constructor.name} because new value #{new_.constructor.name} is not serializable")
      return

    if @document != null
      new_refs = {}
      HasProps._value_record_references(new_, new_refs, false)

      old_refs = {}
      HasProps._value_record_references(old, old_refs, false)

      for new_id, new_ref of new_refs
        if new_id not of old_refs
          new_ref.attach_document(@document)

      for old_id, old_ref of old_refs
        if old_id not of new_refs
          old_ref.detach_document()

      @document._notify_change(@, attr, old, new_)

module.exports = HasProps
