

Config = {
    prefix : ''
  }

# ## function : safebind
safebind = (binder, target, event, callback) ->
  # safebind, binder binds to an event on target, which triggers callback.
  # Safe means that when the binder is destroyed, all callbacks are unbound.
  # callbacks are bound and evaluated in the context of binder.  Now that
  # backbone 0.99 is out, with listenTo and stopListening functions, which
  # manage event lifecycles, we probably don't need this function
  #
  # #### Parameters
  #
  # * binder : backbone model or view - when this is destroyed or removed,
  #   the callback
  #   unbound
  # * target : object triggering the event we want to bind to
  # * event : string, name of the event
  # * callback : callback for the event
  #
  # #### Returns
  #
  # * null
  #
  # stores objects we are binding events on, so that if we go away,
  # we can unbind all our events
  # currently, we require that the context being used is the binders context
  # this is because we currently unbind on a per context basis.  this can
  # be changed later if we need it
  if not _.has(binder, 'eventers')
    binder['eventers'] = {}
  try
    binder['eventers'][target.id] = target
  catch error

  # also need to bind destroy to remove obj from eventers.
  # no special logic needed to manage this life cycle, because
  # we will already unbind all listeners on target when binder goes away
  if target?
    target.on(event, callback, binder)
    target.on('destroy remove',
      () =>
        delete binder['eventers'][target]
      ,
        binder)
   else
    debugger;
    console.log("error with binder", binder, event)
  return null

# backbone note - we're sort of using defaults in the code to tell the user
# what attributes are expected, so please specify defaults for
# all attributes you plan on usign

# Reference System
# we enable models to refer to other models using the following json
#
#     type : 'Plot'
#     id : '239009203923'
#
# The type field tell us that
# Collections.Plot is the collection which has the model id
# '239009203923'.

# ###function : load models.
load_models = (modelspecs)->
  # First we identify which model jsons correspond to new models,
  # and which ones are updates.
  # For new models we instantiate the models, add them
  # to their collections and call dinitialize.
  # For existing models we update
  # their attributes
  # ####Parameters
  # * modelspecs : list of models in json form, looking like this
  #
  #         type : 'Plot'
  #         id : '2390-23-23'
  #         attributes :
  #           firstattr : 'one'
  #           name : 'myplot'
  #           s : []
  #
  #   type is the key of the in collections for this model
  #   id is the id of this model
  #   attributes are the attributes of the model

  # ####Returns
  #
  # * null

  newspecs = []
  oldspecs = []

  # split out old and new models into arrays of
  # `[[collection, attributes], [collection, attributes]]`

  for model in modelspecs
    coll = Collections(model['type'])
    attrs = model['attributes']
    if coll and  coll.get(attrs['id'])
      oldspecs.push([coll, attrs])
    else
      newspecs.push([coll, attrs])

  # add new objects to collections silently
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.add(attrs, {'silent' : true})

  # call deferred initialize on all new models
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.get(attrs['id']).dinitialize(attrs)

  # trigger add events on all new models
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      model = coll.get(attrs.id)
      model.trigger('add', model, coll, {});

  # set attributes on old models silently
  for coll_attrs in oldspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.get(attrs['id']).set(attrs)
  return null


# ###class : WebsocketWrapper
# wraps websockets, provides a @connected promise, which
# you can wait on before sending subscription messages
# also triggers "msg:topic" events, with an arg of the msg
# data.  We assume that msg data over this websocket
# channel are sent in "topic:data" form, where data can
# be any arbitrary string. note that since topic is prefixed with :,
# in practice a message looks like bokehplot:docid:jsondata
class WebSocketWrapper
  _.extend(@prototype, Backbone.Events)
  # ### method :
  constructor : (ws_conn_string) ->
    @auth = {}
    @ws_conn_string = ws_conn_string
    @_connected = $.Deferred()
    @connected = @_connected.promise()
    if window.MozWebSocket
      @s = new MozWebSocket(ws_conn_string)
    else
      @s = new WebSocket(ws_conn_string)
    # catch error
    #   console.log(ws_conn_string, error)

    @s.onopen = () =>
      @_connected.resolve()
    @s.onmessage = @onmessage

  onmessage : (msg) =>
    data = msg.data
    index = data.indexOf(":") #first colon marks topic namespace
    index = data.indexOf(":", index + 1) #second colon marks the topic
    topic = data.substring(0, index)
    data = data.substring(index + 1)
    @trigger("msg:" + topic, data)
    return null

  send : (msg) ->
    $.when(@connected).done(() =>
      @s.send(msg)
    )

  subscribe : (topic, auth) ->
    @auth[topic] = auth
    msg = JSON.stringify(
      {msgtype : 'subscribe', topic : topic, auth : auth}
    )
    @send(msg)

# ###function : submodels

submodels = (wswrapper, topic, apikey) ->
  # subscribes and listens for model changes on a WebSocketWrapper
  # ##### Parameters
  # * wswrapper : WebSocketWrapper
  # * topic : topic to listen on (send to the server on connect)
  # * apikey : apikey for server
  wswrapper.subscribe(topic, apikey)
  wswrapper.on("msg:" + topic, (msg) ->
    msgobj = JSON.parse(msg)
    if msgobj['msgtype'] == 'modelpush'
      load_models(msgobj['modelspecs'])
    else if msgobj['msgtype'] == 'modeldel'
      for ref in msgobj['modelspecs']
        model = resolve_ref(ref['type'], ref['id'])
        if model
          model.destroy({'local' : true})
    else if msgobj['msgtype'] == 'status' and
      msgobj['status'][0] == 'subscribesuccess'
        clientid = msgobj['status'][2]
        Config.clientid = clientid
        $.ajaxSetup({'headers' : {'Continuum-Clientid' : clientid}})
    else
      console.log(msgobj)
    return null
  )

# ###class : HasProperties
class HasProperties extends Backbone.Model
  # Our property system
  # we support python style computed properties, with getters
  # as well as setters. We also support caching of these properties,
  # and notifications of property. We also support weak references
  # to other models using the reference system described above.

  destroy : (options)->
    #calls super, also unbinds any events bound by safebind
    super(options)
    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)

  isNew : () ->
    return false

  initialize : (attrs, options) ->
    # auto generates ids if we need to, calls deferred initialize if we have
    # not done so already.   sets up datastructures for computed properties
    if not attrs
       attrs = {}
    if not options
      options = {}
    super(attrs, options)
    @properties = {}
    @property_cache = {}
    if not _.has(attrs, @idAttribute)
      this.id = _.uniqueId(this.type)
      this.attributes[@idAttribute] = this.id
    _.defer(() =>
      if not @inited
        @dinitialize(attrs, options))

  dinitialize : (attrs, options) ->
    # deferred initialization - this is important so we can separate object
    # creation from object initialization.  We need this if we receive a group
    # of objects, that need to bind events to each other.  Then we create them all
    # first, and then call deferred intialization so they can setup dependencies
    # on each other
    @inited = true

  set_obj : (key, value, options) ->
    if _.isObject(key) or key == null
      attrs = key
      options = value
    else
      attrs = {}
      attrs[key] = value
    for own key, val of attrs
      attrs[key] = @convert_to_ref(val)
    return @set(attrs, options)

  set : (key, value, options) ->
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
    for key in toremove
      delete attrs[key]
    if not _.isEmpty(attrs)
      super(attrs, options)

  convert_to_ref : (value) =>
    # converts value into a refrence if necessary
    # works vectorized
    if _.isArray(value)
      return _.map(value, @convert_to_ref)
    else
      if value instanceof HasProperties
        return value.ref()

  # ### method : HasProperties::add_dependencies
  add_dependencies:  (prop_name, object, fields) ->
    # * prop_name - name of property
    # * object - object on which dependencies reside
    # * fields - attributes on that object
    # at some future date, we should support a third arg, events
    if not _.isArray(fields)
      fields = [fields]
    prop_spec = @properties[prop_name]
    prop_spec.dependencies = prop_spec.dependencies.concat(
      obj : object
      fields : fields
    )
    # bind depdencies to change dep callback
    for fld in fields
      safebind(this, object, "change:" + fld,
          prop_spec['callbacks']['changedep'])

  # ### method : HasProperties::register_setter
  register_setter : (prop_name, setter) ->
    prop_spec = @properties[prop_name]
    prop_spec.setter = setter

  # ### method : HasProperties::register_property
  register_property :  (prop_name, getter, use_cache) ->
      # register a computed property. Setters, and dependencies
      # can be added with `@add_dependencies` and `@register_setter`
      # #### Parameters
      # * prop_name : name of property
      # * getter : function, calculates computed value, takes no arguments
      # * use_cache : whether to cache or not
      # #### Returns
      # * prop_spec : specification of the property, with the getter,
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
        'getter' : getter,
        'dependencies' : [],
        'use_cache' : use_cache
        'setter' : null
        'callbacks':
          changedep : changedep
          propchange : propchange
      @properties[prop_name] = prop_spec
      # bind propchange callback to change dep event
      safebind(this, this, "changedep:" + prop_name,
        prop_spec['callbacks']['propchange'])
      return prop_spec

  remove_property : (prop_name) ->
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

  has_cache : (prop_name) ->
    return _.has(@property_cache, prop_name)

  add_cache : (prop_name, val) ->
    @property_cache[prop_name] = val

  clear_cache : (prop_name, val) ->
    delete @property_cache[prop_name]

  get_cache : (prop_name) ->
    return @property_cache[prop_name]

  get : (prop_name) ->
    # ### method : HasProperties::get
    # overrides backbone get.  checks properties,
    # calls getter, or goes to cache
    # if necessary.  If it's not a property, then just call super
    if _.has(@properties, prop_name)
      prop_spec = @properties[prop_name]
      if prop_spec.use_cache and @has_cache(prop_name)
        return @property_cache[prop_name]
      else
        getter = prop_spec.getter
        computed = getter.apply(this, this)
        if @properties[prop_name].use_cache
          @add_cache(prop_name, computed)
        return computed
    else
      return super(prop_name)

  ref : ->
    # ### method : HasProperties::ref
    #generates a reference to this model
    'type' : this.type
    'id' : this.id

  resolve_ref : (ref) =>
    # ### method : HasProperties::resolve_ref
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
      return Collections(ref['type']).get(ref['id'])

  get_obj : (ref_name) =>
    # ### method : HasProperties::get_obj
    #convenience function, gets the backbone attribute ref_name, which is assumed
    #to be a reference, then resolves the reference and returns the model

    ref = @get(ref_name)
    if ref
      return @resolve_ref(ref)

  url : () ->
    # ### method HasProperties::url
    #model where our API processes this model

    base = Config.prefix + "/bokeh/bb/" + @get('doc') + "/" + @type + "/"
    if (@isNew())
      return base
    return base + @get('id') + "/"


  sync : (method, model, options) ->
    # this should be fixed via monkey patching when extended by an
    # environment that implements the model backend,
    # to enable normal beaviour, add this line
    #
    # HasProperties.prototype.sync = Backbone.sync
    return options.success(model, null, {})

  defaults : {}

  rpc : (funcname, args, kwargs) =>
    prefix = Config.prefix
    docid = @get('doc')
    id = @get('id')
    type = @type
    url = "#{prefix}/bokeh/bb/rpc/#{docid}/#{type}/#{id}/#{funcname}/"
    data =
      args : args
      kwargs : kwargs
    resp = $.ajax(
      type : 'POST'
      url: url,
      data : JSON.stringify(data)
      contentType : 'application/json'
      xhrFields :
        withCredentials : true
    )
    return resp


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
  get_fallback : (attr) ->
    if (@get_obj('parent') and
        _.indexOf(@get_obj('parent').parent_properties, attr) >= 0 and
        not _.isUndefined(@get_obj('parent').get(attr)))
      return @get_obj('parent').get(attr)
    else
      retval = @display_defaults[attr]
      return retval

  get : (attr) ->
    ## no fallback for 'parent'
    normalval = super(attr)
    if not _.isUndefined(normalval)
      return normalval
    else if not (attr == 'parent')
      return @get_fallback(attr)

  display_defaults : {}


build_views = (view_storage, view_models, options, view_types=[]) ->
  # ## function : build_views
  # convenience function for creating a bunch of views from a spec
  # and storing them in a dictionary keyed off of model id.
  # views are automatically passed the model that they represent

  # ####Parameters
  # * mainmodel : model which is constructing the views, this is used to resolve
  #   specs into other model objects
  # * view_storage : where you want the new views stored.  this is a dictionary
  #   views will be keyed by the id of the underlying model
  # * view_specs : list of view specs.  view specs are continuum references, with
  #   a typename and an id.  you can also pass options you want to feed into
  #   the views constructor here, as an 'options' field in the dict
  # * options : any additional option to be used in the construction of views
  # * view_option : array, optional view specific options passed in to the construction of the view
  "use strict";
  created_views = []
  #debugger
  try
    newmodels = _.filter(view_models, (x) -> return not _.has(view_storage, x.id))
  catch error
    debugger
    console.log(error)
    throw error
  for model, i_model in newmodels
    view_specific_option = _.extend({}, options, {'model' : model})
    try
      if i_model < view_types.length
        view_storage[model.id] = new view_types[i_model](view_specific_option)
      else
        view_storage[model.id] = new model.default_view(view_specific_option)
    catch error
      console.log("error on model of", model, error)
      throw error
    created_views.push(view_storage[model.id])
  to_remove = _.difference(_.keys(view_storage), _.pluck(view_models, 'id'))
  for key in to_remove
    view_storage[key].remove()
    delete view_storage[key]
  return created_views


locations =
  AnnotationRenderer: ['./renderers/annotation_renderer', 'annotationrenderers']
  GlyphRenderer:      ['./renderers/glyph_renderer',      'glyphrenderers']
  GuideRenderer:      ['./renderers/guide_renderer',      'guiderenderers']

  PanTool:         ['./tools/pan_tool',          'pantools']
  ZoomTool:        ['./tools/zoom_tool',         'zoomtools']
  ResizeTool:      ['./tools/resize_tool',       'resizetools']
  SelectionTool:   ['./tools/select_tool',       'selectiontools']
  DataRangeBoxSelectionTool:   ['./tools/select_tool',
    'datarangeboxselectiontools']
  PreviewSaveTool: ['./tools/preview_save_tool', 'previewsavetools']
  EmbedTool:       ['./tools/embed_tool', 'embedtools']
  BoxSelectionOverlay: ['./overlays/boxselectionoverlay',
    'boxselectionoverlays']

  ObjectArrayDataSource: ['./common/datasource', 'objectarraydatasources']
  ColumnDataSource:      ['./common/datasource', 'columndatasources']

  Range1d:         ['./common/ranges', 'range1ds']
  DataRange1d:     ['./common/ranges', 'datarange1ds']
  DataFactorRange: ['./common/ranges', 'datafactorranges']

  Plot:              ['./common/plot',         'plots']
  GMapPlot:          ['./common/gmap_plot',    'gmapplots']
  GridPlot:          ['./common/grid_plot',    'gridplots']
  CDXPlotContext:    ['./common/plot_context', 'plotcontexts']
  PlotContext:       ['./common/plot_context', 'plotcontexts']
  PlotList:       ['./common/plot_context', 'plotlists']

  DataTable: ['./widgets/table', 'datatables']

  IPythonRemoteData: ['./pandas/pandas', 'ipythonremotedatas']
  PandasPivotTable: ['./pandas/pandas', 'pandaspivottables']
  PandasPlotSource: ['./pandas/pandas', 'pandasplotsources']

  LinearAxis: ['./renderers/guide/linear_axis', 'linearaxes']
  DatetimeAxis: ['./renderers/guide/datetime_axis', 'datetimeaxes']
  Grid: ['./renderers/guide/grid', 'grids']
  Legend: ['./renderers/annotation_renderer', 'annotationrenderers']

  DataSlider : ['./tools/slider', 'datasliders']
exports.locations = locations
mod_cache = {}
Collections = (typename) ->
  if not locations[typename]
    throw "./base: Unknown Collection #{typename}"
  [modulename, collection] = locations[typename]
  if not mod_cache[modulename]?
    console.log("calling require", modulename)
    mod_cache[modulename] = require(modulename)
  return mod_cache[modulename][collection]

Collections.bulksave = (models) ->
  ##FIXME:hack
  doc = models[0].get('doc')
  jsondata = ({type : m.type, attributes :_.clone(m.attributes)} for m in models)
  jsondata = JSON.stringify(jsondata)
  url = Config.prefix + "/bokeh/bb/" + doc + "/bulkupsert"
  xhr = $.ajax(
    type : 'POST'
    url : url
    contentType: "application/json"
    data : jsondata
    header :
      client : "javascript"
  )
  xhr.done((data) ->
    load_models(data.modelspecs)
  )
  return xhr

exports.Collections = Collections
exports.Config = Config
exports.safebind = safebind
exports.load_models = load_models
exports.WebSocketWrapper = WebSocketWrapper
exports.submodels = submodels
exports.HasProperties = HasProperties
exports.HasParent = HasParent
exports.build_views = build_views
