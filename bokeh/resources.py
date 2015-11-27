''' The resources module provides the Resources class for easily configuring
how BokehJS code and CSS resources should be located, loaded, and embedded in
Bokeh documents.

Also provides some pre-configured Resources objects.

Attributes:
    CDN : load minified BokehJS from CDN
    INLINE : provide minified BokehJS from library static directory

'''

from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)
from os.path import join, relpath
import re
import copy

from . import __version__
from .settings import settings
from .util.paths import bokehjsdir
from .templates import JS_RESOURCES, CSS_RESOURCES

DEFAULT_SERVER_HOST = "localhost"
DEFAULT_SERVER_PORT = 5006
DEFAULT_SERVER_HTTP_URL = "http://%s:%d/" % (DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT)


def websocket_url_for_server_url(url):
    if url.startswith("http:"):
        reprotocoled = "ws" + url[4:]
    elif url.startswith("https:"):
        reprotocoled = "wss" + url[5:]
    else:
        raise ValueError("URL has unknown protocol " + url)
    if reprotocoled.endswith("/"):
        return reprotocoled + "ws"
    else:
        return reprotocoled + "/ws"


def server_url_for_websocket_url(url):
    if url.startswith("ws:"):
        reprotocoled = "http" + url[2:]
    elif url.startswith("wss:"):
        reprotocoled = "https" + url[3:]
    else:
        raise ValueError("URL has non-websocket protocol " + url)
    if not reprotocoled.endswith("/ws"):
        raise ValueError("websocket URL does not end in /ws")
    return reprotocoled[:-2]

DEFAULT_SERVER_WEBSOCKET_URL = websocket_url_for_server_url(DEFAULT_SERVER_HTTP_URL)

_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(dev|rc)")


def _cdn_base_url():
    return "http://cdn.pydata.org"


def _get_cdn_urls(components, version=None, minified=True):
    if version is None:
        if settings.docs_cdn():
            version = settings.docs_cdn()
        else:
            version = __version__.split('-')[0]

    # check if we want minified js and css
    _min = ".min" if minified else ""

    base_url = _cdn_base_url()
    dev_container = 'bokeh/dev'
    rel_container = 'bokeh/release'

    # check the 'dev' fingerprint
    container = dev_container if _DEV_PAT.match(version) else rel_container

    if version.endswith(('dev', 'rc')):
        logger.debug("Getting CDN URL for local dev version will not produce usable URL")

    def mk_url(comp, kind):
        return '%s/%s/%s-%s%s.%s' % (base_url, container, comp, version, _min, kind)

    result = {
        'urls'     : lambda kind: [ mk_url(component, kind) for component in components ],
        'messages' : [],
    }

    if len(__version__.split('-')) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : ("Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. "
                      "This configuration is unsupported and may not work!" % (version, __version__))
        })

    return result


def _get_server_urls(components, root_url, minified=True):
    _min = ".min" if minified else ""

    def mk_url(comp, kind):
        return '%sbokehjs/static/%s/%s%s.%s' % (root_url, kind, comp, _min, kind)

    return {
        'urls'     : lambda kind: [ mk_url(component, kind)  for component in components ],
        'messages' : [],
    }


class BaseResources(object):
    _default_root_dir = "."
    _default_root_url = DEFAULT_SERVER_HTTP_URL

    logo_url = "http://bokeh.pydata.org/static/bokeh-transparent.png"

    def __init__(self, mode='inline', version=None, root_dir=None,
                 minified=True, log_level="info", root_url=None):
        self.components = ["bokeh", "bokeh-widgets"]

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
            raise ValueError("wrong value for 'mode' parameter, expected "
                             "'inline', 'cdn', 'server(-dev)', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode)

        if self.root_dir and not mode.startswith("relative"):
            raise ValueError("setting 'root_dir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not mode.startswith('cdn'):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if root_url and not mode.startswith('server'):
            raise ValueError("setting 'root_url' makes sense only when 'mode' is set to 'server'")

        self.dev = self.mode.endswith('-dev')
        if self.dev:
            self.mode = self.mode[:-4]

        self.messages = []

        if self.mode == "cdn":
            cdn = self._cdn_urls()
            self.messages.extend(cdn['messages'])
        elif self.mode == "server":
            server = self._server_urls()
            self.messages.extend(server['messages'])

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
    def root_url(self):
        if self._root_url:
            return self._root_url
        else:
            return self._default_root_url

    def _file_paths(self, kind):
        bokehjs_dir = bokehjsdir(self.dev)
        minified = ".min" if not self.dev and self.minified else ""
        files = [ "%s%s.%s" % (component, minified, kind) for component in self.components ]
        paths = [ join(bokehjs_dir, kind, file) for file in files ]
        return paths

    def _cdn_urls(self):
        return _get_cdn_urls(self.components, self.version, self.minified)

    def _server_urls(self):
        return _get_server_urls(self.components, self.root_url, self.minified)

    def _resolve(self, kind):
        paths = self._file_paths(kind)
        files, raw = [], []

        if self.mode == "inline":
            raw = [ self._inline(path) for path in paths ]
        elif self.mode == "relative":
            root_dir = self.root_dir or self._default_root_dir
            files = [ relpath(path, root_dir) for path in paths ]
        elif self.mode == "absolute":
            files = list(paths)
        elif self.mode == "cdn":
            cdn = self._cdn_urls()
            files = list(cdn['urls'](kind))
        elif self.mode == "server":
            server = self._server_urls()
            files = list(server['urls'](kind))

        return (files, raw)

    def _inline(self, path):
        begin = "/* BEGIN %s */" % path
        middle = open(path, 'rb').read().decode("utf-8")
        end = "/* END %s */" % path
        return "%s\n%s\n%s" % (begin, middle, end)

    def _use_component(self, component, use):
        obj = copy.deepcopy(self)

        if use:
            if component not in obj.components:
                try:
                    i = obj.components.index("bokeh")
                except ValueError:
                    i = 0

                obj.components.insert(i, component)
        else:
            try:
                obj.components.remove(component)
            except ValueError:
                pass

        return obj

    def use_widgets(self, use):
        return self._use_component("bokeh-widgets", use)


class JSResources(BaseResources):
    ''' The Resources class encapsulates information relating to loading or embedding Bokeh Javascript.

    Args:
        mode (str) : how should Bokeh JS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh JS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire Bokeh JS and CSS inline
    * ``'cdn'`` configure to load Bokeh JS and CSS from ``http://cdn.pydata.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified assets
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified assets
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified assets

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        logo_url : location of the BokehJS logo image
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLS od any CSS files that need to be loaed by ``<link>`` tags
        messages : any informational messages concering this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    '''

    def _autoload_path(self, elementid):
        return self.root_url + "bokeh/autoload.js/%s" % elementid

    @property
    def js_files(self):
        files, _ = self._resolve('js')
        return files

    @property
    def js_raw(self):
        _, raw = self._resolve('js')
        return raw + ['Bokeh.set_log_level("%s");' % self.log_level]

    def render_js(self):
        return JS_RESOURCES.render(js_raw=self.js_raw, js_files=self.js_files)


class CSSResources(BaseResources):
    ''' The CSSResources class encapsulates information relating to loading or embedding Bokeh client-side CSS.

    Args:
        mode (str) : how should Bokeh CSS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading BokehJS resources

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether CSS should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire BokehJS code and CSS inline
    * ``'cdn'`` configure to load Bokeh CSS from ``http://cdn.pydata.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified CSS
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified CSS
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified CSS

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        logo_url : location of the BokehJS logo image
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLS od any CSS files that need to be loaed by ``<link>`` tags
        messages : any informational messages concering this configuration

    These attributes are often useful as template parameters when embedding Bokeh plots.

    '''

    @property
    def css_files(self):
        files, _ = self._resolve('css')
        return files

    @property
    def css_raw(self):
        _, raw = self._resolve('css')
        return raw

    def render_css(self):
        return CSS_RESOURCES.render(css_raw=self.css_raw, css_files=self.css_files)


class Resources(JSResources, CSSResources):
    ''' The Resources class encapsulates information relating to loading or
    embedding Bokeh Javascript and CSS.

    Args:
        mode (str) : how should Bokeh JS and CSS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh JS and CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS and CSS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript and CSS should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire Bokeh JS and CSS inline
    * ``'cdn'`` configure to load Bokeh JS and CSS from ``http://cdn.pydata.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified assets
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified assets
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified assets

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

    def render(self):
        return "%s\n%s" % (self.render_css(), self.render_js())

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")
