""" Defines the base HTML Session type
"""
from __future__ import absolute_import

import logging
from os.path import abspath, split, join
from .base_json_session import BaseJSONSession

logger = logging.getLogger(__file__)

class BaseHTMLSession(BaseJSONSession):
    """ Common file & HTML-related utility functions which all HTML output
    sessions will need.  Mostly involves JSON serialization.
    """

    bokeh_url = "https://bokeh.pydata.org/"

    # The base local directory for all CSS and JS
    server_static_dir = join(abspath(split(__file__)[0]), "..", "server", "static")

    # The base dir for all HTML templates
    template_dir = join(abspath(split(__file__)[0]), "..", "templates")

    # The base URL for all CSS and JS
    static_url = bokeh_url

    #------------------------------------------------------------------------
    # Static file handling
    #------------------------------------------------------------------------

    # TODO?: as_url=False
    def js_paths(self, unified=True, minified=True):
        """ Returns a list of URLs or absolute paths on this machine to the JS
        source files needed to render this session.  If **unified** is True,
        then this list is a single file.  If **minified** is True, then minifies
        all the JS.
        """
        raise NotImplementedError

    def css_paths(self, unified=True, minified=True):
        """ Returns the paths to required CSS files. Could be paths
        or URIs depending on the type of session.
        """
        raise NotImplementedError

    @property
    def bokehjs_dir(self):
        return getattr(self, "_bokehjs_dir",
                join(self.server_static_dir, "vendor/bokehjs"))

    @bokehjs_dir.setter
    def bokehjs_dir(self, val):
        self._bokehjs_dir = val

    def _inline_files(self, files):
        strings = []
        for file in files:
            path = abspath(join(self.server_static_dir, file))
            begin = "/* BEGIN %s */" % path
            middle = open(path, 'rb').read().decode("utf-8")
            end = "/* END %s */" % path
            strings.append(begin + '\n' + middle + '\n' + end)
        return strings

    def _load_template(self, filename):
        import jinja2
        with open(join(self.template_dir, filename)) as f:
            return jinja2.Template(f.read())
