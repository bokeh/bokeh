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

  dupe_specs = {}

  for model in modelspecs
    modeltype = model['type']
    attrs = model['attributes']
    modelid = attrs['id']
    coll = Collections(modeltype)
    if not coll?
      logger.warn("load_models: no collection for #{ modeltype } (#{ modelid }), ignoring")
      continue

    if coll.get(modelid)
      oldspecs.push([coll, attrs, modeltype])

    else
      if modelid of dupe_specs
        logger.warn("load_models: ignoring duplicate #{ modeltype } (#{ modelid })")
      else
        dupe_specs[modelid] = true
        newspecs.push([coll, attrs, modeltype])

  logger.debug("load_models: adding #{ newspecs.length } new models to collections")

  # add new objects to collections silently
  for i in [0...newspecs.length]
    [coll, attrs, type] = newspecs[i]
    logger.trace("load_models: adding [#{ i }] #{ type } (#{ attrs['id'] })")
    coll.add(attrs, {'silent' : true, 'defer_initialization' : true})

  logger.debug("load_models: finished adding new models to collections")

  logger.debug("load_models: starting deferred initializations of #{ newspecs.length } new models")

  # call deferred initialization on all new models
  for i in [0...newspecs.length]
    [coll, attrs, type] = newspecs[i]
    model = coll.get(attrs['id'])
    logger.trace("load_models: initializing [#{ i }] #{ model.type } (#{ attrs['id'] })")
    model.initialize(attrs)

  logger.debug("load_models: finished deferred initializations")

  # trigger add events on all new models
  for i in [0...newspecs.length]
    [coll, attrs, type] = newspecs[i]
    model = coll.get(attrs.id)
    model.trigger('add', model, coll, {})

  # set attributes on old models
  for i in [0...oldspecs.length]
    [coll, attrs, type] = oldspecs[i]
    coll.get(attrs['id']).set(attrs)

  logger.debug("load_models: finish")

  return null

module.exports = load_models