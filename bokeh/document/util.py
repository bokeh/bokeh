#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide ancillary utility functions useful for manipulating Bokeh
documents.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Dict

# Bokeh imports
from ..core.has_props import HasProps
from ..model import get_class

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'initialize_references_json',
    'instantiate_references_json',
    'references_json',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def initialize_references_json(references_json, references, setter=None):
    ''' Given a JSON representation of the models in a graph, and new model
    objects, set the properties on the models from the JSON

    Args:
        references_json (``JSON``)
            JSON specifying attributes and values to initialize new model
            objects with.

        references (dict[str, Model])
            A dictionary mapping model IDs to newly created (but not yet
            initialized) Bokeh models.

            **This is an "out" parameter**. The values it contains will be
            modified in-place.

        setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

    '''

    for obj in references_json:
        obj_id = obj['id']
        obj_attrs = obj['attributes']

        instance = references[obj_id]

        # We want to avoid any Model specific initialization that happens with
        # Slider(...) when reconstituting from JSON, but we do need to perform
        # general HasProps machinery that sets properties, so call it explicitly
        if not instance._initialized:
            HasProps.__init__(instance)

        instance.update_from_json(obj_attrs, models=references, setter=setter)

def instantiate_references_json(references_json, existing_instances: Dict[str, HasProps]):
    ''' Given a JSON representation of all the models in a graph, return a
    dict of new model objects.

    Args:
        references_json (``JSON``)
            JSON specifying new Bokeh models to create

    Returns:
        dict[str, Model]

    '''

    # Create all instances, but without setting their props
    references = {}
    for obj in references_json:
        obj_id = obj['id']
        obj_type = obj.get('subtype', obj['type'])

        if obj_id in existing_instances:
            references[obj_id] = existing_instances[obj_id]
        else:
            cls = get_class(obj_type)
            instance = cls.__new__(cls, id=obj_id)
            if instance is None:
                raise RuntimeError(f"Error loading model from JSON (type: {obj_type}, id: {obj_id})")
            references[instance.id] = instance

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
        struct = r.struct
        struct['attributes'] = r._to_json_like(include_defaults=False)
        references_json.append(struct)

    return references_json

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
