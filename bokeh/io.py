#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Anaconda, Inc. All rights reserved.
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

from functools import partial
import io
import json
import os
import warnings
import tempfile
import uuid

# Bokeh imports
from .core.state import State
from .document.util import compute_patch_between_json
from .embed import server_document, notebook_div, notebook_content, file_html
from .layouts import gridplot, GridSpec ; gridplot, GridSpec
from .models import Plot
from .resources import INLINE
import bokeh.util.browser as browserlib  # full import needed for test mocking to work
from .util.dependencies import import_required, detect_phantomjs
from .util.notebook import get_comms, load_notebook, EXEC_MIME_TYPE, JS_MIME_TYPE, HTML_MIME_TYPE
from .util.string import decode_utf8
from .util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

_state = State()

_notebook_hooks = {}

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

# This exists only for testing
def publish_display_data(*args, **kw):
    # This import MUST be deferred or it introduces a hard dependency on ipython
    from IPython.display import publish_display_data as pdd
    return pdd(*args, **kw)

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
    if notebook_type in _notebook_hooks and not overwrite:
        raise RuntimeError("hook for notebook type %r already exists" % notebook_type)
    _notebook_hooks[notebook_type] = dict(load=load, doc=show_doc, app=show_app)

def _run_notebook_hook(notebook_type, action, *args, **kw):
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
    if notebook_type not in _notebook_hooks:
        raise RuntimeError("no display hook installed for notebook type %r" % notebook_type)
    if _notebook_hooks[notebook_type][action] is None:
        raise RuntimeError("notebook hook for %r did not install %r action" % notebook_type, action)
    return _notebook_hooks[notebook_type][action](*args, **kw)

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

def output_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000, notebook_type='jupyter'):
    ''' Configure the default output state to generate output in notebook cells
    when :func:`show` is called.

    Args:
        resources (Resource, optional) :
            How and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to display detailed BokehJS banner (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

        notebook_type (string, optional):
            Notebook type (default: jupyter)

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
    # verify notebook_type first in _state.output_notebook
    _state.output_notebook(notebook_type)
    _run_notebook_hook(notebook_type, 'load', resources, verbose, hide_banner, load_timeout)

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
        Document : the current default document object.

    '''
    return _state.document

def curstate():
    ''' Return the current State object

    Returns:
      State : the current default State object

    '''
    return _state

def show(obj, browser=None, new="tab", notebook_handle=False, notebook_url="localhost:8888"):
    ''' Immediately display a Bokeh object or application.

    Args:
        obj (LayoutDOM or Application) :
            A Bokeh object to display.

            Bokeh plots, widgets, layouts (i.e. rows and columns) may be
            passed to ``show`` in order to display them. When ``output_file``
            has been called, the output will be to an HTML file, which is also
            opened in a new browser window or tab. When ``output_notebook``
            has been called in a Jupyter notebook, the output will be inline
            in the associated notebook output cell.

            In a Jupyter notebook, a Bokeh application may also be passed.
            The application will be run and displayed inline in the associated
            notebook output cell.

        browser (str, optional) :
            Specify the browser to use to open output files(default: None)

            For file output, the **browser** argument allows for specifying
            which browser to display in, e.g. "safari", "firefox", "opera",
            "windows-default". Not all platforms may support this option, see
            the documentation for the standard library webbrowser_ module for
            more information

        new (str, optional) :
            Specify the browser mode to use for output files (default: "tab")

            For file output, opens or raises the browser window showing the
            current output file.  If **new** is 'tab', then opens a new tab.
            If **new** is 'window', then opens a new window.

        notebook_handle (bool, optional) :
            Whether to create a notebook interaction handle (default: False)

            For notebook output, toggles whether a handle which can be used
            with ``push_notebook`` is returned. Note that notebook handles
            only apply to standalone plots, layouts, etc. They do not apply
            when showing Applications in the notebook.

        notebook_url (URL, optional) :
            Location of the Jupyter notebook page (default: "localhost:8888")

            When showing Bokeh applications, the Bokeh server must be
            explicitly configured to allow connections originating from
            different URLs. This parameter defaults to the standard notebook
            host and port. If you are running on a differnet location, you
            will need to supply this value for the application to display
            properly.

            It is also possible to pass ``notebook_url="*"`` to disable the
            standard checks, so that applications will display regardless of
            the current notebook location, however a warning will appear.


    Some parameters are only useful when certain output modes are active:

    * The ``browser`` and ``new`` parameters only apply when ``output_file``
      is active.

    * The ``notebook_handle`` parameter only applies when ``output_notebook``
      is active, and non-Application objects are being shown. It is only supported to Jupyter notebook,
      raise exception for other notebook types when it is True.

    * The ``notebook_url`` parameter only applies when showing Bokeh
      Applications in a Jupyter notebook.

    Returns:
        When in a Jupyter notebook (with ``output_notebook`` enabled)
        and ``notebook_handle=True``, returns a handle that can be used by
        ``push_notebook``, None otherwise.

    .. _webbrowser: https://docs.python.org/2/library/webbrowser.html

    '''

    # This ugliness is to prevent importing bokeh.application (which would bring
    # in Tornado) just in order to show a non-server object
    if getattr(obj, '_is_a_bokeh_application_class', False):
        return _run_notebook_hook(_state.notebook_type, 'app', obj, _state, notebook_url)

    if obj not in _state.document.roots:
        _state.document.add_root(obj)
    return _show_with_state(obj, _state, browser, new, notebook_handle=notebook_handle)

def _show_jupyter_app_with_state(app, state, notebook_url):
    logging.basicConfig()
    from tornado.ioloop import IOLoop
    from .server.server import Server
    loop = IOLoop.current()
    server = Server({"/": app}, io_loop=loop, port=0,  allow_websocket_origin=[notebook_url])

    server_id = uuid.uuid4().hex
    _state.uuid_to_server[server_id] = server

    server.start()
    url = 'http://%s:%d%s' % (notebook_url.split(':')[0], server.port, "/")
    script = server_document(url)

    publish_display_data({HTML_MIME_TYPE: script, EXEC_MIME_TYPE: ""}, metadata={EXEC_MIME_TYPE: {"server_id": server_id}})

def _show_with_state(obj, state, browser, new, notebook_handle=False):
    controller = browserlib.get_browser_controller(browser=browser)

    comms_handle = None
    shown = False

    if state.notebook:
        comms_handle = _show_notebook_doc_with_state(obj, state, notebook_handle)
        shown = True

    if state.file or not shown:
        _show_file_with_state(obj, state, new, controller)

    return comms_handle

# Note: this function mostly exists so it can be mocked in tests
def _show_notebook_doc_with_state(obj, state, notebook_handle):
    return _run_notebook_hook(state.notebook_type, 'doc', obj, state, notebook_handle)

def _show_file_with_state(obj, state, new, controller):
    filename = save(obj, state=state)
    controller.open("file://" + filename, new=browserlib.NEW_PARAM[new])

def _show_jupyter_doc_with_state(obj, state, notebook_handle):
    comms_target = make_id() if notebook_handle else None
    (script, div) = notebook_content(obj, comms_target)

    publish_display_data({HTML_MIME_TYPE: div})
    publish_display_data({JS_MIME_TYPE: script, EXEC_MIME_TYPE: ""}, metadata={EXEC_MIME_TYPE: {"id": obj._id}})
    if comms_target:
        handle = _CommsHandle(get_comms(comms_target), state.document,
                              state.document.to_json())
        state.last_comms_handle = handle
        return handle

# TODO (bev) This should eventually be removed, but install a basic built-in hook for docs or now
def _show_zeppelin_doc_with_state(obj, state, notebook_handle):
    if notebook_handle:
        raise ValueError("Zeppelin doesn't support notebook_handle.")
    print("%html " + notebook_div(obj))
    return None

def save(obj, filename=None, resources=None, title=None, state=None, **kwargs):
    ''' Save an HTML file with the data for the current document.

    Will fall back to the default output state (or an explicitly provided
    :class:`State` object) for ``filename``, ``resources``, or ``title`` if they
    are not provided. If the filename is not given and not provided via output state,
    it is derived from the script name (e.g. ``/foo/myplot.py`` will create
    ``/foo/myplot.html``)

    Args:
        obj (LayoutDOM object) : a Layout (Row/Column), Plot or Widget object to display

        filename (str, optional) : filename to save document under (default: None)
            If None, use the default state configuration.

        resources (Resources, optional) : A Resources config to use (default: None)
            If None, use the default state configuration, if there is one.
            otherwise use ``resources.INLINE``.

        title (str, optional) : a title for the HTML document (default: None)
            If None, use the default state title value, if there is one.
            Otherwise, use "Bokeh Plot"

         state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

    Returns:
        str: the filename where the HTML file is saved.

    '''

    if state is None:
        state = _state

    filename, resources, title = _get_save_args(state, filename, resources, title)
    _save_helper(obj, filename, resources, title)
    return os.path.abspath(filename)

def _no_access(basedir):
    ''' Return True if the given base dir is not accessible or writeable

    '''
    return not os.access(basedir, os.W_OK | os.X_OK)

def _shares_exec_prefix(basedir):
    ''' Whether a give base directory is on the system exex prefix

    '''
    import sys
    prefix = sys.exec_prefix
    return (prefix is not None and basedir.startswith(prefix))

def _temp_filename(ext):
    ''' Generate a temporary, writable filename with the given extension

    '''
    return tempfile.NamedTemporaryFile(suffix="." + ext).name

def _detect_current_filename():
    ''' Attempt to return the filename of the currently running Python process

    Returns None if the filename cannot be detected.
    '''
    import inspect

    filename = None
    frame = inspect.currentframe()
    try:
        while frame.f_back and frame.f_globals.get('name') != '__main__':
            frame = frame.f_back

        filename = frame.f_globals.get('__file__')
    finally:
        del frame

    return filename

def default_filename(ext):
    ''' Generate a default filename with a given extension, attempting to use
    the filename of the currently running process, if possible.

    If the filename of the current process is not available (or would not be
    writable), then a temporary file with the given extension is returned.

    Args:
        ext (str) : the desired extension for the filename

    Returns:
        str

    Raises:
        RuntimeError
            If the extensions requested is ".py"

    '''
    if ext == "py":
        raise RuntimeError("asked for a default filename with 'py' extension")

    from os.path import dirname, basename, splitext, join

    filename = _detect_current_filename()

    if filename is None:
        return _temp_filename(ext)

    basedir = dirname(filename) or os.getcwd()

    if _no_access(basedir) or _shares_exec_prefix(basedir):
        return _temp_filename(ext)

    name, _ = splitext(basename(filename))
    return join(basedir, name + "." + ext)

def _get_save_args(state, filename, resources, title):
    warn = True

    if filename is None and state.file:
        filename = state.file['filename']

    if filename is None:
        warn = False
        filename = default_filename("html")

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

def _save_helper(obj, filename, resources, title):
    html = file_html(obj, resources, title=title)

    with io.open(filename, mode="w", encoding="utf-8") as f:
        f.write(decode_utf8(html))

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
        msg = compute_patch_between_json(handle.json, to_json)

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

def _destroy_server(server_id):
    ''' Given a UUID id of a div removed or replaced in the Jupyter
    notebook, destroy the corresponding server sessions and stop it.

    '''
    server = _state.uuid_to_server.get(server_id, None)
    if server is None:
        logger.debug("No server instance found for uuid: %r" % server_id)
        return

    try:
        for session in server.get_sessions():
            session.destroy()
        server.stop()
        del _state.uuid_to_server[server_id]

    except Exception as e:
        logger.debug("Could not destroy server for id %r: %s" % (server_id, e))

def _wait_until_render_complete(driver):
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.common.exceptions import TimeoutException

    script = """
    // add private window prop to check that render is complete
    window._bokeh_render_complete = false;
    function done() {
      window._bokeh_render_complete = true;
    }

    var doc = window.Bokeh.documents[0];

    if (doc.is_idle)
      done();
    else
      doc.idle.connect(done);
    """
    driver.execute_script(script)

    def is_bokeh_render_complete(driver):
        return driver.execute_script('return window._bokeh_render_complete;')

    try:
        WebDriverWait(driver, 5, poll_frequency=0.1).until(is_bokeh_render_complete)
    except TimeoutException:
        logger.warn("The webdriver raised a TimeoutException while waiting for \
                     a 'bokeh:idle' event to signify that the layout has rendered. \
                     Something may have gone wrong.")
    finally:
        browser_logs = driver.get_log('browser')
        severe_errors = [l for l in browser_logs if l.get('level') == 'SEVERE']
        if len(severe_errors) > 0:
            logger.warn("There were severe browser errors that may have affected your export: {}".format(severe_errors))

def _save_layout_html(obj, resources=INLINE, **kwargs):
    resize = False
    if kwargs.get('height') is not None or kwargs.get('width') is not None:
        if not isinstance(obj, Plot):
            warnings.warn("Export method called with height or width kwargs on a non-Plot layout. The size values will be ignored.")
        else:
            resize = True
            old_height = obj.plot_height
            old_width = obj.plot_width
            obj.plot_height = kwargs.get('height', old_height)
            obj.plot_width = kwargs.get('width', old_width)

    html_path = tempfile.NamedTemporaryFile(suffix=".html").name
    save(obj, filename=html_path, resources=resources, title="")

    if resize:
        obj.plot_height = old_height
        obj.plot_width = old_width

    return html_path

def _crop_image(image, left=0, top=0, right=0, bottom=0, **kwargs):
    '''Crop the border from the layout'''
    cropped_image = image.crop((left, top, right, bottom))

    return cropped_image

def _get_screenshot_as_png(obj, driver=None, **kwargs):
    webdriver = import_required('selenium.webdriver',
                                'To use bokeh.io.export_png you need selenium ' +
                                '("conda install -c bokeh selenium" or "pip install selenium")')

    Image = import_required('PIL.Image',
                            'To use bokeh.io.export_png you need pillow ' +
                            '("conda install pillow" or "pip install pillow")')
    # assert that phantomjs is in path for webdriver
    detect_phantomjs()

    html_path = _save_layout_html(obj, **kwargs)

    web_driver = driver if driver is not None else webdriver.PhantomJS(service_log_path=os.path.devnull)

    web_driver.get("file:///" + html_path)
    web_driver.maximize_window()

    ## resize for PhantomJS compat
    web_driver.execute_script("document.body.style.width = '100%';")

    _wait_until_render_complete(web_driver)

    png = web_driver.get_screenshot_as_png()

    bounding_rect_script = "return document.getElementsByClassName('bk-root')[0].children[0].getBoundingClientRect()"
    b_rect = web_driver.execute_script(bounding_rect_script)

    if driver is None: # only quit webdriver if not passed in as arg
        web_driver.quit()

    image = Image.open(io.BytesIO(png))
    cropped_image = _crop_image(image, **b_rect)

    return cropped_image

def export_png(obj, filename=None, height=None, width=None, webdriver=None):
    ''' Export the LayoutDOM object or document as a PNG.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.png``)

    Args:
        obj (LayoutDOM or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        filename (str, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

    Returns:
        filename (str) : the filename where the static file is saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    .. warning::
        Glyphs that are rendered via webgl won't be included in the generated PNG.

    '''

    image = _get_screenshot_as_png(obj, height=height, width=width, driver=webdriver)

    if filename is None:
        filename = default_filename("png")

    image.save(filename)

    return os.path.abspath(filename)

def _get_svgs(obj, driver=None, **kwargs):
    webdriver = import_required('selenium.webdriver',
                                'To use bokeh.io.export_svgs you need selenium ' +
                                '("conda install -c bokeh selenium" or "pip install selenium")')
    # assert that phantomjs is in path for webdriver
    detect_phantomjs()

    html_path = _save_layout_html(obj, **kwargs)

    web_driver = driver if driver is not None else webdriver.PhantomJS(service_log_path=os.path.devnull)
    web_driver.get("file:///" + html_path)

    _wait_until_render_complete(web_driver)

    svg_script = """
    var serialized_svgs = [];
    var svgs = document.getElementsByClassName('bk-root')[0].getElementsByTagName("svg");
    for (var i = 0; i < svgs.length; i++) {
        var source = (new XMLSerializer()).serializeToString(svgs[i]);
        serialized_svgs.push(source);
    };
    return serialized_svgs
    """

    svgs = web_driver.execute_script(svg_script)

    if driver is None: # only quit webdriver if not passed in as arg
        web_driver.quit()

    return svgs

def export_svgs(obj, filename=None, height=None, width=None, webdriver=None):
    ''' Export the SVG-enabled plots within a layout. Each plot will result
    in a distinct SVG file.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.svg``)

    Args:
        obj (LayoutDOM object) : a Layout (Row/Column), Plot or Widget object to display

        filename (str, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

    Returns:
        filenames (list(str)) : the list of filenames where the SVGs files
            are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = _get_svgs(obj, height=height, width=width, driver=webdriver)

    if len(svgs) == 0:
        logger.warn("No SVG Plots were found.")
        return

    if filename is None:
        filename = default_filename("svg")

    filenames = []

    for i, svg in enumerate(svgs):
        if i == 0:
            filename = filename
        else:
            idx = filename.find(".svg")
            filename = filename[:idx] + "_{}".format(i) + filename[idx:]

        with io.open(filename, mode="w", encoding="utf-8") as f:
            f.write(svg)

        filenames.append(filename)

    return filenames


def _install_notebook_hook():
    install_notebook_hook('jupyter', partial(load_notebook, notebook_type='jupyter'), _show_jupyter_doc_with_state, _show_jupyter_app_with_state, overwrite=True)
    # TODO (bev) These should eventually be removed, but install a basic built-in hook for docs or now
    install_notebook_hook('zeppelin', partial(load_notebook, notebook_type='zeppelin'), _show_zeppelin_doc_with_state, None, overwrite=True)

_install_notebook_hook()
