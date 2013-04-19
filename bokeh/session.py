""" Defines the base PlotSession and some example session types.
"""

from os.path import abspath, split, join

class Session(object):
    """ Sessions provide a sandbox or facility in which to manage the "live"
    object state for a Bokeh plot.  
    
    Many use cases for Bokeh have a client-server separation between the
    plot and data model objects and the view layer objects and controllers.
    For instance, we may have data and plot definitions in an interactive 
    Python session, while the rendering layer and its objects may be in
    Javascript running in a web browser (even a remote browser).
    
    Even a rich client scenario benefits from the session concept, as it
    clearly demarcates responsibilities between plot specification and
    managing interactive state.  For inter-process or inter-language cases,
    it provides a central place to manage serialization (and related 
    persistence issues).

    Sessions should be used as ContextManagers, but they can be created
    around a PlotObject manually.  End-users will mostly interact with 
    them as context managers.
    """

    def __init__(self, plot=None):
        """ Initializes this session from the given PlotObject. """
        # Has the plot model changed since the last save?
        self._dirty = True

    def __enter__(self):
        pass

    def __exit__(self, e_ty, e_val, e_tb):
        pass


class BaseHTMLSession(Session):
    """ Common file & HTML-related utility functions which all HTML output
    sessions will need.
    """

    default_paths = {
        "template": None,
        "js": None,
        "css": None,
        }

    bokeh_url = "https://bokeh.pydata.org/"

    @classmethod
    def template_dir(cls):
        return cls.default_paths.get("template",
            join(abspath(split(__file__)[0]), "templates"))

    @classmethod
    def js_dir(cls):
        return cls.default_paths.get("js",
            join(abspath(split(__file__)[0]), "templates", "js"))

    @classmethod
    def css_dir(cls):
        return cls.default_paths.get("css",
            join(abspath(split(__file__)[0]), "templates", "css"))

    def __init__(self):
        pass

    def js_files(self, unified=True, min=True):
        """ Returns a list of absolute paths on this machine to the JS 
        source files needed to render this session.  If **unified**
        is True, then this list is a single file.  If **min** is True,
        then minifies all the JS.
        """
        raise NotImplementedError

    def css_file(self):
        """ Returns the path to the bokeh.css file.
        """
        raise NotImplementedError

    def js_urls(self, unified=True, min=True, ver=None):
        """ Returns a list of URLs to BokehJS sources, on a remote server,
        using the URL template defined in **bokeh_url_template**.
        """
        raise NotImplementedError

    def css_url(self):
        """ Returns the URL to the bokeh.css file, stored on a remote server,
        using the URL template defined in **bokeh_url**
        """
        raise NotImplementedError


class HTMLFileSession(BaseHTMLSession):
    """ Produces a pile of static HTML, suitable for exporting a plot
    as a standalone HTML file.  This includes a template around the
    plot and includes all the associated JS and CSS for the plot.
    """

    def __init__(self, filename="bokehplot.html", plot=None):
        self.filename = filename

    def contents(self):
        """ Returns the contents of the HTML file as a string """
        pass

    def open(self, filename=None):
        """ Creates an HTML file with the given name, saves out the
        contents of the plot, and then opens a browser window to view it.
        """
        html = self.to_string()
        with open(filename, "w") as f:
            f.write(html)
        return


class HTMLFragmentSession(BaseHTMLSession):
    """ Produces a DOM fragment which is suitable for embedding in a
    pre-existing HTML DOM.  Differs from HTMLFileSession in that the
    requisite script and css lines are generated separately.
    """

    def contents(self, body_only=False):
        """ Returns the multi-line string needed to embed a plot into
        the <body> of an HTML document.  Includes the JS and CSS by
        default; if **body_only** is True, then returns just the plot
        <div> and associated <script> tags, but none of the static
        files it depends on.
        """
        pass

class NotebookSession(BaseHTMLSession):
    """ Produces inline HTML suitable for placing into an IPython Notebook.
    """

class WakariSession(BaseHTMLSession):
    """ Suitable for running on the Wakari.io service.  Includes default
    paths and plot data server configurations which are appropriate for
    a user account on Wakari.
    """



