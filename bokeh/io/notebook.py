#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
logger = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
from warnings import warn

# Bokeh imports
from .state import curstate

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

@public((1,0,0))
class CommsHandle(object):
    '''

    '''
    _json = {}

    def __init__(self, comms, doc, json):
        self._cellno = None
        try:
            from IPython import get_ipython
            ip = get_ipython()
            hm = ip.history_manager
            p_prompt = list(hm.get_tail(1, include_latest=True))[0][1]
            self._cellno = p_prompt
        except Exception as e:
            logger.debug("Could not get Notebook cell number, reason: %s", e)

        self._comms = comms
        self._doc = doc
        self._json[doc] = json

    def _repr_html_(self):
        if self._cellno is not None:
            return "<p><code>&lt;Bokeh Notebook handle for <strong>In[%s]</strong>&gt;</code></p>" % str(self._cellno)
        else:
            return "<p><code>&lt;Bokeh Notebook handle&gt;</code></p>"

    @property
    @public((1,0,0))
    def comms(self):
        return self._comms

    @property
    @public((1,0,0))
    def doc(self):
        return self._doc

    @property
    @public((1,0,0))
    def json(self):
        return self._json[self._doc]

    @public((1,0,0))
    def update(self, doc, json):
        self._doc = doc
        self._json[doc] = json

@public((1,0,0))
def install_notebook_hook(notebook_type, load, show_doc, show_app, overwrite=False):
    ''' Install a new notebook display hook.

    Bokeh comes with support for Jupyter notebooks built-in. However, there are
    other kinds of notebooks in use by different communities. This function
    provides a mechanism for other projects to instruct Bokeh how to display
    content in other notebooks.

    This function is primarily of use to developers wishing to integrate Bokeh
    with new notebook types.

    Args:
        notebook_type (str) :
            A name for the notebook type, e.e. ``'Jupyter'`` or ``'Zeppelin'``

            If the name has previously been installed, a ``RuntimeError`` will
            be raised, unless ``overwrite=True``

        load (callable) :
            A function for loading BokehJS in a notebook type. The function
            will be called with the following arguments:

            .. code-block:: python

                load(
                    resources,   # A Resources object for how to load BokehJS
                    verbose,     # Whether to display verbose loading banner
                    hide_banner, # Whether to hide the output banner entirely
                    load_timeout # Time after which to report a load fail error
                )

        show_doc (callable) :
            A function for displaying Bokeh standalone documents in the
            notebook type. This function will be called with the following
            arguments:

            .. code-block:: python

                show_doc(
                    obj,            # the Bokeh object to display
                    state,          # current bokeh.io "state"
                    notebook_handle # whether a notebook handle was requested
                )

            If the notebook platform is capable of supporting in-place updates
            to plots then this function may return an opaque notebook handle
            that can  be used for that purpose. The handle will be returned by
            ``show()``, and can be used by as appropriate to update plots, etc.
            by additional functions in the library that installed the hooks.

        show_app (callable) :
            A function for displaying Bokeh applications in the notebook
            type. This function will be called with the following arguments:

            .. code-block:: python

                show_app(
                    app,         # the Bokeh Application to display
                    state,       # current bokeh.io "state"
                    notebook_url # URL to the current active notebook page
                )

        overwrite (bool, optional) :
            Whether to allow an existing hook to be overwritten by a new
            definition (default: False)

    Returns:
        None

    Raises:
        RuntimeError
            If ``notebook_type`` is already installed and ``overwrite=False``

    '''
    if notebook_type in _HOOKS and not overwrite:
        raise RuntimeError("hook for notebook type %r already exists" % notebook_type)
    _HOOKS[notebook_type] = dict(load=load, doc=show_doc, app=show_app)

@public((1,0,0))
def push_notebook(document=None, state=None, handle=None):
    ''' Update Bokeh plots in a Jupyter notebook output cells with new data
    or property values.

    When working the the notebook, the ``show`` function can be passed the
    argument ``notebook_handle=True``, which will cause it to return a
    handle object that can be used to update the Bokeh output later. When
    ``push_notebook`` is called, any property updates (e.g. plot titles or
    data source values, etc.) since the last call to ``push_notebook`` or
    the original ``show`` call are applied to the Bokeh output in the
    previously rendered Jupyter output cell.

    Several example notebooks can be found in the GitHub repository in
    the :bokeh-tree:`examples/howto/notebook_comms` directory.

    Args:

        document (Document, optional) :
            A :class:`~bokeh.document.Document` to push from. If None,
            uses ``curdoc()``. (default: None)

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            state (set by ``output_file``, etc.) is used. (default: None)

    Returns:
        None

    Examples:

        Typical usage is typically similar to this:

        .. code-block:: python

            from bokeh.plotting import figure
            from bokeh.io import output_notebook, push_notebook, show

            output_notebook()

            plot = figure()
            plot.circle([1,2,3], [4,6,5])

            handle = show(plot, notebook_handle=True)

            # Update the plot title in the earlier cell
            plot.title.text = "New Title"
            push_notebook(handle=handle)

    '''
    if state is None:
        state = curstate()

    if not document:
        document = state.document

    if not document:
        warn("No document to push")
        return

    if handle is None:
        handle = state.last_comms_handle

    if not handle:
        warn("Cannot find a last shown plot to update. Call output_notebook() and show(..., notebook_handle=True) before push_notebook()")
        return

    to_json = document.to_json()
    if handle.doc is not document:
        msg = dict(doc=to_json)
    else:
        msg = _compute_patch_between_json(handle.json, to_json)

    handle.comms.send(json.dumps(msg))
    handle.update(document, to_json)

@public((1,0,0))
def run_notebook_hook(notebook_type, action, *args, **kw):
    ''' Run an installed notebook hook with supplied arguments.

    Args:
        noteboook_type (str) :
            Name of an existing installed notebook hook

        actions (str) :
            Name of the hook action to execute, ``'doc'`` or ``'app'``

    All other arguments and keyword arguments are passed to the hook action
    exactly as supplied.

    Returns:
        Result of the hook action, as-is

    Raises:
        RunetimeError
            If the hook or specific action is not installed

    '''
    if notebook_type not in _HOOKS:
        raise RuntimeError("no display hook installed for notebook type %r" % notebook_type)
    if _HOOKS[notebook_type][action] is None:
        raise RuntimeError("notebook hook for %r did not install %r action" % notebook_type, action)
    return _HOOKS[notebook_type][action](*args, **kw)

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

@internal((1,0,0))
def destroy_server(server_id):
    ''' Given a UUID id of a div removed or replaced in the Jupyter
    notebook, destroy the corresponding server sessions and stop it.

    '''
    server = curstate().uuid_to_server.get(server_id, None)
    if server is None:
        logger.debug("No server instance found for uuid: %r" % server_id)
        return

    try:
        for session in server.get_sessions():
            session.destroy()
        server.stop()
        del curstate().uuid_to_server[server_id]

    except Exception as e:
        logger.debug("Could not destroy server for id %r: %s" % (server_id, e))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_HOOKS = {}

# TODO (bev) To be removed when push_notebook is re-implemented
def _compute_patch_between_json(from_json, to_json):
    ''' Compute a JSON diff between a two Bokeh document states.

    .. note::
        This function is used to send changes that happened between calls to
        ``show()`` and ``push_notebook()`` and will be removed when a better
        implementation based on the Bokeh protocol is available.

    Args:
        from_json (``JSON``)
            JSON representing a "starting" Bokeh document state

        to_json (``JSON``)
            JSON representing a "final" Bokeh document state

    Returns
        ``JSON``

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
        _value_record_references(combined_references,
                                combined_references[added_root_id],
                                value_refs)
        model = dict(combined_references[added_root_id])
        del model['attributes']
        events.append({ 'kind' : 'RootAdded',
                        'model' : model })

    for id in to_references:
        if id in from_references:
            update_model_events = _events_to_sync_objects(
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

# TODO (bev) To be removed when push_notebook is re-implemented
def _event_for_attribute_change(all_references, changed_obj, key, new_value, value_refs):
    event = dict(
        kind='ModelChanged',
        model=dict(id=changed_obj['id'], type=changed_obj['type']),
        attr=key,
        new=new_value,
    )
    _value_record_references(all_references, new_value, value_refs)
    return event

# TODO (bev) To be removed when push_notebook is re-implemented
def _events_to_sync_objects(all_references, from_obj, to_obj, value_refs):
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
        events.append(_event_for_attribute_change(all_references,
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
            event = _event_for_attribute_change(all_references,
                                               from_obj,
                                               key,
                                               new_value,
                                               value_refs)
            events.append(event)

    return events

# TODO (bev) To be removed when push_notebook is re-implemented
def _value_record_references(all_references, value, result):
    if value is None: return

    if isinstance(value, dict) and set(['id', 'type']).issubset(set(value.keys())):
        if value['id'] not in result:
            ref = all_references[value['id']]
            result[value['id']] = ref
            _value_record_references(all_references, ref['attributes'], result)

    elif isinstance(value, (list, tuple)):
        for elem in value:
            _value_record_references(all_references, elem, result)

    elif isinstance(value, dict):
        for k, elem in value.items():
            _value_record_references(all_references, elem, result)
