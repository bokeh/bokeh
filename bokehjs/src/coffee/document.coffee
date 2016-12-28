import * as _ from "underscore"

import {Models} from "./base"
import {version as js_version} from "./version"
import {EQ, Solver, Variable} from "./core/layout/solver"
import {logger} from "./core/logging"
import {HasProps} from "./core/has_props"
import {is_ref} from "./core/util/refs"
import {MultiDict, Set} from "./core/util/data_structures"
import {ColumnDataSource} from "./models/sources/column_data_source"

export class DocumentChangedEvent
  constructor : (@document) ->

export class ModelChangedEvent extends DocumentChangedEvent
  constructor : (@document, @model, @attr, @old, @new_) ->
    super @document
  json : (references) ->

    if @attr == 'id'
      console.log("'id' field is immutable and should never be in a ModelChangedEvent ", @)
      throw new Error("'id' field should never change, whatever code just set it is wrong")

    value = @new_
    value_json = HasProps._value_to_json('new_', value, @model)

    value_refs = {}
    HasProps._value_record_references(value, value_refs, true) # true = recurse

    if @model.id of value_refs and @model != value
      # we know we don't want a whole new copy of the obj we're
      # patching unless it's also the value itself
      delete value_refs[@model.id]

    for id of value_refs
      references[id] = value_refs[id]

    {
      'kind' : 'ModelChanged',
      'model' : @model.ref(),
      'attr' : @attr,
      'new' : value_json
    }

export class TitleChangedEvent extends DocumentChangedEvent
  constructor : (@document, @title) ->
    super @document
  json : (references) ->
    {
      'kind' : 'TitleChanged',
      'title' : @title
    }

export class RootAddedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document
  json : (references) ->
    HasProps._value_record_references(@model, references, true)
    {
      'kind' : 'RootAdded',
      'model' : @model.ref()
    }

export class RootRemovedEvent extends DocumentChangedEvent
  constructor : (@document, @model) ->
    super @document
  json : (references) ->
    {
      'kind' : 'RootRemoved',
      'model' : @model.ref()
    }

export DEFAULT_TITLE = "Bokeh Application"

# This class should match the API of the Python Document class
# as much as possible.
export class Document

  constructor : () ->
    @_title = DEFAULT_TITLE
    @_roots = []
    @_all_models = {}
    @_all_models_by_name = new MultiDict()
    @_all_models_freeze_count = 0
    @_callbacks = []
    @_doc_width = new Variable("document_width")
    @_doc_height = new Variable("document_height")
    @_solver = new Solver()
    @_init_solver()

    window.addEventListener("resize", () => @resize())

  _init_solver : () ->
    @_solver.clear()
    @_solver.add_edit_variable(@_doc_width)
    @_solver.add_edit_variable(@_doc_height)
    for model in @_roots
      if model.layoutable
        @_add_layoutable(model)

  solver: () ->
    @_solver

  resize: (width=null, height=null) ->
    # Notes on resizing (xx:yy means event yy on object xx):
    # window:event -> document.resize() -> solver:resize
    #   -> LayoutDOM.render()
    #   -> PlotCanvas.resize() -> solver:update_layout

    # Ideally the solver would settle in one pass (can that be done?),
    # but it currently needs two passes to get it right.
    # Seems to be needed everywhere on initialization, and on Windows
    # it seems necessary on each Draw
    @_resize(width, height)
    @_resize(width, height)

  _resize: (width=null, height=null) ->
    for root in @_roots
      if root.layoutable isnt true
        continue

      vars = root.get_constrained_variables()
      if not vars.width? and not vars.height?
        continue

      # Find the html element
      root_div = document.getElementById("modelid_#{root.id}")

      # Start working upwards until you find a height to pin against - usually .bk-root
      if root_div? and width == null
        measuring = root_div
        while true
          measuring = measuring.parentNode
          {width, height} = measuring.getBoundingClientRect()
          if height != 0
            break

      # Set the constraints on root
      if vars.width?
        logger.debug("Suggest width on Document -- #{width}")
        @_solver.suggest_value(@_doc_width, width)
      if vars.height?
        logger.debug("Suggest height on Document -- #{height}")
        @_solver.suggest_value(@_doc_height, height)

    # Finally update everything only once.
    @_solver.update_variables(false)
    @_solver.trigger('resize')

  clear : () ->
    @_push_all_models_freeze()
    try
      while @_roots.length > 0
        @remove_root(@_roots[0])
    finally
      @_pop_all_models_freeze()

  destructively_move : (dest_doc) ->
    if dest_doc is @
      throw new Error("Attempted to overwrite a document with itself")

    dest_doc.clear()
    # we have to remove ALL roots before adding any
    # to the new doc or else models referenced from multiple
    # roots could be in both docs at once, which isn't allowed.
    roots = []
    for r in @_roots
      roots.push(r)
    @clear()

    for r in roots
      if r.document != null
        throw new Error("Somehow we didn't detach #{r}")
    if _.size(@_all_models) != 0
      throw new Error("@_all_models still had stuff in it: #{ @_all_models }")

    for r in roots
      dest_doc.add_root(r)
    dest_doc.set_title(@_title)
    # TODO other fields of doc

  _push_all_models_freeze: () ->
    @_all_models_freeze_count += 1

  _pop_all_models_freeze: () ->
    @_all_models_freeze_count -= 1
    if @_all_models_freeze_count == 0
      @_recompute_all_models()

  _invalidate_all_models: () ->
    logger.debug("invalidating document models")
    # if freeze count is > 0, we'll recompute on unfreeze
    if @_all_models_freeze_count == 0
      @_recompute_all_models()

  _recompute_all_models: () ->
    new_all_models_set = new Set()

    for r in @_roots
      new_all_models_set = new_all_models_set.union(r.references())
    old_all_models_set = new Set(_.values(@_all_models))
    to_detach = old_all_models_set.diff(new_all_models_set)
    to_attach = new_all_models_set.diff(old_all_models_set)

    recomputed = {}

    for m in new_all_models_set.values
      recomputed[m.id] = m

    for d in to_detach.values
      d.detach_document()
      name = d.name
      if name != null
        @_all_models_by_name.remove_value(name, d)

    for a in to_attach.values
      a.attach_document(@)
      name = a.name
      if name != null
        @_all_models_by_name.add_value(name, a)

    @_all_models = recomputed

  roots : () ->
    @_roots

  _add_layoutable: (model) ->
    if model.layoutable isnt true
      throw new Error("Cannot add non-layoutable - #{model}")

    editables = model.get_edit_variables()
    constraints = model.get_constraints()
    vars = model.get_constrained_variables()

    for {edit_variable, strength} in editables
      @_solver.add_edit_variable(edit_variable, strength)

    for constraint in constraints
      @_solver.add_constraint(constraint)

    if vars.width?
      @_solver.add_constraint(EQ(vars.width, @_doc_width))
    if vars.height?
      @_solver.add_constraint(EQ(vars.height, @_doc_height))

    @_solver.update_variables()

  add_root : (model) ->
    logger.debug("Adding root: #{model}")

    if model in @_roots
      return

    @_push_all_models_freeze()
    try
      @_roots.push(model)
      model._is_root = true # TODO get rid of this?
    finally
      @_pop_all_models_freeze()

    @_init_solver()

    @_trigger_on_change(new RootAddedEvent(@, model))

  remove_root : (model) ->
    i = @_roots.indexOf(model)
    if i < 0
      return

    @_push_all_models_freeze()
    try
      @_roots.splice(i, 1)
      model._is_root = false
    finally
      @_pop_all_models_freeze()

    @_init_solver()

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

  @_references_json : (references, include_defaults=true) ->
    references_json = []
    for r in references
      ref = r.ref()
      ref['attributes'] = r.attributes_as_json(include_defaults)
      # server doesn't want id in here since it's already in ref above
      delete ref['attributes']['id']
      references_json.push(ref)

    references_json

  @_instantiate_object: (obj_id, obj_type, obj_attrs) ->
    full_attrs = _.extend({}, obj_attrs, {id: obj_id})
    model = Models(obj_type)
    new model(full_attrs, {silent: true, defer_initialization: true})

  # given a JSON representation of all models in a graph, return a
  # dict of new model objects
  @_instantiate_references_json: (references_json, existing_models) ->
      # Create all instances, but without setting their props
      references = {}
      for obj in references_json
          obj_id = obj['id']
          obj_type = obj['type']
          obj_attrs = obj['attributes']

          if obj_id of existing_models
            instance = existing_models[obj_id]
          else
            instance = Document._instantiate_object(obj_id, obj_type, obj_attrs)
            if 'subtype' of obj
              instance.set_subtype(obj['subtype'])
          references[instance.id] = instance

      references

  # if v looks like a ref, or a collection, resolve it, otherwise return it unchanged
  # recurse into collections but not into HasProps
  @_resolve_refs: (value, old_references, new_references) ->

    resolve_ref = (v) ->
      if is_ref(v)
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
        if v instanceof HasProps
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
      if was_new
        instance.setv(attrs)

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
      HasProps._json_record_references(doc, new_value, value_refs, true) # true = recurse
      event

  @_events_to_sync_objects: (from_obj, to_obj, to_doc, value_refs) ->
    from_keys = Object.keys(from_obj.attributes)
    to_keys = Object.keys(to_obj.attributes)
    removed = _.difference(from_keys, to_keys)
    added = _.difference(to_keys, from_keys)
    shared = _.intersection(from_keys, to_keys)

    events = []
    for key in removed
      # we don't really have a "remove" event - not sure this ever
      # happens even. One way this could happen is if the server
      # does include_defaults=True and we do
      # include_defaults=false ... in that case it'd be best to
      # just ignore this probably. Warn about it, could mean
      # there's a bug if we don't have a key that the server sent.
      logger.warn("Server sent key #{key} but we don't seem to have it in our JSON")
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

    events.filter((e) -> e != null)

  # we use this to detect changes during document deserialization
  # (in model constructors and initializers)
  @_compute_patch_since_json: (from_json, to_doc) ->
    to_json = to_doc.to_json(include_defaults=false)

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

    if _.difference(from_root_ids, to_root_ids).length > 0 or
       _.difference(to_root_ids, from_root_ids).length > 0
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
      'references' : Document._references_json(_.values(value_refs), include_defaults=false)
    }

  to_json_string : (include_defaults=true) ->
    JSON.stringify(@to_json(include_defaults))

  to_json : (include_defaults=true) ->
    root_ids = []
    for r in @_roots
      root_ids.push(r.id)

    root_references = _.values(@_all_models)

    {
      'title' : @_title
      'roots' : {
        'root_ids' : root_ids,
        'references' : Document._references_json(root_references, include_defaults)
      }
    }

  @from_json_string : (s) ->
    if s == null or not s?
      throw new Error("JSON string is #{typeof s}")
    json = JSON.parse(s)
    Document.from_json(json)

  @from_json : (json) ->
    logger.debug("Creating Document from JSON")
    if typeof json != 'object'
      throw new Error("JSON object has wrong type #{typeof json}")
    py_version = json['version']
    versions_string = "Library versions: JS (#{js_version})  /  Python (#{py_version})"
    if py_version.indexOf('-') < 0 and js_version != py_version
      logger.warn("JS/Python version mismatch")
      logger.warn(versions_string)
    else
      logger.debug(versions_string)

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
    replacement.destructively_move(@)

  create_json_patch_string : (events) ->
    JSON.stringify(@create_json_patch(events))

  create_json_patch : (events) ->
    references = {}
    json_events = []
    for event in events

      if event.document != @
        console.log("Cannot create a patch using events from a different document, event had ", event.document, " we are ", @)
        throw new Error("Cannot create a patch using events from a different document")

      json_events.push(event.json(references))

    result =
      events: json_events,
      references: Document._references_json(_.values(references))

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
          if model_id not of references
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
      switch event_json.kind
        when 'ModelChanged'
          patched_id = event_json['model']['id']
          if patched_id not of @_all_models
            throw new Error("Cannot apply patch to #{patched_id} which is not in the document")
          patched_obj = @_all_models[patched_id]
          attr = event_json['attr']
          value = Document._resolve_refs(event_json['new'], old_references, new_references)
          patched_obj.setv({ "#{attr}" : value })

        when 'ColumnsStreamed'
          column_source_id = event_json['column_source']['id']
          if column_source_id not of @_all_models
            throw new Error("Cannot stream to #{column_source_id} which is not in the document")
          column_source = @_all_models[column_source_id]
          if column_source not instanceof ColumnDataSource
            throw new Error("Cannot stream to non-ColumnDataSource")
          data = event_json['data']
          rollover = event_json['rollover']
          column_source.stream(data, rollover)

        when 'ColumnsPatched'
          column_source_id = event_json['column_source']['id']
          if column_source_id not of @_all_models
            throw new Error("Cannot patch #{column_source_id} which is not in the document")
          column_source = @_all_models[column_source_id]
          if column_source not instanceof ColumnDataSource
            throw new Error("Cannot patch non-ColumnDataSource")
          patches = event_json['patches']
          column_source.patch(patches)

        when 'RootAdded'
          root_id = event_json['model']['id']
          root_obj = references[root_id]
          @add_root(root_obj)

        when 'RootRemoved'
          root_id = event_json['model']['id']
          root_obj = references[root_id]
          @remove_root(root_obj)

        when 'TitleChanged'
          @set_title(event_json['title'])

        else
          throw new Error("Unknown patch event " + JSON.stringify(event_json))
