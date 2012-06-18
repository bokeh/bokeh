# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum

# we create a dictionary of collections, for all types that we know,
# we use these when models are pushed down from the server
class Continuum.Collection extends Backbone.Collection
  # at some point, I thought we needed to override create... we don't anymore...
  # can switch back to Backbone.Collection later
Collections = {}
Continuum.Collections = Collections
Continuum.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key


# continuum refrence system
#   reference : {'type' : type name, 'id' : object id}
#   each class has a collections class var, and type class var.
#   references are resolved by looking up collections[type]
#   to get a collection
#   and then retrieving the correct id.  The one exception is that an object
#   can resolve a reference to itself even if it has not yet been added to
#   any collections.



# backbone note - we're sort of using defaults in the code to tell the user
# what attributes are expected, so please specify defaults for
# all attributes you plan on usign


Continuum.load_models = (modelspecs)->
  # ##function : load models.
  # First we identify which model specs correspond to new models,
  # and which ones are updates.  For new models we instantiate the models, add them
  # to their collections and call dinitialize.  For existing models we update
  # their attributes

  # ####Parameters
  # * modelspecs : list of models in json form, looking like this

  #         type : 'Plot'
  #         collections : ['Continuum', 'Collections']
  #         id : '2390-23-23'
  #         attributes:
  #         name : 'myplot'
  #         renderers : []

  #   collections tells us where to find the dictionary of collections used to
  #   construct the model
  #   type is the key of the in collections for this model
  #   id is the id of this model
  #   attributes are the attributes of the model

  # ####Returns
  #
  # * null

  newspecs = []
  oldspecs = []
  for model in modelspecs
    coll = get_collections(model['collections'])[model['type']]
    attrs = model['attributes']
    if coll.get(attrs['id'])
      oldspecs.push([coll, attrs])
    else
      newspecs.push([coll, attrs])
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    coll.add(attrs)
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    coll.get(attrs['id']).dinitialize(attrs)
  for coll_attrs in oldspecs
    [coll, attrs] = coll_attrs
    coll.get(attrs['id']).set(attrs, {'local' : true})
  return null

Continuum.submodels = (ws_conn_string, topic) ->
  # ##function : Continuum.submodels
  # creates a websocket which subscribes and listens for model changes
  # #####Parameters

  # * ws_conn_string : path of the web socket to subscribe
  # * topic : topic to listen on (send to the server on connect)

  # #####Returns
  #
  # * the websocket

  try
    s = new WebSocket(ws_conn_string)
  catch error
    s = new MozWebSocket(ws_conn_string)
  s.onopen = () ->
    s.send(JSON.stringify({msgtype : 'subscribe', topic : topic}))
  s.onmessage = (msg) ->
    msgobj = JSON.parse(msg.data)
    if msgobj['msgtype'] == 'modelpush'
      Continuum.load_models(msgobj['modelspecs'])
    else if msgobj['msgtype'] == 'modeldel'
      for ref in msgobj['modelspecs']
        model = Continuum.resolve_ref(ref['collections'], ref['type'], ref['id'])
        if model
          model.destroy({'local' : true})
    else if msgobj['msgtype'] == 'status' and
      msgobj['status'][0] == 'subscribesuccess'
        clientid = msgobj['status'][2]
        Continuum.clientid = clientid
        $.ajaxSetup({'headers' : {'Continuum-Clientid' : clientid}})
    return null
  return s

build_views = (mainmodel, view_storage, view_specs,
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

  created_views = []
  valid_viewmodels = {}
  for spec in view_specs
    valid_viewmodels[spec.id] = true

  for spec in view_specs
    if view_storage[spec.id]
      continue
    model = mainmodel.resolve_ref(spec)
    options = _.extend({}, spec.options, options, {'model' : model})
    view_storage[model.id] = new model.default_view(options)
    created_views.push(view_storage[model.id])
  for own key, value of view_storage
    if not valid_viewmodels[key]
      value.remove()
      delete view_storage[key]
  return created_views

Continuum.build_views = build_views

#garbage logging experiment that I should remove
window.logger = new Backbone.Model()
window.logger.on('all',
  ()->
    msg = 'LOGGER:' + JSON.stringify(arguments[1][0])
    console.log(msg))
Continuum.logger = window.logger
logger = Continuum.logger
logger.log = () ->
  logger.trigger('LOG', arguments)



get_collections = (names) ->
  # ## function : get_collections

  # finds a group of collections, at the location specified by names

  # ####Parameters

  # * names : list of strings - we start at the global name spaces and descend
  #   through each string.  the last value should refer to the group of
  #   collections you want

  # ####Returns

  # * collections

  last = window
  for n in names
    last = last[n]
  return last

resolve_ref = (collections, type, id) ->
  # ##funcion : resolve_ref
  # Takes a group of collections, type and id, and returns the backbone model
  # which corresponds
  # ####Parameters

  # * collections : group of collections (as a dict),
  #   the collection for type should
  #   be present here.  Alternatively, one can specify this as an array of strings,
  #   in which case we descend through the global namespace looking for this, using
  #   get_collections.
  # * type : type of the object
  # * id : id of the object

  # ####Returns

  # * backbone model

  if _.isArray(collections)
    collections = get_collections(collections)
  return collections[type].get(id)
Continuum.resolve_ref = resolve_ref
Continuum.get_collections = get_collections

safebind = (binder, target, event, callback) ->
  # ##function : safebind
  # safebind, binder binds to an event on target, which triggers callback.
  # Safe means that when the binder is destroyed, all callbacks are unbound.
  # callbacks are bound and evaluated in the context of binder

  # ####Parameters

  # * binder : some backbone model - when this is destroyed, the callback will be
  #   unbound
  # * target : object triggering the event we want to bind to
  # * event : string, name of the event
  # * callback : callback for the event

  # ####Returns

  # * null

  # stores objects we are binding events on, so that if we go away,
  # we can unbind all our events
  # currently, we require that the context being used is the binders context
  # this is because we currently unbind on a per context basis.  this can
  # be changed later if we need it
  if not _.has(binder, 'eventers')
    binder['eventers'] = {}
  binder['eventers'][target.id] = target
  target.on(event, callback, binder)
  # also need to bind destroy to remove obj from eventers.
  # no special logic needed to manage this life cycle, because
  # we will already unbind all listeners on target when binder goes away
  target.on('destroy remove',
      () =>
        delete binder['eventers'][target]
    ,
      binder)
  return null

class HasProperties extends Backbone.Model
# ##class : HasProperties
#   Our property system
#   we support python style computed properties, with getters as well as setters.
#   we also support caching of these properties, and notifications of property
#   changes
#
#   @register_property(name, dependencies, getter, use_cache, setter)

  collections : Collections
  destroy : (options)->
    #calls super, also unbinds any events bound by safebind
    super(options)
    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)

  isNew : () ->
    return not this.get('created')

  initialize : (attrs, options) ->
    # auto generates ids if we need to, calls deferred initialize if we have
    # not done so already.   sets up datastructures for computed properties
    super(attrs, options)
    @properties = {}
    @property_cache = {}
    if not _.has(attrs, 'id')
      this.id = _.uniqueId(this.type)
      this.attributes['id'] = this.id
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

  structure_dependencies : (dependencies) ->
    # ### method : HasProperties::structure_dependencies
    # ####Parameters
    # * dependencies : our structure for specing out
    #   dependencies of properties look like this
    #   `[{'ref' : {'type' : type, 'id' : id}, 'fields : ['a', 'b', 'c']}]`
    #   for convenience, we allow people to refer to this objects attributes
    #   as strings, only using the formal structure for other objets attributes.
    #   this function converts everything into that formal structure.
    #   SO this :

    #       ['myprop1, 'myprop2',
    #       {'ref' : {'type' : 'otherobj', 'id' : 'otherobj'},
    #        'fields' : 'otherfield'}]

    #   is equivalent to :

    #       [{'ref' : {'type' : 'mytype', 'id' : 'myid'},
    #       'fields' : ['myprop1, 'myprop2'],
    #       {'ref' : {'type' : 'otherobj', 'id' : 'otherobj'}
    #       'fields' : 'otherfield'}]
    # ####Returns
    # * deps : the verbose form of dependencies where references are explicitly
    # identified
    other_deps = (x for x in dependencies when _.isObject(x))
    local_deps = (x for x in dependencies when not _.isObject(x))
    if local_deps.length > 0
      deps = [{'ref' : this.ref(), 'fields' : local_deps}]
      deps = deps.concat(other_deps)
    else
      deps = other_deps
    return deps

  register_property : \
    (prop_name, dependencies, getter, use_cache, setter) ->
      # ###method : HasProperties::register_property
      # register a computed property
      # ####Parameters

      # * prop_name : name of property
      # * dependencies : something like this
      #   ['myprop1, 'myprop2',
      #     {'ref' : {'type' : 'otherobj', 'id' : 'otherobj'}
      #     'fields' : 'otherfield'}]
      # * getter : function, calculates computed value, takes no arguments
      # * use_cache : whether to cache or not
      # * setter : function, takes new value as parametercalled on set.
      # can be null
      # #### Returns
      # * prop_spec : specification of the property, with the getter,
      # setter, dependenices, and callbacks associated with the prop
      if _.has(@properties, prop_name)
        @remove_property(prop_name)
      dependencies = @structure_dependencies(dependencies)

      # we store a prop_spec, which has the getter, setter, dependencies
      # we also store the callbacks used to implement the computed property,
      # we do this so we can remove them later if the property is removed

      prop_spec=
        'getter' : getter,
        'dependencies' : dependencies,
        'use_cache' : use_cache
        'setter' : setter
        'callbacks':
          # we call this changedep call back when any of our dependecies
          # are changed
          'changedep' : =>
            @trigger('changedep:' + prop_name)
          # we call propchange when we receive a changedep event for this prop
          'propchange' : =>
            firechange = true
            if prop_spec['use_cache']
              old_val = @get_cache(prop_name)
              @clear_cache(prop_name)
              new_val = @get(prop_name)
              firechange = new_val != old_val
            if firechange
              @trigger('change:' + prop_name, this, @get(prop_name))
              @trigger('change', this)
      @properties[prop_name] = prop_spec
      # bind depdencies to change dep callback
      for dep in dependencies
        obj = @resolve_ref(dep['ref'])
        for fld in dep['fields']
          safebind(this, obj, "change:" + fld, prop_spec['callbacks']['changedep'])
      # bind propchange callback to change dep event
      safebind(this, this, "changedep:" + prop_name,
        prop_spec['callbacks']['propchange'])
      return prop_spec

  remove_property : (prop_name) ->
    #removes the property, unbinding all associated callbacks that implemented it
    prop_spec = @properties[prop_name]
    dependencies = prop_spec.dependencies
    for dep in dependencies
      obj = @resolve_ref(dep['ref'])
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
    # overrides backbone get.  checks properties, calls getter, or goes to cache
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

  resolve_ref : (ref) ->
    # ### method : HasProperties::resolve_ref
    #converts a reference into an object
    if not ref
      console.log('ERROR, null reference')
    #this way we can reference ourselves
    # even though we are not in any collection yet
    if ref['type'] == this.type and ref['id'] == this.id
      return this
    else
      return resolve_ref(@collections, ref['type'], ref['id'])

  get_ref : (ref_name) ->
    # ### method : HasProperties::get_ref
    #convenience function, gets the backbone attribute ref_name, which is assumed
    #to be a reference, then resolves the reference and returns the model

    ref = @get(ref_name)
    if ref
      return @resolve_ref(ref)

  url : () ->
    # ### method HasProperties::url
    #model where our API processes this model

    base = "/bb/" + window.topic + "/" + @type + "/"
    if (@isNew())
      return base
    return base + @get('id')

  sync : (method, model, options) ->
    # override sync, so that if we pass in a 'local' option,
    # we don't involve the server.  This is necessary, ex.  Object is created on
    # the server, pushed down.  you want to create it locally, but you don't want
    # the client to try to make an API call to create this on the server.

    if options.local
      return options.success(model)
    else
      return Backbone.sync(method, model, options)
  defaults :


class ContinuumView extends Backbone.View
  initialize : (options) ->
    #autogenerates id
    if not _.has(options, 'id')
      this.id = _.uniqueId('ContinuumView')
  remove : ->
    #handles lifecycle of events bound by safebind

    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)
    @trigger('remove')
    super()

  tag_selector : (tag, id) ->
    # jquery style selector given a string, and an id.
    # We name DOM nodes using this convention
    # <div id='name-2342342'>hugo</div>

    return "#" + @tag_id(tag, id)

  tag_id : (tag, id) ->
    # convention for naming our nodes, tag-id. if ID is not specified,
    # we use the id of the current view.

    if not id
      id = this.id
    tag + "-" + id

  tag_el : (tag, id) ->
    # returns jquery node matching this tag/id combo

    @$el.find("#" + this.tag_id(tag, id))
  tag_d3 : (tag, id) ->
    #returns d3 node matching this tag/id combo.  null if it does not exist

    val = d3.select(this.el).select("#" + this.tag_id(tag, id))
    if val[0][0] == null
      return null
    else
      return val
  mget : ()->
    # convenience function, calls get on the associated model

    return @model.get.apply(@model, arguments)

  mset : ()->
    # convenience function, calls set on the associated model

    return @model.set.apply(@model, arguments)

  mget_ref : (fld) ->
    # convenience function, calls get_ref on the associated model

    return @model.get_ref(fld)

  add_dialog : ->
    # wraps a dialog window around this view.  This function assumes that the
    # underlying model is a Component, so our OO hierarchy may be a bit leaky here.

    position = () =>
      @$el.dialog('widget').css({
        'top' : @model.position_y() + "px",
        'left' : @model.position_x() + "px"
      })
    @$el.dialog(
      width : @mget('outerwidth') + 50,
      maxHeight : $(window).height(),
      close :  () =>
        @remove()
      dragStop : (event, ui) =>
        top = parseInt(@$el.dialog('widget').css('top').split('px')[0])
        left = parseInt(@$el.dialog('widget').css('left').split('px')[0])
        xoff = @model.reverse_position_x(left);
        yoff = @model.reverse_position_y(top);
        @model.set({'offset' : [xoff, yoff]})
        @model.save()
    )
    position()
    #for some reason setting height at init time does not work!!
    _.defer(() => @$el.dialog('option', 'height', @mget('outerheight') + 70))
    safebind(this, @model, 'change:offset', position)
    safebind(this, @model, 'change:outerwidth', ()->
      @$el.dialog('option', 'width', @mget('outerwidth')))
    safebind(this, @model, 'change:outerheight', ()->
      @$el.dialog('option', 'height', @mget('outerheight')))

class DeferredView extends ContinuumView
  initialize : (options) ->
    @deferred_parent = options['deferred_parent']
    @request_render()
    super(options)

  render : () ->
    super()
    @_dirty = false
    super()

  request_render : () ->
    @_dirty = true

  render_deferred_components : (force) ->
    if force or @_dirty
      @render()

class DeferredParent extends DeferredView
  initialize : (options) ->
    super(options)
    if @mget('render_loop')
      console.log('loop')
      _.defer(() => @render_loop())
    safebind(this, @model, 'change:render_loop',
        () =>
          if @mget('render_loop') and not @looping
            @render_loop()
    )

  render_loop : () ->
    @looping = true
    @render_deferred_components()
    if not @removed and @mget('render_loop')
      setTimeout((() => @render_loop()), 100)
    else
      @looping = false

  remove : () ->
    super()
    @removed = true


Continuum.DeferredView = DeferredView
Continuum.DeferredParent = DeferredParent


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
    if (@get_ref('parent') and
        _.indexOf(@get_ref('parent').parent_properties, attr) >= 0 and
        not _.isUndefined(@get_ref('parent').get(attr)))
      return @get_ref('parent').get(attr)
    else
      retval = @display_defaults[attr]
      # this is ugly, we should take this out and not support object specs
      # in defaults
      if _.isObject(retval) and _.has(retval, 'type')
        attrs = if _.has(retval, 'attrs') then retval['attrs'] else {}
        retval =  @collections[retval['type']].create(attrs).ref()
        @set(attr, retval)
        @save()
      return retval

  get : (attr) ->
    ## no fallback for 'parent'
    normalval = super(attr)
    if not _.isUndefined(normalval)
      return normalval
    else if not (attr == 'parent')
      return @get_fallback(attr)

  display_defaults : {}


class Component extends HasParent
  # component class, has height, width, outerheight, outerwidth, and offsets.
  # components understand positioning themselves within other components, as well
  # as positioning any children that are inside them

  collections : Collections
  position_object_x : (offset, container_width, object_width) ->
    return offset
  position_object_y : (offset, container_height, object_height) ->
    return container_height - object_height - offset
  #transform our coordinate space to the underlying device (svg)
  xpos : (x) ->
    return x
  ypos : (y) ->
    return @get('height') - y

  #transform underlying device (svg) to our coordinate space
  rxpos : (x) ->
    return x

  rypos : (y) ->
    return @get('height') - y

  #compute a child components position in the underlying device
  position_child_x : (size, offset) ->
    return  @xpos(offset)
  position_child_y : (size, offset) ->
    return @ypos(offset) - size

  #reverse a child components position to the equivalent offset
  child_position_to_offset_x : (child, position) ->
    offset = position
    return @rxpos(offset)

  child_position_to_offset_y : (child, position) ->
    offset = position + child.get('outerheight')
    return @rypos(offset)

  #compute your position in the underlying device
  position_x : ->
    parent = @get_ref('parent')
    if not parent
      return 0
    return parent.position_child_x(this.get('outerwidth'), @get('offset')[0])

  position_y : ->
    parent = @get_ref('parent')
    if not parent
      return 0
    val = parent.position_child_y(this.get('outerheight'), @get('offset')[1])
    return val

  reverse_position_x : (input) ->
    parent = @get_ref('parent')
    if not parent
      return 0
    return parent.child_position_to_offset_x(this, input)

  reverse_position_y : (input) ->
    parent = @get_ref('parent')
    if not parent
      return 0
    return parent.child_position_to_offset_y(this, input)

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('outerwidth', ['width', 'border_space'],
      () -> @get('width') + 2 * @get('border_space')
      false)
    @register_property('outerheight', ['height', 'border_space'],
      () -> @get('height') + 2 * @get('border_space')
      false)

  defaults :
    parent : null

  display_defaults:
    width : 200
    height : 200
    position : 0
    offset : [0,0]
    border_space : 30

  default_view : null

class DataTableView extends ContinuumView
  initialize : (options) ->
    super(options)
    @render()
    safebind(this, @model, 'change', @render)


  render : () ->
    table_template = """
    <div class='table' id='{{ tableid }}'>
    </div>

    """
    header_template = """
      <div class='headerrow' id = '{{headerrowid}}'>
      </div>
    """
    header_column = """
      <div class='header'>
        {{column_name}}
      </div>
    """

    row_template = """
      <div class='datarow'>
      </div>
    """
    datacell_template = """
      <div class='datacell'> {{ data}} </div>
    """
    header_html = _.template(header_template,
      {'headerrowid' : @tag_id('headerrow')})
    header = $(header_html)
    for colname in @mget('columns')
      html = _.template(header_column, {'column_name' : colname})
      header.append($(html))
    table = $(_.template(table_template, {'tableid' : @tag_id('table')}))
    table.append(header)
    for rowdata in @mget_ref('data_source').get('data')
      row = $(row_template)
      for colname in @mget('columns')
        datacell = $(_.template(datacell_template,
          {'data' : rowdata[colname]}))
        row.append(datacell)
        table.append(row)
    @$el.html(table)
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()

class DataTable extends Component
  type : 'DataTable'
  default_view : DataTableView
  defaults :
    data_source : null
    columns : []

class DataTables extends Backbone.Collection
  model : DataTable

class TableView extends ContinuumView
  delegateEvents: ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @request_render)

  render : ->
    super()
    @$el.empty()
    @$el.append("<table></table>")
    @$el.find('table').append("<tr></tr>")
    headerrow = $(@$el.find('table').find('tr')[0])
    for column, idx in ['row'].concat(@mget('columns'))
      elem = $(_.template('<th class="tableelem tableheader">{{ name }}</th>',
        {'name' : column}))
      headerrow.append(elem)
    for row, idx in @mget('data')
      row_elem = $("<tr class='tablerow'></tr>")
      rownum = idx + @mget('data_slice')[0]
      for data in [rownum].concat(row)
        elem = $(_.template("<td class='tableelem'>{{val}}</td>",
          {'val':data}))
        row_elem.append(elem)
      @$el.find('table').append(row_elem)
    @render_pagination()
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()

  render_pagination : ->
    if @mget('offset') > 0
      node = $("<button>first</button>").css({'cursor' : 'pointer'})
      @$el.append(node)
      node.click(=>
        @model.load(0)
        return false
      )
      node = $("<button>previous</button>").css({'cursor' : 'pointer'})
      @$el.append(node)
      node.click(=>
        @model.load(_.max([@mget('offset') - @mget('chunksize'), 0]))
        return false
      )

    maxoffset = @mget('total_rows') - @mget('chunksize')
    if @mget('offset') < maxoffset
      node = $("<button>next</button>").css({'cursor' : 'pointer'})
      @$el.append(node)
      node.click(=>
        @model.load(_.min([
          @mget('offset') + @mget('chunksize'),
          maxoffset]))
        return false
      )
      node = $("<button>last</button>").css({'cursor' : 'pointer'})
      @$el.append(node)
      node.click(=>
        @model.load(maxoffset)
        return false
      )


class Table extends Component
  type : 'Table'
  dinitialize : (attrs, options)->
    super(attrs, options)
    @register_property('offset', ['data_slice'],
      (() -> return @get('data_slice')[0]), false
    )
    @register_property('chunksize', ['data_slice'],
      (() -> return @get('data_slice')[1] - @get('data_slice')[0]),
      false
    )

  defaults :
    url : ""
    columns : []
    data : [[]]
    data_slice : [0, 100]
    total_rows : 0
  default_view : TableView
  load : (offset) ->
    $.get(@get('url'),
        data_slice : JSON.stringify(@get('data_slice'))
      ,
        (data) =>
          @set('data_slice',
            [offset, offset + @get('chunksize')],
            {silent:true})
          @set({'data' : JSON.parse(data)['data']})
    )

class Tables extends Backbone.Collection
  model : Table
  url : "/bb"

class InteractiveContextView extends DeferredParent
  # Interactive context keeps track of a bunch of components that we render
  # into dialogs

  initialize : (options) ->
    @views = {}
    super(options)

  delegateEvents: ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @request_render)

  generate_remove_child_callback : (view) ->
    callback = () =>
      newchildren = (x for x in @mget('children') when x.id != view.model.id)
      @mset('children', newchildren)
      return null
    return callback

  build_children : () ->
    for spec in @mget('children')
      model = @model.resolve_ref(spec)
      model.set({'usedialog' : true})
    created_views = build_views(@model, @views, @mget('children'))
    for view in created_views
      safebind(this, view, 'remove', @generate_remove_child_callback(view))
    return null

  render_deferred_components : (force) ->
    super(force)
    for view in _.values(@views)
      view.render_deferred_components(force)

  render : () ->
    super()
    @build_children()
    return null

class InteractiveContext extends Component
  type : 'InteractiveContext',
  default_view : InteractiveContextView
  defaults :
    children : []
    width : $(window).width();
    height : $(window).height();
    render_loop : true
class InteractiveContexts extends Backbone.Collection
  model : InteractiveContext
Continuum.register_collection('Table', new Tables())
Continuum.register_collection('InteractiveContext', new InteractiveContexts())
Continuum.register_collection('DataTable', new DataTables())

Continuum.ContinuumView = ContinuumView
Continuum.HasProperties = HasProperties
Continuum.HasParent = HasParent
Continuum.Component = Component
Continuum.safebind = safebind

