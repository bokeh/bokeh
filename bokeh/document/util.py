'''

'''
from __future__ import absolute_import

from ..model import get_class

# This is used to send changes that happened between show() and push_notebook()
# and should be removed when a better implementation based on the bokeh protocol
# is available
def compute_patch_between_json(from_json, to_json):
    '''

    '''

    def refs(json):
        result = {}
        for obj in json['roots']['references']:
            result[obj['id']] = obj
        return result

    from_references = refs(from_json)
    from_roots = {}
    from_root_ids = []
    for r in from_json['roots']['root_ids']:
        from_roots[r] = from_references[r]
        from_root_ids.append(r)

    to_references = refs(to_json)
    to_roots = {}
    to_root_ids = []
    for r in to_json['roots']['root_ids']:
        to_roots[r] = to_references[r]
        to_root_ids.append(r)

    from_root_ids.sort()
    to_root_ids.sort()

    from_set = set(from_root_ids)
    to_set = set(to_root_ids)
    removed = from_set - to_set
    added = to_set - from_set

    combined_references = dict(from_references)
    for k in to_references.keys():
        combined_references[k] = to_references[k]

    value_refs = {}
    events = []

    for removed_root_id in removed:
        model = dict(combined_references[removed_root_id])
        del model['attributes']
        events.append({ 'kind' : 'RootRemoved',
                        'model' : model })

    for added_root_id in added:
        value_record_references(combined_references,
                                combined_references[added_root_id],
                                value_refs)
        model = dict(combined_references[added_root_id])
        del model['attributes']
        events.append({ 'kind' : 'RootAdded',
                        'model' : model })

    for id in to_references:
        if id in from_references:
            update_model_events = events_to_sync_objects(
                combined_references,
                from_references[id],
                to_references[id],
                value_refs
            )
            events.extend(update_model_events)

    return dict(
        events=events,
        references=list(value_refs.values())
    )

# This is used to send changes that happened between show() and push_notebook()
# and should be removed when a better implementation based on the bokeh protocol
# is available
def event_for_attribute_change(all_references, changed_obj, key, new_value, value_refs):
    '''

    '''

    event = dict(
        kind='ModelChanged',
        model=dict(id=changed_obj['id'], type=changed_obj['type']),
        attr=key,
        new=new_value,
    )
    value_record_references(all_references, new_value, value_refs)
    return event

# This is used to send changes that happened between show() and push_notebook()
# and should be removed when a better implementation based on the bokeh protocol
# is available
def events_to_sync_objects(all_references, from_obj, to_obj, value_refs):
    '''

    '''

    from_keys = set(from_obj['attributes'].keys())
    to_keys = set(to_obj['attributes'].keys())
    removed = from_keys - to_keys
    added = to_keys - from_keys
    shared = from_keys & to_keys

    events = []
    for key in removed:
        raise RuntimeError("internal error: should not be possible to delete attribute %s" % key)

    for key in added:
        new_value = to_obj['attributes'][key]
        events.append(event_for_attribute_change(all_references,
                                                 from_obj,
                                                 key,
                                                 new_value,
                                                 value_refs))

    for key in shared:
        old_value = from_obj['attributes'].get(key)
        new_value = to_obj['attributes'].get(key)

        if old_value is None and new_value is None:
            continue

        if old_value is None or new_value is None or old_value != new_value:
            event = event_for_attribute_change(all_references,
                                               from_obj,
                                               key,
                                               new_value,
                                               value_refs)
            events.append(event)

    return events

def initialize_references_json(references_json, references, setter=None):
    ''' Given a JSON representation of the models in a graph and new model objects,
    set the properties on the models from the JSON

    '''

    for obj in references_json:
        obj_id = obj['id']
        obj_attrs = obj['attributes']

        instance = references[obj_id]

        instance.update_from_json(obj_attrs, models=references, setter=setter)

def instantiate_references_json(references_json):
    ''' Given a JSON representation of all the models in a graph, return a
    dict of new model objects.

    '''

    # Create all instances, but without setting their props
    references = {}
    for obj in references_json:
        obj_id = obj['id']
        obj_type = obj.get('subtype', obj['type'])

        cls = get_class(obj_type)
        instance = cls(id=obj_id, _block_events=True)
        if instance is None:
            raise RuntimeError('Error loading model from JSON (type: %s, id: %s)' % (obj_type, obj_id))
        references[instance._id] = instance

    return references

def references_json(references):
    ''' Given a list of all models in a graph, return JSON representing
    them and their properties.

    Args:
        references (seq[Model]) :
            A list of models to convert to JSON

    Returns:
        list

    '''

    references_json = []
    for r in references:
        ref = r.ref
        ref['attributes'] = r._to_json_like(include_defaults=False)
        references_json.append(ref)

    return references_json

def value_record_references(all_references, v, result):
    '''

    '''
    if v is None: return

    if isinstance(v, dict) and set(['id', 'type']).issubset(set(v.keys())):
        if v['id'] not in result:
            ref = all_references[v['id']]
            result[v['id']] = ref
            value_record_references(all_references, ref['attributes'], result)

    elif isinstance(v, (list, tuple)):
        for elem in v:
            value_record_references(all_references, elem, result)

    elif isinstance(v, dict):
        for k, elem in v.items():
            value_record_references(all_references, elem, result)
