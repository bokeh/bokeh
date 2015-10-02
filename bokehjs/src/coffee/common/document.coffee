{logger} = require "./logging"
HasProperties = require "./has_properties"

class DocumentChangedEvent
  constructor : (@document) ->

class ModelChangedEvent extends DocumentChangedEvent
  constructor : (@document, @model, @attr, @old, @new_) ->
    super @document

class RootAddedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document

class RootRemovedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document

# This class should match the API of the Python Document class
# as much as possible.
class Document

  constructor : () ->
    @_roots = []
    @_all_models = {}
    @_all_model_counts = {}
    @_callbacks = []

  clear : () ->
    while @_roots.length > 0
      @remove_root(@_roots[0])

  _destructively_move : (dest_doc) ->
    dest_doc.clear()
    while len(@_roots) > 0
      r = @_roots[0]
      @remove_root(r)
      dest_doc.add_root(r)
    # TODO other fields of doc

  roots : () ->
    @_roots

  add_root : (model) ->
    if model in @_roots
      return
    @_roots.push(model)
    model.attach_document(@)
    @_trigger_on_change(new RootAddedEvent(@, model))

  remove_root : (model) ->
    i = @_roots.indexOf(model)
    if i < 0
      return
    else
      @_roots.splice(i, 1)

    model.detach_document()
    @_trigger_on_change(new RootRemovedEvent(@, model))

  on_change : (callback) ->
    if callback in @_callbacks
      return
    @_callbacks.push(callback)

  remove_on_change : (callback) ->
    i = @_callbacks.indexOf(callback)
    if i >= 0
      @_callbacks.splice(i, 1)

  _trigger_on_change : (event) ->
    for cb in @_callbacks
      cb(event)

  # called by the model
  _notify_change : (model, attr, old, new_) ->
    @_trigger_on_change(new ModelChangedEvent(model, attr, old, new_))

  # called by the model on attach
  _notify_attach : (model) ->
    if model.id of @_all_model_counts
      @_all_model_counts[model.id] = @_all_model_counts[model.id] + 1
    else
      @_all_model_counts[model.id] = 1
    @_all_models[model.id] = model

  # called by the model on detach
  _notify_detach : (model) ->
    @_all_model_counts[model.id] -= 1
    attach_count = @_all_model_counts[model.id]
    if attach_count == 0
      delete @_all_models[model.id]
      delete @_all_model_counts[model.id]
    attach_count

  @_references_json : (references) ->
    references_json = []
    for r in references
      ref = r.ref()
      ref['attributes'] = r.attributes_as_json()
      # server doesn't want id in here since it's already in ref above
      delete ref['attributes']['id']
      references_json.push(ref)

    references_json

  # given a JSON representation of all models in a graph, return a
  # dict of new model objects
  @_instantiate_references_json: (references_json) ->
      # Create all instances, but without setting their props
      references = {}
      for obj in references_json
          obj_id = obj['id']
          obj_type = obj['type']
          if 'subtype' in obj
            obj_type = obj['subtype']

          instance = new HasProperties({ id: obj_id }) # TODO instantiate actual model type
          references[instance.id] = instance

      references

  # given a JSOn representation of all models in a graph and new
  # model instances, set the properties on the models from the
  # JSON
  @_initialize_references_json: (references_json, references) ->
    for obj in references_json
      obj_id = obj['id']
      obj_attrs = obj['attributes']

      instance = references[obj_id]

      # replace references with actual instances in obj_attrs
      changes = {}
      for k, v in obj_attrs
        if 'id' of v and v['id'] of references
          changes[k] = references[v['id']]

      for k, v in changes
        obj_attrs[k] = v

      # set all properties on the instance
      instance.set(obj_attrs)

  to_json_string : () ->
    JSON.stringify(@to_json())

  to_json : () ->
    root_ids = []
    for r in @_roots
      root_ids.push(r.id)

    root_references =
      for k, v of @_all_models
        v

    {
      'roots' : {
        'root_ids' : root_ids,
        'references' : Document._references_json(root_references)
      }
    }

  @from_json_string : (s) ->
    json = JSON.parse(s)
    Document.from_json(json)

  @from_json : (json) ->
    roots_json = json['roots']
    root_ids = roots_json['root_ids']
    references_json = roots_json['references']

    references = Document._instantiate_references_json(references_json)
    Document._initialize_references_json(references_json, references)

    doc = new Document()
    for r in root_ids
      doc.add_root(references[r])

    doc

  replace_with_json : (json) ->
    replacement = Document.from_json(json)
    replacement._destructively_move(@)

  create_json_patch_string : (events) ->
    JSON.stringify(@create_json_patch(events))

  create_json_patch : (events) ->
    references = {}
    json_events = []
    for event in events
      if event.document != @
        throw new Error("Cannot create a patch using events from a different document")
      if event instanceof ModelChangedEvent
        value = event.new_
        if value instanceof HasProperties
          value_refs = value.references()
          # we know we don't want a whole new copy of the obj we're patching
          i = value_refs.indexOf(event.model)
          if i >= 0
            value_refs.splice(i, 1)
          for r in value_refs
            references[r.id] = r

        json_event = {
          'kind' : 'ModelChanged',
          'model' : event.model.ref(),
          'attr' : event.attr,
          'new' : value
        }
        json_events.push(json_event)
      else if event instanceof RootAddedEvent
        for r in event.model.references()
          references[r.id] = r
        json_event = {
          'kind' : 'RootAdded',
          'model' : event.model.ref()
        }
        json_events.push(json_event)
      else if event instanceof RootRemovedEvent
        json_event = {
          'kind' : 'RootRemoved',
          'model' : event.model.ref()
        }
        json_events.push(json_event)

    references_list =
      for k,v of references
        v

    {
      'events' : json_events,
      'references' : Document._references_json(references_list)
    }

  apply_json_patch_string: (patch) ->
    @apply_json_patch(JSON.parse(patch))

  apply_json_patch: (patch) ->
    references_json = patch['references']
    events_json = patch['events']
    references = Document._instantiate_references_json(references_json)

    # Use our existing model instances whenever we have them
    existing = []
    for id, obj of references
      if id of @_all_models
        existing.push(@_all_models[id])

    # The model being changed isn't always in references so add it in
    for event_json in events_json
      if 'model' of event_json
        model_id = event_json['model']['id']
        if model_id of @_all_models
          existing.push(@_all_models[model_id])

    for e in existing
      references[e.id] = e

    Document._initialize_references_json(references_json, references)

    for event_json in events_json
      if event_json['kind'] == 'ModelChanged'
        patched_id = event_json['model']['id']
        if patched_id not of @_all_models
          throw new Error("Cannot apply patch to #{patched_id} which is not in the document")
        patched_obj = @_all_models[patched_id]
        attr = event_json['attr']
        value = event_json['new']
        if typeof value == 'object' and 'id' of value and value['id'] of references
          value = references[value['id']]
        patched_obj.set({ "#{attr}" : value })
      else if event_json['kind'] == 'RootAdded'
        root_id = event_json['model']['id']
        root_obj = references[root_id]
        @add_root(root_obj)
      else if event_json['kind'] == 'RootRemoved'
        root_id = event_json['model']['id']
        root_obj = references[root_id]
        @remove_root(root_obj)
      else
        throw new Error("Unknown patch event " + JSON.stringify(event_json))

module.exports = {
  Document : Document
  DocumentChangedEvent : DocumentChangedEvent
  ModelChangedEvent : ModelChangedEvent
  RootAddedEvent : RootAddedEvent,
  RootRemovedEvent : RootRemovedEvent
}
