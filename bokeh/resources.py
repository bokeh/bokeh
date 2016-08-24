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

import json
from os.path import basename, join, relpath
import re

from six import string_types

from . import __version__
from .core.templates import JS_RESOURCES, CSS_RESOURCES
from .settings import settings

from .util.paths import bokehjsdir
from .util.string import snakify
from .util.session_id import generate_session_id
from .model import Model

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

class _SessionCoordinates(object):
    """ Internal class used to parse kwargs for server URL, app_path, and session_id."""
    def __init__(self, kwargs):
        """ Using kwargs which may have extra stuff we don't care about, compute websocket url and session ID."""

        self._base_url = kwargs.get('url', DEFAULT_SERVER_HTTP_URL)
        if self._base_url is None:
            raise ValueError("url cannot be None")
        if self._base_url == 'default':
            self._base_url = DEFAULT_SERVER_HTTP_URL
        if self._base_url.startswith("ws"):
            raise ValueError("url should be the http or https URL for the server, not the websocket URL")

        # base_url always has trailing slash, host:port/{prefix/}
        if not self._base_url.endswith("/"):
            self._base_url = self._base_url + "/"

        self._app_path = kwargs.get('app_path', '/')
        if self._app_path is None:
            raise ValueError("app_path cannot be None")
        if not self._app_path.startswith("/"):
            raise ValueError("app_path should start with a '/' character")
        if self._app_path != '/' and self._app_path.endswith("/"):
            self._app_path = self._app_path[:-1] # chop off trailing slash

        self._session_id = kwargs.get('session_id')
        # we lazy-generate the session_id so we can generate
        # it server-side when appropriate

        # server_url never has trailing slash because it's
        # prettier like host:port/app_path without a slash
        if self._app_path == '/':
            self._server_url = self._base_url[:-1] # chop off trailing slash
        else:
            self._server_url = self._base_url + self._app_path[1:]

    @property
    def websocket_url(self):
        """ Websocket URL derived from the kwargs provided."""
        return websocket_url_for_server_url(self._server_url)

    @property
    def server_url(self):
        """ Server URL including app path derived from the kwargs provided."""
        return self._server_url

    @property
    def url(self):
        """ Server base URL derived from the kwargs provided (no app path)."""
        return self._base_url

    @property
    def session_id(self):
        """ Session ID derived from the kwargs provided."""
        if self._session_id is None:
            self._session_id = generate_session_id()
        return self._session_id

    @property
    def session_id_allowing_none(self):
        """ Session ID provided in kwargs, keeping it None if it hasn't been generated yet.

        The purpose of this is to preserve ``None`` as long as possible... in some cases
        we may never generate the session ID because we generate it on the server.
        """
        return self._session_id

    @property
    def app_path(self):
        """ App path derived from the kwargs provided."""
        return self._app_path

DEFAULT_SERVER_WEBSOCKET_URL = websocket_url_for_server_url(DEFAULT_SERVER_HTTP_URL)

_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(dev|rc)")


def _cdn_base_url():
    return "https://cdn.pydata.org"

# XXX: this shouldn't be here, however we mix classes and global functions and
# we end up with code like this. This module needs a redesign and rewrite soon.
_component_filter = {
    'js' : [],
    'css': ['bokeh-compiler'],
}

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
        'urls'     : lambda kind: [ mk_url(component, kind) \
            for component in components if component not in _component_filter[kind] ],
        'messages' : [],
    }

    if len(__version__.split('-')) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : ("Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. "
                      "This configuration is unsupported and may not work!" % (version, __version__))
        })

    return result


def _get_server_urls(components, root_url, minified=True, path_versioner=None):
    _min = ".min" if minified else ""

    def mk_url(comp, kind):
        path = "%s/%s%s.%s" % (kind, comp, _min, kind)
        if path_versioner is not None:
            path = path_versioner(path)
        return '%sstatic/%s' % (root_url, path)

    return {
        'urls'     : lambda kind: [ mk_url(component, kind) \
            for component in components if component not in _component_filter[kind] ],
        'messages' : [],
    }


class BaseResources(object):
    _default_root_dir = "."
    _default_root_url = DEFAULT_SERVER_HTTP_URL

    def __init__(self, mode='inline', version=None, root_dir=None,
                 minified=True, log_level="info", root_url=None,
                 path_versioner=None, components=None):

        self.components = components if components is not None \
            else ["bokeh", "bokeh-widgets", "bokeh-compiler"]

        self.mode = settings.resources(mode);           del mode
        self.root_dir = settings.rootdir(root_dir);     del root_dir
        self.version = settings.version(version);       del version
        self.minified = settings.minified(minified);    del minified
        self.log_level = settings.log_level(log_level); del log_level
        self.path_versioner = path_versioner;           del path_versioner

        if root_url and not root_url.endswith("/"):
            logger.warning("root_url should end with a /, adding one")
            root_url = root_url + "/"
        self._root_url = root_url
        if self.mode not in ['inline', 'cdn', 'server', 'server-dev', 'relative', 'relative-dev', 'absolute', 'absolute-dev']:
            raise ValueError("wrong value for 'mode' parameter, expected "
                             "'inline', 'cdn', 'server(-dev)', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode)

        if self.root_dir and not self.mode.startswith("relative"):
            raise ValueError("setting 'root_dir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not self.mode.startswith('cdn'):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if root_url and not self.mode.startswith('server'):
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
        if not (level is None or level in valid_levels):
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
        files = [ "%s%s.%s" % (component, minified, kind) \
            for component in self.components if component not in _component_filter[kind] ]
        paths = [ join(bokehjs_dir, kind, file) for file in files ]
        return paths

    def _collect_external_resources(self, resource_attr):
        """ Collect external resources set on resource_attr attribute of all models."""

        external_resources = []

        for _, cls in sorted(Model.model_class_reverse_map.items(), key=lambda arg: arg[0]):
            external = getattr(cls, resource_attr, None)

            if isinstance(external, string_types):
                if external not in external_resources:
                    external_resources.append(external)
            elif isinstance(external, list):
                for e in external:
                    if e not in external_resources:
                        external_resources.append(e)

        return external_resources


    def _cdn_urls(self):
        return _get_cdn_urls(self.components, self.version, self.minified)

    def _server_urls(self):
        return _get_server_urls(self.components, self.root_url, False if self.dev else self.minified, self.path_versioner)

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
        begin = "/* BEGIN %s */" % basename(path)
        try:
            with open(path, 'rb') as f:
                middle = f.read().decode("utf-8")
        except IOError:
            middle = ""
        end = "/* END %s */"  % basename(path)
        return "%s\n%s\n%s" % (begin, middle, end)

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
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    '''

    def _autoload_path(self, elementid):
        return self.root_url + "bokeh/autoload.js/%s" % elementid

    @property
    def js_files(self):
        files, _ = self._resolve('js')

        external_resources = self._collect_external_resources('__javascript__')
        files.extend(external_resources)

        return files

    @property
    def js_raw(self):
        _, raw = self._resolve('js')

        if self.log_level is not None:
            raw.append('Bokeh.set_log_level("%s");' % self.log_level)

        custom_models = self._render_custom_models_static()
        if custom_models is not None:
            raw.append(custom_models)

        return raw

    _plugin_template = \
"""
(function outer(modules, cache, entry) {
  if (typeof Bokeh !== "undefined") {
    for (var name in modules) {
      var module = modules[name];

      if (typeof(module) === "string") {
        try {
          coffee = Bokeh.require("coffee-script")
        } catch (e) {
          throw new Error("Compiler requested but failed to import. Make sure bokeh-compiler(-min).js was included.")
        }

        function compile(code) {
          var body = coffee.compile(code, {bare: true, shiftLine: true});
          return new Function("require", "module", "exports", body);
        }

        modules[name] = [compile(module), {}];
      }
    }

    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
      Bokeh.Models.register_locations(Bokeh.require(entry[i]));
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})({
 "custom/main":[function(require,module,exports){
   module.exports = { %(exports)s };
 }, {}],
 %(models)s
}, {}, ["custom/main"]);
"""

    def _render_custom_models_static(self):
        def _escape_code(code):
            """ Escape JS/CS source code, so that it can be embedded in a JS string.

            This is based on https://github.com/joliss/js-string-escape.
            """
            def escape(match):
                ch = match.group(0)

                if ch == '"' or ch == "'" or ch == '\\':
                    return '\\' + ch
                elif ch == '\n':
                    return '\\n'
                elif ch == '\r':
                    return '\\r'
                elif ch == '\u2028':
                    return '\\u2028'
                elif ch == '\u2029':
                    return '\\u2029'

            return re.sub(u"""['"\\\n\r\u2028\u2029]""", escape, code)

        custom_models = {}

        for cls in Model.model_class_reverse_map.values():
            impl = getattr(cls, "__implementation__", None)

            if impl is not None:
                custom_models[(cls.__module__, cls.__name__)] = impl

        if not custom_models:
            return None

        exports = []
        models = []

        for (_, model_name), impl in sorted(custom_models.items(), key=lambda arg: arg[0]):
            module_name = "custom/%s" % snakify(model_name)
            exports.append('%s: require("%s")' % (model_name, module_name))
            models.append('"%s": "%s"' % (module_name, _escape_code(impl)))

        exports = ",\n".join(exports)
        models = ",\n".join(models)

        return self._plugin_template % dict(exports=exports, models=models)

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
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding Bokeh plots.

    '''

    @property
    def css_files(self):
        files, _ = self._resolve('css')

        external_resources = self._collect_external_resources("__css__")
        files.extend(external_resources)

        return files

    @property
    def css_raw(self):
        _, raw = self._resolve('css')
        return raw

    @property
    def css_raw_str(self):
        return [ json.dumps(css) for css in self.css_raw ]

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
        js_raw : any raw JS that needs to be placed inside ``<script>`` tags
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        js_files : URLs of any JS files that need to be loaded by ``<script>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    '''

    def render(self):
        return "%s\n%s" % (self.render_css(), self.render_js())

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")

EMPTY = Resources(mode="inline", components=[], log_level=None)
