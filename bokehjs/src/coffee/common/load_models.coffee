
define [
  "require",
  "./base"
], (require, base) ->

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

    Collections = require("./base").Collections

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

