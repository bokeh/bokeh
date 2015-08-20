base = require "./base"
{logger} = require "./logging"

load_models = (modelspecs) ->
  # First we identify which model jsons correspond to new models,
  # and which ones are updates.
  # For new models we construct the models, add them
  # to their collections (with option to defer initialization)
  # and call initialize manually
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

  logger.debug("load_models: start")

  seen_specs = {}

  for model in modelspecs
    modeltype = model['type']
    attrs = model['attributes']
    modelid = attrs['id']
    coll = Collections(modeltype)
    if coll and coll.get(modelid)
      oldspecs.push([coll, attrs])
    else
      if modelid of seen_specs
        logger.warn("load_models: ignoring duplicate model #{ modeltype } (#{ modelid })")
      else
        seen_specs[modelid] = true
        newspecs.push([coll, attrs])

  # add new objects to collections silently
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.add(attrs, {'silent' : true, 'defer_initialization' : true})

  logger.debug("load_models: starting deferred initializations")

  # call deferred initialization on all new models
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.get(attrs['id']).initialize(attrs)

  logger.debug("load_models: finished deferred initializations")

  # trigger add events on all new models
  for coll_attrs in newspecs
    [coll, attrs] = coll_attrs
    if coll
      model = coll.get(attrs.id)
      model.trigger('add', model, coll, {})

  # set attributes on old models
  for coll_attrs in oldspecs
    [coll, attrs] = coll_attrs
    if coll
      coll.get(attrs['id']).set(attrs)

  logger.debug("load_models: finish")

  return null

module.exports = load_models