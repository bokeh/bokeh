# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum


build_views = (view_storage, view_models, options) ->
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
  console.log('success ')
  for model in newmodels
    view_specific_option = _.extend({}, options, {'model' : model})
    try
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

Continuum.build_views = build_views

class ContinuumView extends Backbone.View
  initialize : (options) ->
    #autogenerates id
    if not _.has(options, 'id')
      this.id = _.uniqueId('ContinuumView')

  #bind_bokeh_events is always called after initialize has run
  bind_bokeh_events : () ->
    'pass'



  delegateEvents : (events) ->
    super(events)
    @bind_bokeh_events()

  remove : ->
    #handles lifecycle of events bound by safebind

    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)
    @trigger('remove')
    super()

  v_get_ref: (model_key) ->
    keys = @mget(model_key)
    retval = _.map(keys, (key) => @model.resolve_ref(key))
    return retval

  mget : ()->
    # convenience function, calls get on the associated model
    return @model.get.apply(@model, arguments)

  mset : ()->
    # convenience function, calls set on the associated model

    return @model.set.apply(@model, arguments)

  mget_ref : (fld) ->
    # convenience function, calls get_ref on the associated model

    return @model.get_ref(fld)
  render_end : () ->
    "pass"
Continuum.ContinuumView = ContinuumView
