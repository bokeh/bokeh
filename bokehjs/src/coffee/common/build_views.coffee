
define [
  "underscore",
], (_) ->

  build_views = (view_storage, view_models, options, view_types=[]) ->
    # ## function: build_views
    # convenience function for creating a bunch of views from a spec
    # and storing them in a dictionary keyed off of model id.
    # views are automatically passed the model that they represent

    # ####Parameters
    # * mainmodel: model which is constructing the views, this is used to resolve
    #   specs into other model objects
    # * view_storage: where you want the new views stored.  this is a dictionary
    #   views will be keyed by the id of the underlying model
    # * view_specs: list of view specs.  view specs are continuum references, with
    #   a typename and an id.  you can also pass options you want to feed into
    #   the views constructor here, as an 'options' field in the dict
    # * options: any additional option to be used in the construction of views
    # * view_option: array, optional view specific options passed in to the construction of the view
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
      view_specific_option = _.extend({}, options, {'model': model})
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
