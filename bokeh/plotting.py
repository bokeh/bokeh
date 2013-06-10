""" Command-line driven plotting functions, a la Matplotlib  / Matlab / etc.
"""

from functools import wraps

from .session import HTMLFileSession, PlotServerSession, NotebookSession

# A bunch of this stuff is copied from chaco.shell, because that layout is
# pretty reasonable.

def plothelp():
    """ Prints out a list of all plotting functions.  Information on each
    function is available in its docstring.
    """

    helpstr = """
    Renderers
    ---------
    scatter, line, bar, candle, hbar, imshow, contour, contourf

    Plotting
    --------
    plot
        plots some data, with options for line, scatter, bar
    pcolor
        plots some scalar data as a pseudocolor image
    loglog
        plots an x-y line or scatter plot on log-log scale
    semilogx
        plots an x-y line or scatter plot with a log x-scale
    semilogy
        plots an x-y line or scatter plot with a log y-scale
    #imread
    #    creates an array from an image file on disk

    Axes, Annotations, Legends
    --------------------------
    xaxis
        toggles the horizontal axis, sets the interval
    yaxis
        toggles the vertical axis, sets the interval
    xgrid
        toggles the grid running along the X axis
    ygrid
        toggles the grid running along the Y axis
    xtitle
        sets the title of a horizontal axis
    ytitle
        sets the title of a vertical axis
    xscale
        sets the tick scale system of the X axis
    yscale
        sets the tick scale system of the Y axis
    title
        sets the title of the plot

    Layout
    ------
    grid
        configures a grid plot

    Display & Session management
    ----------------------------
    show
        forces the plot to be rendered to the currently set output device
        or mode (e.g. static HTML file, IPython notebook, plot server)
    setoutput
        sets the output mode
    hold
        turns "hold" on or off
    """
    print helpstr


DEFAULT_SERVER_URL = "localhost:5006"

_globals = {
    # The current output mode.  Valid combinations:
    #   type       | uri
    #   -----------+--------------
    #   "file"     | filename
    #   "url"      | <URL>
    #   "ipython"  | None (embedded data & scripts)
    #   "ipython"  | <URL>
    "output_type": None,
    "output_url": None,
    "plotserver_url": DEFAULT_SERVER_URL,

    # The currently active Session object
    "session": None,

    # Current plot or "figure"
    "curplot": None,

    # hold state
    "hold": False,
    }

def setoutput(type_or_filename, URL="default", **kwargs):
    """ Sets the output mode for all of the plotting functions.

    setoutput(URL, docname, **kwargs)
        Connects to a Bokeh server at the given URL & port. Default bokeh
        server address is defined in DEFAULT_SERVER_URL.  Docname is the
        name of the document to store in the plot server.  If there is an
        existing document with this name, it will be overwritten.
    setoutput("ipython", URL="default", **kwargs)
        Outputs HTML objects suitable for embedding in IPython notebook.  If 
        URL is "default", then uses the default plot server URLs etc. for
        Bokeh.  If URL is None, then data and scripts are all embedded into 
        the notebook.
    setoutput(filename, **kwargs):
        Outputs to a static HTML file. WARNING: This file will be overwritten
        each time show() is invoked.

    This sets the output mode for all the plot functions in this module, but
    only from the point where this function is called.  It does not retroactively
    cause all previous plot commands to regenerate their output.

    When outputting into an IPython notebook with no plot server (i.e. embedding),
    then the Javascript, CSS, and JSON data are all inserted after this call.

    Use kwargs to specify additional arguments to the different kinds of
    session.Session objects that get created.  e.g. For HTMLFileSession,
    filenames like **js_template** or **css_files**; for PlotServerSession,
    arguments like **username**, **userapikey**, and **base_url**; 
    for NotebookSession, things like **notebookscript_paths**.

    Generally, this should be called at the beginning of an interactive session
    or the top of a script.
    """
    # TODO: Do we need to do anything to close out previous sessions?
    if type_or_filename == "ipython":
        _globals["output_type"] = "ipython"
        if URL == "default":
            _globals["otuput_url"] = _globals["plotserver_url"]
        else:
            _globals["output_url"] = URL
        _globals["session"] = NotebookSession()
    elif type_or_filename.startswith("http://"):
        url = type_or_filename
        _globals["output_type"] = "url"
        _globals["output_url"] = url
        kwargs.setdefault("username", "defaultuser")
        kwargs.setdefault("serverloc", url)
        kwargs.setdefault("userapikey", "nokey")
        if "docname" in kwargs:
            docname = kwargs.pop("docname")
        else:
            # This means they passed it in positionally. Kind of crappy we
            # have to handle arguments this way.
            docname = URL
        _globals["session"] = PlotServerSession(**kwargs)
        _globals["session"].use_doc(docname)
    else:
        # Assume a filename
        filename = type_or_filename
        if os.path.isfile(filename):
            warnings.warn("Session output file '%s' already exists, will be overwritten." % filename)
        _globals["output_type"] = "file"
        _globals["output_url"] = filename
        _globals["session"] = HTMLFileSession(output_url)
    return

def hold(val=None):
    if val is None:
        val = not _globals["hold"]
    _globals["hold"] = val


def visual(func):
    """ Decorator to wrap functions that might create visible plot objects
    and need to be displayed or cause a refresh of the output.
    """
    @wraps(func)
    def wrapper(*args, **kw):
        obj = func(*args, **kw)
        output_type = _globals["output_type"]
        output_url = _globals["output_url"]
        session = _globals["session"]
        if output_type == "ipython":
            # Need to do a store
            if output_url is None:
                pass
            else:
                # push the plot data to a plot server
        elif output_type == "url":
            # push the plot data to a plot server
            pass
        else: # File output mode
            # Store plot into HTML file
            pass


@visual
def plot(*data, **kwargs):
    """ Create simple X vs. Y type of plots

    If data items are actual data containers, then new data sources will be
    created around them.  In order to share selection, pan & zoom, etc., 
    pass in previously-created datasource objects, or manually create data-
    source objects and pass those in to the call to plot().

    Arguments
    """

    

@visual
def semilogx(*data, **kwargs):
    # TODO: figure out the right kwarg to set
    kwargs["index_scale"] = "log"
    return plot(*data, **kwargs)

@visual
def semilogy(*data, **kwargs):
    # TODO: figure out the right kwarg to set
    kwargs["value_scale"] = "log"
    return plot(*data, **kwargs)


