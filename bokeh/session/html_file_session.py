""" Defines the HTML File Session type
"""
from __future__ import absolute_import

from os.path import abspath, split, join, relpath, splitext
import logging
from six import string_types

from ..objects import PlotContext
from .base_html_session import BaseHTMLSession

logger = logging.getLogger(__file__)

class HTMLFileSession(BaseHTMLSession):
    """ Produces a pile of static HTML, suitable for exporting a plot
    as a standalone HTML file.  This includes a template around the
    plot and includes all the associated JS and CSS for the plot.
    """

    title = "Bokeh Plot"

    # TODO: Why is this not in bokehjs_dir, but rather outside of it?
    js_files = ["js/bokeh.js"]
    css_files = ["css/bokeh.css"]

    # Template files used to generate the HTML
    js_template = "plots.js"
    div_template = "plots.html"     # template for just the plot <div>
    html_template = "base.html"     # template for the entire HTML file
    inline_js = True
    inline_css = True

    # Used to compute the relative paths to JS and CSS if they are not
    # inlined into the output
    rootdir = abspath(split(__file__)[0])

    def __init__(self, filename="bokehplot.html", plot=None, title=None):
        self.filename = filename
        if title is not None:
            self.title = title
        super(HTMLFileSession, self).__init__(plot=plot)
        self.plotcontext = PlotContext()
        self.add(self.plotcontext)
        self.raw_js_objs = []

    def _file_paths(self, files, unified, minified):
        if not unified:
            raise NotImplementedError("unified=False is not implemented")

        if minified:
            files = [ root + ".min" + ext for (root, ext) in map(splitext, files) ]

        return [ join(self.server_static_dir, file) for file in files ]

    def js_paths(self, unified=True, minified=True):
        return self._file_paths(self.js_files, unified, minified)

    def css_paths(self, unified=True, minified=True):
        return self._file_paths(self.css_files, unified, minified)

    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

    def dumps(self, js=None, css=None, rootdir=None):
        """ Returns the HTML contents as a string

        **js** and **css** can be "inline" or "relative", and they default
        to the values of self.inline_js and self.inline_css.

        If these are set to be "relative" (or self.inline_js/css are False),
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.  **rootdir**
        defaults to the value of self.rootdir.
        """
        # FIXME: Handle this more intelligently
        pc_ref = self.get_ref(self.plotcontext)
        elementid = self.make_id()

        jscode = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = pc_ref["id"],
                    modeltype = pc_ref["type"],
                    all_models = self.serialize_models())

        rawjs, rawcss = None, None
        jsfiles, cssfiles = [], []

        if rootdir is None:
            rootdir = self.rootdir

        if js == "inline" or (js is None and self.inline_js):
            rawjs = self._inline_files(self.js_paths())
        elif js == "relative" or js is None:
            jsfiles = [ relpath(p, rootdir) for p in self.js_paths() ]
        elif js == "absolute":
            jsfiles = self.js_paths()
        else:
            raise ValueError("wrong value for 'js' parameter, expected None, 'inline', 'relative' or 'absolute', got %r" % js)

        if css == "inline" or (css is None and self.inline_css):
            rawcss = self._inline_files(self.css_paths())
        elif css == "relative" or css is None:
            cssfiles = [ relpath(p, rootdir) for p in self.css_paths() ]
        elif css == "absolute":
            cssfiles = self.css_paths()
        else:
            raise ValueError("wrong value for 'css' parameter, expected None, 'inline', 'relative' or 'absolute', got %r" % css)

        plot_div = self._load_template(self.div_template).render(elementid=elementid)

        html = self._load_template(self.html_template).render(
                    js_snippets = [jscode],
                    html_snippets = [plot_div] + [o.get_raw_js() for o in self.raw_js_objs],
                    rawjs = rawjs, rawcss = rawcss,
                    jsfiles = jsfiles, cssfiles = cssfiles,
                    title = self.title)

        return html

    def embed_js(self, plot_id, static_root_url):
        # FIXME: Handle this more intelligently
        pc_ref = self.get_ref(self.plotcontext)
        elementid = self.make_id()

        jscode = self._load_template('embed_direct.js').render(
            host = "",
            static_root_url=static_root_url,
            elementid = elementid,
            modelid = pc_ref["id"],
            modeltype = pc_ref["type"],
            plotid = plot_id,
            all_models = self.serialize_models())

        return jscode.encode("utf-8")

    def save(self, filename=None, js=None, css=None, rootdir=None):
        """ Saves the file contents.  Uses self.filename if **filename**
        is not provided.  Overwrites the contents.

        **js** and **css** can be "inline" or "relative", and they default
        to the values of self.inline_js and self.inline_css.

        If these are set to be "relative" (or self.inline_js/css are False),
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.  **rootdir**
        defaults to the value of self.rootdir.
        """
        s = self.dumps(js, css, rootdir)
        if filename is None:
            filename = self.filename
        with open(filename, "wb") as f:
            f.write(s.encode("utf-8"))
        return

    def view(self, new=False, autoraise=True):
        """ Opens a browser to view the file pointed to by this sessions.

        **new** can be None, "tab", or "window" to view the file in the
        existing page, a new tab, or a new windows.  **autoraise** causes
        the browser to be brought to the foreground; this may happen
        automatically on some platforms regardless of the setting of this
        variable.
        """
        new_map = { False: 0, "window": 1, "tab": 2 }
        file_url = "file://" + abspath(self.filename)

        try:
            import webbrowser
            webbrowser.open(file_url, new=new_map[new], autoraise=autoraise)
        except (SystemExit, KeyboardInterrupt):
            raise
        except:
            pass

    def dumpjson(self, pretty=True, file=None):
        """ Returns a JSON string representing the contents of all the models
        stored in this session, or write it to a file object or file name.

        If **pretty** is True, then return a string suitable for human reading,
        otherwise returns a compact string.

        If a file object is provided, then the output is appended to it.  If a
        file name is provided, then it opened for overwrite, and not append.

        Mostly intended to be used for debugging.
        """
        if pretty:
            indent = 4
        else:
            indent = None
        s = self.serialize_models(indent=indent)
        if file is not None:
            if isinstance(file, string_types):
                with open(file, "w") as f:
                    f.write(s)
            else:
                file.write(s)
        else:
            return s
