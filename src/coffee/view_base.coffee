# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum

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
Continuum.safebind = safebind

build_views = (mainmodel, view_storage, view_specs, options, view_options) ->
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
  valid_viewmodels = {}
  for spec in view_specs
    valid_viewmodels[spec.id] = true
  for spec, idx in view_specs
    if view_storage[spec.id]
      continue
    model = mainmodel.resolve_ref(spec)
    if view_options
      view_specific_option = view_options[idx]
    else
      view_specific_option = {}
    temp = _.extend({}, view_specific_option, spec.options, options, {'model' : model})
    view_storage[model.id] = new model.default_view(temp)
    created_views.push(view_storage[model.id])
  for own key, value of view_storage
    if not valid_viewmodels[key]
      value.remove()
      delete view_storage[key]
  return created_views

Continuum.build_views = build_views

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
    @use_render_loop = options['render_loop']
    if @use_render_loop
      console.log('loop')
      _.defer(() => @render_loop())


  render_loop : () ->
    @render_deferred_components()
    if not @removed and @use_render_loop
      setTimeout((() => @render_loop()), 100)
    else
      @looping = false

  remove : () ->
    super()
    @removed = true


Continuum.DeferredView = DeferredView
Continuum.DeferredParent = DeferredParent
Continuum.ContinuumView = ContinuumView
