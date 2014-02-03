
define [
  "underscore",
  "backbone",
  "require",
  "./base"
  "./safebind",
], (_, Backbone, require, base, safebind) ->
  class HasProperties extends Backbone.Model
    # Our property system
    # we support python style computed properties, with getters
    # as well as setters. We also support caching of these properties,
    # and notifications of property. We also support weak references
    # to other models using the reference system described above.

    destroy: (options)->
      #calls super, also unbinds any events bound by safebind
      super(options)
      if _.has(this, 'eventers')
        for own target, val of @eventers
          val.off(null, null, this)

    isNew: () ->
      return false

    initialize: (attrs, options) ->
      # auto generates ids if we need to, calls deferred initialize if we have
      # not done so already.   sets up datastructures for computed properties
      if not attrs
         attrs = {}
      if not options
        options = {}
      super(attrs, options)

      #cheap memoization, requirejs doesn't seem to do it
      @_base = false
      @properties = {}
      @property_cache = {}
      if not _.has(attrs, @idAttribute)
        this.id = _.uniqueId(this.type)
        this.attributes[@idAttribute] = this.id
      _.defer(() =>
        if not @inited
          @dinitialize(attrs, options))

    dinitialize: (attrs, options) ->
      # deferred initialization - this is important so we can separate object
      # creation from object initialization.  We need this if we receive a group
      # of objects, that need to bind events to each other.  Then we create them all
      # first, and then call deferred intialization so they can setup dependencies
      # on each other
      @inited = true

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
          @properties[key]['setter'].call(this, val)
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
        safebind(this, object, "change:" + fld,
            prop_spec['callbacks']['changedep'])

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
        safebind(this, this, "changedep:" + prop_name,
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

    get: (prop_name) ->
      # ### method: HasProperties::get
      # overrides backbone get.  checks properties,
      # calls getter, or goes to cache
      # if necessary.  If it's not a property, then just call super

      if _.has(@properties, prop_name)
        prop_spec = @properties[prop_name]
        if prop_spec.use_cache and @has_cache(prop_name)
          return @property_cache[prop_name]
        else
          getter = prop_spec.getter
          computed = getter.apply(this)
          if @properties[prop_name].use_cache
            @add_cache(prop_name, computed)
          return computed
      else
        return super(prop_name)

    ref: ->
      # ### method: HasProperties::ref
      #generates a reference to this model
      'type': this.type
      'id': this.id

    resolve_ref: (ref) =>
      # ### method: HasProperties::resolve_ref
      #converts a reference into an object
      #also works vectorized now
      if _.isArray(ref)
        return _.map(ref, @resolve_ref)
      if not ref
        console.log('ERROR, null reference')
      #this way we can reference ourselves
      # even though we are not in any collection yet
      if ref['type'] == this.type and ref['id'] == this.id
        return this
      else
        return @base().Collections(ref['type']).get(ref['id'])

    get_obj: (ref_name) =>
      # ### method: HasProperties::get_obj
      #convenience function, gets the backbone attribute ref_name, which is assumed
      #to be a reference, then resolves the reference and returns the model

      ref = @get(ref_name)
      if ref
        return @resolve_ref(ref)

    base: ()->
      if not @_base
        @_base = require('./base')
      return @_base

    url: () ->
      # ### method HasProperties::url
      #model where our API processes this model

      url = @base().Config.prefix + "/bokeh/bb/" + @get('doc') + "/" + @type + "/"
      if (@isNew())
        return url
      return url + @get('id') + "/"


    sync: (method, model, options) ->
      # this should be fixed via monkey patching when extended by an
      # environment that implements the model backend,
      # to enable normal beaviour, add this line
      #
      # HasProperties.prototype.sync = Backbone.sync
      return options.success(model, null, {})

    defaults: () ->
      return {}

    rpc: (funcname, args, kwargs) =>
      prefix = base.Config.prefix
      docid = @get('doc')
      id = @get('id')
      type = @type
      url = "#{prefix}/bokeh/bb/rpc/#{docid}/#{type}/#{id}/#{funcname}/"
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
