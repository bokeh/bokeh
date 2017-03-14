#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions for configuring Bokeh output.

'''

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

# Stdlib imports
import logging
logger = logging.getLogger(__name__)

import io
import json
import os
import warnings
import tempfile

# Third-party imports

# Bokeh imports
from .core.state import State
from .document import Document
from .embed import notebook_div, standalone_html_page_for_models
from .models.layouts import LayoutDOM
from .layouts import gridplot, GridSpec ; gridplot, GridSpec
import bokeh.util.browser as browserlib  # full import needed for test mocking to work
from .util.notebook import load_notebook, publish_display_data, get_comms
from .util.string import decode_utf8
from .util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

_new_param = {'tab': 2, 'window': 1}

_state = State()

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class _CommsHandle(object):

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
    def comms(self):
        return self._comms

    @property
    def doc(self):
        return self._doc

    @property
    def json(self):
        return self._json[self._doc]

    def update(self, doc, json):
        self._doc = doc
        self._json[doc] = json


def output_file(filename, title="Bokeh Plot", mode="cdn", root_dir=None):
    '''Configure the default output state to generate output saved
    to a file when :func:`show` is called.

    Does not change the current Document from curdoc(). File and notebook
    output may be active at the same time, so e.g., this does not clear the
    effects of ``output_notebook()``.

    Args:
        filename (str) : a filename for saving the HTML document

        title (str, optional) : a title for the HTML document (default: "Bokeh Plot")

        mode (str, optional) : how to include BokehJS (default: ``'cdn'``)
            One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
            ``'absolute(-dev)'``. See :class:`bokeh.resources.Resources` for more details.

        root_dir (str, optional) : root directory to use for 'absolute' resources. (default: None)
            This value is ignored for other resource types, e.g. ``INLINE`` or
            ``CDN``.

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    .. warning::
        This output file will be overwritten on every save, e.g., each time
        show() or save() is invoked.

    '''
    _state.output_file(
        filename,
        title=title,
        mode=mode,
        root_dir=root_dir
    )

def output_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000):
    ''' Configure the default output state to generate output in
    Jupyter notebook cells when :func:`show` is called.

    Args:
        resources (Resource, optional) :
            How and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to display detailed BokehJS banner (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
    load_notebook(resources, verbose, hide_banner, load_timeout)
    _state.output_notebook()

def set_curdoc(doc):
    '''Configure the current document (returned by curdoc()).

    Args:
        doc (Document) : Document we will output.

    Returns:
        None

    .. warning::
        Calling this function will replace any existing document.

    '''
    _state.document = doc

def curdoc():
    ''' Return the document for the current default state.

    Returns:
        doc : the current default document object.

    '''
    return _state.document

def curstate():
    ''' Return the current State object

    Returns:
      state : the current default State object
    '''
    return _state

def show(obj, browser=None, new="tab", notebook_handle=False):
    ''' Immediately display a plot object.

    In a Jupyter notebook, the output is displayed in an output cell. Otherwise,
    a browser window or tab is autoraised to display the plot object.

    Args:
        obj (LayoutDOM object) : a Layout (Row/Column), Plot or Widget object to display

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows
            specifying which browser to display in, e.g. "safari", "firefox",
            "opera", "windows-default" (see the ``webbrowser`` module
            documentation in the standard lib for more details).

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.

        notebook_handle (bool, optional): create notebook interaction handle (default: False)
            For notebook output, toggles whether a handle which can be
            used with ``push_notebook`` is returned.

    Returns:
        when in a jupyter notebook (with ``output_notebook`` enabled)
        and ``notebook_handle=True``, returns a handle that can be used by
        ``push_notebook``, None otherwise.

    .. note::
        The ``browser`` and ``new`` parameters are ignored when showing in
        a Jupyter notebook.

    '''
    if obj not in _state.document.roots:
        _state.document.add_root(obj)
    return _show_with_state(obj, _state, browser, new, notebook_handle=notebook_handle)


def _show_with_state(obj, state, browser, new, notebook_handle=False):
    controller = browserlib.get_browser_controller(browser=browser)

    comms_handle = None
    shown = False

    if state.notebook:
        comms_handle = _show_notebook_with_state(obj, state, notebook_handle)
        shown = True

    if state.file or not shown:
        _show_file_with_state(obj, state, new, controller)

    return comms_handle

def _show_file_with_state(obj, state, new, controller):
    filename = save(obj, state=state)
    controller.open("file://" + filename, new=_new_param[new])

def _show_notebook_with_state(obj, state, notebook_handle):
    comms_target = make_id() if notebook_handle else None
    publish_display_data({'text/html': notebook_div(obj, comms_target)})
    if comms_target:
        handle = _CommsHandle(get_comms(comms_target), state.document,
                              state.document.to_json())
        state.last_comms_handle = handle
        return handle

def save(obj, filename=None, resources=None, title=None, state=None, validate=True):
    ''' Save an HTML file with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``filename``, ``resources``, or ``title`` if they
    are not provided. If the filename is not given and not provided via output state,
    it is derived from the script name (e.g. ``/foo/myplot.py`` will create
    ``/foo/myplot.html``)

    Args:
        obj (Document or model object) : a plot object to save

        filename (str, optional) : filename to save document under (default: None)
            If None, use the default state configuration, otherwise raise a
            ``RuntimeError``.

        resources (Resources, optional) : A Resources config to use (default: None)
            If None, use the default state configuration, if there is one.
            otherwise use ``resources.INLINE``.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use the default state title value, if there is one.
            Otherwise, use "Bokeh Plot"

        validate (bool, optional) : True to check integrity of the models

    Returns:
        filename (str) : the filename where the HTML file is saved.

    Raises:
        RuntimeError

    '''
    if state is None:
        state = _state

    filename, resources, title = _get_save_args(state, filename, resources, title)
    _save_helper(obj, filename, resources, title, validate)
    return os.path.abspath(filename)

def _detect_filename(ext):
    """ Detect filename from the name of the script being run. Returns
    temporary file if the script could not be found or the location of the
    script does not have write permission (e.g. interactive mode).
    """
    import inspect
    from os.path import dirname, basename, splitext, join, curdir

    frame = inspect.currentframe()
    while frame.f_back and frame.f_globals.get('name') != '__main__':
        frame = frame.f_back

    filename = frame.f_globals.get('__file__')

    if filename is None or not os.access(dirname(filename) or curdir, os.W_OK | os.X_OK):
        return tempfile.NamedTemporaryFile(suffix="." + ext).name

    name, _ = splitext(basename(filename))
    return join(dirname(filename), name + "." + ext)

def _get_save_args(state, filename, resources, title):
    warn = True

    if filename is None and state.file:
        filename = state.file['filename']

    if filename is None:
        warn = False
        filename = _detect_filename("html")

    if resources is None and state.file:
        resources = state.file['resources']

    if resources is None:
        if warn:
            warnings.warn("save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN")

        from .resources import CDN
        resources = CDN

    if title is None and state.file:
        title = state.file['title']

    if title is None:
        if warn:
            warnings.warn("save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'")

        title = "Bokeh Plot"

    return filename, resources, title

def _save_helper(obj, filename, resources, title, validate):
    remove_after = False
    if isinstance(obj, LayoutDOM):
        if obj.document is None:
            Document().add_root(obj)
            remove_after = True
        doc = obj.document
    elif isinstance(obj, Document):
        doc = obj
    else:
        raise RuntimeError("Unable to save object of type '%s'" % type(obj))

    if validate:
        doc.validate()

    html = standalone_html_page_for_models(doc, resources, title)

    with io.open(filename, mode="w", encoding="utf-8") as f:
        f.write(decode_utf8(html))

    if remove_after:
        doc.remove_root(obj)

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
            uses ``curdoc()``.

        state (State, optional) :
            A Bokeh State object

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
            plot.title = "New Title"
            push_notebook(handle=handle)

    '''
    if state is None:
        state = _state

    if not document:
        document = state.document

    if not document:
        warnings.warn("No document to push")
        return

    if handle is None:
        handle = state.last_comms_handle

    if not handle:
        warnings.warn("Cannot find a last shown plot to update. Call output_notebook() and show(..., notebook_handle=True) before push_notebook()")
        return

    to_json = document.to_json()
    if handle.doc is not document:
        msg = dict(doc=to_json)
    else:
        msg = Document._compute_patch_between_json(handle.json, to_json)

    handle.comms.send(json.dumps(msg))
    handle.update(document, to_json)

def reset_output(state=None):
    ''' Clear the default state of all output modes.

    Returns:
        None

    '''
    _state.reset()

def _remove_roots(subplots):
    doc = _state.document
    for sub in subplots:
        if sub in doc.roots:
            doc.remove_root(sub)
