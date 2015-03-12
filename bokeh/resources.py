''' The resources module provides the Resources class for easily configuring
how BokehJS code and CSS resources should be located, loaded, and embedded in
Bokeh documents.

Also provides some pre-configured Resources objects:

Attributes:
    CDN : load minified BokehJS from CDN
    INLINE : provide minified BokehJS from library static directory

'''

from __future__ import absolute_import

from os.path import abspath, join, normpath, realpath, relpath, split, splitext
import sys
import logging
logger = logging.getLogger(__name__)

import six

from . import __version__, settings

def _server_static_dir():
    return join(abspath(split(__file__)[0]), "server", "static")

def _static_path(path):
    path = normpath(join(_server_static_dir(), path))
    if sys.platform == 'cygwin': path = realpath(path)
    return path

def _cdn_base_url():
    return "http://cdn.pydata.org"

def _get_cdn_urls(version=None, minified=True):
    if version is None:
        if settings.local_docs_cdn():
            version = settings.local_docs_cdn()
        else:
            version = __version__.split('-')[0]

    # check if we want minified js and css
    _min = ".min" if minified else ""

    base_url = _cdn_base_url()
    dev_container = 'bokeh/dev'
    rel_container = 'bokeh/release'

    # check the 'dev' fingerprint
    container = dev_container if version.endswith(('dev', 'rc')) else rel_container

    result = {
        'js_files'  : ['%s/%s/bokeh-%s%s.js' % (base_url, container, version, _min)],
        'css_files' : ['%s/%s/bokeh-%s%s.css' % (base_url, container, version, _min)],
        'messages'  : [],
    }

    if len(__version__.split('-')) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : "Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. This configuration is unsupported and may not work!" % (version, __version__)
        })

    return result

def _get_server_urls(root_url, minified=True):
    _min = ".min" if minified else ""
    result = {
        'js_files'  : ['%sbokehjs/static/js/bokeh%s.js' % (root_url, _min)],
        'css_files' : ['%sbokehjs/static/css/bokeh%s.css' % (root_url, _min)],
        'messages'  : [],
    }
    return result


def _inline(paths):
    strings = []
    for path in paths:
        begin = "/* BEGIN %s */" % path
        middle = open(path, 'rb').read().decode("utf-8")
        end = "/* END %s */" % path
        strings.append(begin + '\n' + middle + '\n' + end)
    return strings

def _file_paths(files, minified):
    if minified:
        files = [ root + ".min" + ext for (root, ext) in map(splitext, files) ]
    return [ _static_path(file) for file in files ]


class Resources(object):
    ''' The Resources class encapsulates information relating to loading or
    embedding BokehJS code and CSS.

    Args:
        mode (str) : how should BokehJS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of BokejJS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading BokehJS resources

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript and CSS should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire BokehJS code and CSS inline
    * ``'cdn'`` configure to load BokehJS code and CS from ``http://cdn.pydata.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-concatenated JS using ``requirejs``
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-concatenated JS using ``requirejs``
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-concatenated JS using ``requirejs``

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        logo_url : location of the BokehJS logo image
        js_raw : any raw JS that needs to be placed inside ``<script>`` tags
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        js_files : URLs of any JS files that need to be loaded by ``<script>`` tags
        css_files : URLS od any CSS files that need to be loaed by ``<link>`` tags
        messages : any informational messages concering this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    '''

    _default_js_files = ["js/bokeh.js"]
    _default_css_files = ["css/bokeh.css"]

    _default_js_files_dev = ['js/vendor/requirejs/require.js', 'js/config.js']
    _default_css_files_dev = ['css/bokeh.css']

    _default_root_dir = "."
    _default_root_url = "http://127.0.0.1:5006/"

    logo_url = "http://bokeh.pydata.org/_static/bokeh-transparent.png"

    def __init__(self, mode='inline', version=None, root_dir=None,
                 minified=True, log_level="info", root_url=None):
        self.mode = settings.resources(mode)
        self.root_dir = settings.rootdir(root_dir)
        self.version = settings.version(version)
        self.minified = settings.minified(minified)
        self.log_level = settings.log_level(log_level)
        if root_url and not root_url.endswith("/"):
            logger.warning("root_url should end with a /, adding one")
            root_url = root_url + "/"
        self._root_url = root_url
        if mode not in ['inline', 'cdn', 'server', 'server-dev', 'relative', 'relative-dev', 'absolute', 'absolute-dev']:
            raise ValueError("wrong value for 'mode' parameter, expected 'inline', 'cdn', 'server(-dev)', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode)

        if self.root_dir and not mode.startswith("relative"):
            raise ValueError("setting 'root_dir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not mode.startswith('cdn'):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if root_url and not mode.startswith('server'):
            raise ValueError("setting 'root_url' makes sense only when 'mode' is set to 'server'")

        self.dev = self.mode.endswith('-dev')
        if self.dev:
            self.mode = self.mode[:-4]

        js_paths = self._js_paths(dev=self.dev, minified=self.minified)
        css_paths = self._css_paths(dev=self.dev, minified=self.minified)
        base_url = _static_path("js")

        self._js_raw = []
        self._css_raw = []
        self.js_files = []
        self.css_files = []
        self.messages = []

        if self.mode == "inline":
            self._js_raw = lambda: _inline(js_paths)
            self._css_raw = lambda: _inline(css_paths)
        elif self.mode == "relative":
            root_dir = self.root_dir or self._default_root_dir
            self.js_files = [ relpath(p, root_dir) for p in js_paths ]
            self.css_files = [ relpath(p, root_dir) for p in css_paths ]
            base_url = relpath(base_url, root_dir)
        elif self.mode == "absolute":
            self.js_files = list(js_paths)
            self.css_files = list(css_paths)
        elif self.mode == "cdn":
            cdn = _get_cdn_urls(self.version, self.minified)
            self.js_files = list(cdn['js_files'])
            self.css_files = list(cdn['css_files'])
            self.messages.extend(cdn['messages'])
        elif self.mode == "server":
            server = _get_server_urls(self.root_url, self.minified)
            self.js_files = list(server['js_files'])
            self.css_files = list(server['css_files'])
            self.messages.extend(server['messages'])

        if self.dev:
            require = 'require.config({ baseUrl: "%s" });' % base_url
            self._js_raw.append(require)

    @property
    def log_level(self):
        return self._log_level

    @log_level.setter
    def log_level(self, level):
        valid_levels = [
            "trace", "debug", "info", "warn", "error", "fatal"
        ]
        if level not in valid_levels:
            raise ValueError("Unknown log level '%s', valid levels are: %s", str(valid_levels))
        self._log_level = level


    @property
    def js_raw(self):
        if six.callable(self._js_raw):
            self._js_raw = self._js_raw()
        if self.dev:
            return self._js_raw
        else:
            return self._js_raw + ['Bokeh.set_log_level("%s");' % self.log_level]

    @property
    def css_raw(self):
        if six.callable(self._css_raw):
            self._css_raw = self._css_raw()
        return self._css_raw

    @property
    def root_url(self):
        if self._root_url:
            return self._root_url
        else:
            return self._default_root_url

    def _js_paths(self, minified=True, dev=False):
        files = self._default_js_files_dev if self.dev else self._default_js_files
        return _file_paths(files, False if dev else minified)

    def _css_paths(self, minified=True, dev=False):
        files = self._default_css_files_dev if self.dev else self._default_css_files
        return _file_paths(files, False if dev else minified)

    @property
    def js_wrapper(self):

        def pad(text, n=4):
            return "\n".join([ " "*n + line for line in text.split("\n") ])

        wrapper = lambda code: 'Bokeh.$(function() {\n%s\n});' % pad(code)

        if self.dev:
            js_wrapper = lambda code: 'require(["jquery", "main"], function($, Bokeh) {\nBokeh.set_log_level("%s");\n%s\n});' % (self.log_level, pad(wrapper(code)))
        else:
            js_wrapper = wrapper

        return js_wrapper

    def _autoload_path(self, elementid):
        return self.root_url + "bokeh/autoload.js/%s" % elementid

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")
