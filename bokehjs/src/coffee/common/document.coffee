_ = require "underscore"
{logger} = require "./logging"
HasProperties = require "./has_properties"
{Collections} = require("./base")

class DocumentChangedEvent
  constructor : (@document) ->

class ModelChangedEvent extends DocumentChangedEvent
  constructor : (@document, @model, @attr, @old, @new_) ->
    super @document

class TitleChangedEvent extends DocumentChangedEvent
  constructor : (@document, @title) ->
    super @document

class RootAddedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document

class RootRemovedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document

DEFAULT_TITLE = "Bokeh Application"

class _MultiValuedDict
    constructor : () ->
      @_dict = {}

    _existing: (key) ->
      if key of @_dict
        return @_dict[key]
      else
        return null

    add_value: (key, value) ->
      if value == null
        throw new Error("Can't put null in this dict")
      if _.isArray(value)
        throw new Error("Can't put arrays in this dict")
      existing = @_existing(key)
      if existing == null
        @_dict[key] = value
      else if _.isArray(existing)
        existing.push(value)
      else
        @_dict[key] = [existing, value]

    remove_value: (key, value) ->
      existing = @_existing(key)
      if _.isArray(existing)
        new_array = _.without(existing, value)
        if new_array.length > 0
          @_dict[key] = new_array
        else
          delete @_dict[key]
      else if _.isEqual(existing, value)
        delete @_dict[key]

    get_one: (key, duplicate_error) ->
      existing = @_existing(key)
      if _.isArray(existing)
        if existing.length == 1
          return existing[0]
        else
          throw new Error(duplicate_error)
      else
        return existing

# This class should match the API of the Python Document class
# as much as possible.
class Document

  constructor : () ->
    @_title = DEFAULT_TITLE
    @_roots = []
    @_all_models = {}
    @_all_models_by_name = new _MultiValuedDict()
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
    dest_doc.set_title(@_title)
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

  title : () ->
    @_title

  set_title : (title) ->
    if title != @_title
      @_title = title
      @_trigger_on_change(new TitleChangedEvent(@, title))

  get_model_by_id : (model_id) ->
    if model_id of @_all_models
      @_all_models[model_id]
    else
      null

  get_model_by_name : (name) ->
    @_all_models_by_name.get_one(name, "Multiple models are named '#{name}'")

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
    if attr == 'name'
      @_all_models_by_name.remove_value(old, model)
      if new_ != null
        @_all_models_by_name.add_value(new_, model)
    @_trigger_on_change(new ModelChangedEvent(@, model, attr, old, new_))

  # called by the model on attach
  _notify_attach : (model) ->
    if not model.serializable_in_document()
      console.log("Attempted to attach nonserializable to document ", model)
      throw new Error("Should not attach nonserializable model #{model.constructor.name} to document")

    if model.id of @_all_model_counts
      @_all_model_counts[model.id] = @_all_model_counts[model.id] + 1
    else
      @_all_model_counts[model.id] = 1
    @_all_models[model.id] = model
    name = model.get('name')
    if name != null
      @_all_models_by_name.add_value(name, model)

  # called by the model on detach
  _notify_detach : (model) ->
    @_all_model_counts[model.id] -= 1
    attach_count = @_all_model_counts[model.id]
    if attach_count == 0
      delete @_all_models[model.id]
      delete @_all_model_counts[model.id]
      name = model.get('name')
      if name != null
        @_all_models_by_name.remove_value(name, model)
    attach_count

  @_references_json : (references) ->
    references_json = []
    for r in references
      if not r.serializable_in_document()
        console.log("nonserializable value in references ", r)
        throw new Error("references should never contain nonserializable value")
      ref = r.ref()
      ref['attributes'] = r.attributes_as_json()
      # server doesn't want id in here since it's already in ref above
      delete ref['attributes']['id']
      references_json.push(ref)

    references_json

  @_instantiate_object: (obj_id, obj_type, obj_attrs) ->
    # we simulate what backbone's Collection.add does
    # but we don't want our instances to actually be
    # in a global cache - we only want to share instances
    # within a Document, not across all documents.
    # So our dependency on Backbone.Collection here is
    # just to steal the .model field, which means later
    # we can clean up base.coffee to avoid any
    # Collection stuff.
    full_attrs = _.extend({}, obj_attrs, { id: obj_id })
    coll = Collections(obj_type)
    if not coll?
      # this isn't supposed to be reached because Collections() already throws in this case
      throw new Error("unknown model type #{ obj_type } for #{ obj_id }")

    new coll.model(full_attrs, {'silent' : true, 'defer_initialization' : true})

  # given a JSON representation of all models in a graph, return a
  # dict of new model objects
  @_instantiate_references_json: (references_json, existing_models) ->
      # Create all instances, but without setting their props
      references = {}
      for obj in references_json
          obj_id = obj['id']
          obj_type = obj['type']
          if 'subtype' in obj
            obj_type = obj['subtype']
          obj_attrs = obj['attributes']

          if obj_id of existing_models
            instance = existing_models[obj_id]
          else
            instance = Document._instantiate_object(obj_id, obj_type, obj_attrs)
          references[instance.id] = instance

      references

  # if v looks like a ref, or a collection, resolve it, otherwise return it unchanged
  # recurse into collections but not into HasProperties
  @_resolve_refs: (value, old_references, new_references) ->

    resolve_ref = (v) ->
      if HasProperties._is_ref(v)
        if v['id'] of old_references
          old_references[v['id']]
        else if v['id'] of new_references
          new_references[v['id']]
        else
          throw new Error("reference #{JSON.stringify(v)} isn't known (not in Document?)")
      else if _.isArray(v)
        resolve_array(v)
      else if _.isObject(v)
        resolve_dict(v)
      else
        v

    resolve_dict = (dict) ->
      resolved = {}
      for k, v of dict
        resolved[k] = resolve_ref(v)
      resolved

    resolve_array = (array) ->
      resolve_ref(v) for v in array

    resolve_ref(value)

  # given a JSON representation of all models in a graph and new
  # model instances, set the properties on the models from the
  # JSON
  @_initialize_references_json: (references_json, old_references, new_references) ->
    to_update = {}
    for obj in references_json
      obj_id = obj['id']
      obj_attrs = obj['attributes']

      was_new = false
      instance =
        if obj_id of old_references
          old_references[obj_id]
        else
          was_new = true
          new_references[obj_id]

      # replace references with actual instances in obj_attrs
      obj_attrs = Document._resolve_refs(obj_attrs, old_references, new_references)

      to_update[instance.id] = [instance, obj_attrs, was_new]

    # this is so that, barring cycles, when an instance gets its
    # refs resolved, the values for those refs also have their
    # refs resolved.
    foreach_depth_first = (items, f) ->
      already_started = {}
      foreach_value = (v, f) ->
        if v instanceof HasProperties
          # note that we ignore instances that aren't updated (not in to_update)
          if v.id not of already_started and v.id of items
            already_started[v.id] = true
            [same_as_v, attrs, was_new] = items[v.id]
            for a, e of attrs
              foreach_value(e, f)
            f(v, attrs, was_new)
        else if _.isArray(v)
          for e in v
            foreach_value(e, f)
        else if _.isObject(v)
          for k, e of v
            foreach_value(e, f)
      for k, v of items
        foreach_value(v[0], f)

    # this first pass removes all 'refs' replacing them with real instances
    foreach_depth_first to_update, (instance, attrs, was_new) ->
      instance.set(attrs)

    # after removing all the refs, we can run the initialize code safely
    foreach_depth_first to_update, (instance, attrs, was_new) ->
      if was_new
        instance.initialize(attrs)

  @_event_for_attribute_change: (changed_obj, key, new_value, doc, value_refs) ->
      changed_model = doc.get_model_by_id(changed_obj.id)
      if not changed_model.attribute_is_serializable(key)
        return null

      event = {
        'kind' : 'ModelChanged',
        'model' : { id: changed_obj.id, type: changed_obj.type },
        'attr' : key,
        'new' : new_value
      }
      HasProperties._json_record_references(doc, new_value, value_refs, true) # true = recurse
      event

  @_events_to_sync_objects: (from_obj, to_obj, to_doc, value_refs) ->
    from_keys = Object.keys(from_obj.attributes)
    to_keys = Object.keys(to_obj.attributes)
    removed = _.difference(from_keys, to_keys)
    added = _.difference(to_keys, from_keys)
    shared = _.intersection(from_keys, to_keys)

    events = []
    for key in removed
      # we don't really have a "remove" event - not sure this ever happens even -
      # but treat it as equivalent to setting to null
      events.push(Document._event_for_attribute_change(from_obj, key, null, to_doc, value_refs))
    for key in added
      new_value = to_obj.attributes[key]
      events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))
    for key in shared
      old_value = from_obj.attributes[key]
      new_value = to_obj.attributes[key]
      if old_value == null and new_value == null
        ;# do nothing
      else if old_value == null or new_value == null
        events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))
      else
        if not _.isEqual(old_value, new_value)
          events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))

    _.filter(events, (e) -> e != null)

  # we use this to detect changes during document deserialization
  # (in model constructors and initializers)
  @_compute_patch_since_json: (from_json, to_doc) ->
    to_json = to_doc.to_json()

    refs = (json) ->
      result = {}
      for obj in json['roots']['references']
        result[obj.id] = obj
      result

    from_references = refs(from_json)
    from_roots = {}
    from_root_ids = []
    for r in from_json['roots']['root_ids']
      from_roots[r] = from_references[r]
      from_root_ids.push(r)

    to_references = refs(to_json)
    to_roots = {}
    to_root_ids = []
    for r in to_json['roots']['root_ids']
      to_roots[r] = to_references[r]
      to_root_ids.push(r)

    from_root_ids.sort()
    to_root_ids.sort()

    if _.difference(from_root_ids, to_root_ids).length > 0
      # this would arise if someone does add_root/remove_root during
      # document deserialization, hopefully they won't ever do so.
      throw new Error("Not implemented: computing add/remove of document roots")

    value_refs = {}
    events = []

    for id, model of to_doc._all_models
      if id of from_references
        update_model_events = Document._events_to_sync_objects(
          from_references[id],
          to_references[id],
          to_doc,
          value_refs)
        events = events.concat(update_model_events)

    {
      'events' : events,
      'references' : Document._references_json(_.values(value_refs))
    }

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
      'title' : @_title
      'roots' : {
        'root_ids' : root_ids,
        'references' : Document._references_json(root_references)
      }
    }

  @from_json_string : (s) ->
    if s == null or not s?
      throw new Error("JSON string is #{typeof s}")
    json = JSON.parse(s)
    Document.from_json(json)

  @from_json : (json) ->
    if typeof json != 'object'
      throw new Error("JSON object has wrong type #{typeof json}")
    roots_json = json['roots']
    root_ids = roots_json['root_ids']
    references_json = roots_json['references']

    references = Document._instantiate_references_json(references_json, {})
    Document._initialize_references_json(references_json, {}, references)

    doc = new Document()
    for r in root_ids
      doc.add_root(references[r])

    doc.set_title(json['title'])

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
        console.log("Cannot create a patch using events from a different document, event had ", event.document, " we are ", @)
        throw new Error("Cannot create a patch using events from a different document")
      if event instanceof ModelChangedEvent
        if event.attr == 'id'
          console.log("'id' field is immutable and should never be in a ModelChangedEvent ", event)
          throw new Error("'id' field should never change, whatever code just set it is wrong")
        value = event.new_
        value_json = HasProperties._value_to_json('new_', value, event.model)
        value_refs = {}
        HasProperties._value_record_references(value, value_refs, true) # true = recurse

        if event.model.id of value_refs and event.model != value
          # we know we don't want a whole new copy of the obj we're patching
          # unless it's also the value itself
          delete value_refs[event.model.id]
        for id of value_refs
          references[id] = value_refs[id]

        json_event = {
          'kind' : 'ModelChanged',
          'model' : event.model.ref(),
          'attr' : event.attr,
          'new' : value_json
        }

        json_events.push(json_event)
      else if event instanceof RootAddedEvent
        HasProperties._value_record_references(event.model, references, true)
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
      else if event instanceof TitleChangedEvent
        json_event = {
          'kind' : 'TitleChanged',
          'title' : event.title
        }
        json_events.push(json_event)

    {
      'events' : json_events,
      'references' : Document._references_json(_.values(references))
    }

  apply_json_patch_string: (patch) ->
    @apply_json_patch(JSON.parse(patch))

  apply_json_patch: (patch) ->
    references_json = patch['references']
    events_json = patch['events']
    references = Document._instantiate_references_json(references_json, @_all_models)

    # The model being changed isn't always in references so add it in
    for event_json in events_json
      if 'model' of event_json
        model_id = event_json['model']['id']
        if model_id of @_all_models
          references[model_id] = @_all_models[model_id]
        else
          console.log("Got an event for unknown model ", event_json['model'])
          throw new Error("event model wasn't known")

    # split references into old and new so we know whether to initialize or update
    old_references = {}
    new_references = {}
    for id, value of references
      if id of @_all_models
        old_references[id] = value
      else
        new_references[id] = value

    Document._initialize_references_json(references_json, old_references, new_references)

    for event_json in events_json
      if event_json['kind'] == 'ModelChanged'
        patched_id = event_json['model']['id']
        if patched_id not of @_all_models
          throw new Error("Cannot apply patch to #{patched_id} which is not in the document")
        patched_obj = @_all_models[patched_id]
        attr = event_json['attr']
        value = Document._resolve_refs(event_json['new'], old_references, new_references)
        patched_obj.set({ "#{attr}" : value })
      else if event_json['kind'] == 'RootAdded'
        root_id = event_json['model']['id']
        root_obj = references[root_id]
        @add_root(root_obj)
      else if event_json['kind'] == 'RootRemoved'
        root_id = event_json['model']['id']
        root_obj = references[root_id]
        @remove_root(root_obj)
      else if event_json['kind'] == 'TitleChanged'
        @set_title(event_json['title'])
      else
        throw new Error("Unknown patch event " + JSON.stringify(event_json))

module.exports = {
  Document : Document
  DocumentChangedEvent : DocumentChangedEvent
  ModelChangedEvent : ModelChangedEvent
  TitleChangedEvent : TitleChangedEvent
  RootAddedEvent : RootAddedEvent
  RootRemovedEvent : RootRemovedEvent
}
