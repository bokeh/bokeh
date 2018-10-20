#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide ancillary utility functions useful for manipulating Bokeh
documents.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
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

        instance.update_from_json(obj_attrs, models=references, setter=setter)

def instantiate_references_json(references_json):
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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
