

from os.path import abspath, join, normpath, realpath, relpath, split, splitext
import sys
import urllib
import uuid

import jinja2

from . import __version__, browserlib, settings

def server_static_dir():
    return join(abspath(split(__file__)[0]), "server", "static")

def static_path(path):
    path = normpath(join(server_static_dir(), path))
    if sys.platform == 'cygwin': path = realpath(path)
    return path

def cdn_base_url():
    return "http://cdn.pydata.org"

def get_cdn_urls(version=None, minified=True):
    if version is None:
        version = __version__.split('-')[0]
    min = ".min" if minified else ""
    base_url = cdn_base_url()
    result = {
        'js_files'  : ['%s/bokeh-%s%s.js' % (base_url, version, min)],
        'css_files' : ['%s/bokeh-%s%s.css' % (base_url, version, min)],
        'messages'  : [],
    }
    if len(__version__.split('-')) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : "Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. This configuration is unsupported and may not work!" % (version, __version__)
        })
    return result

def get_server_urls(server_url, server_port, minified=True):
    min = ".min" if minified else ""
    result = {
        'js_files'  : ['%s:%d/static/js/bokeh%s.js' % (server_url, server_port, min)],
        'css_files' : ['%s:%d/static/css/bokeh%s.css' % (server_url, server_port, min)],
        'messages'  : [],
    }
    return result


def inline(paths):
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
    return [ static_path(file) for file in files ]


class Resources(object):

    _default_js_files = ["js/bokeh.js"]
    _default_css_files = ["css/bokeh.css"]

    _default_js_files_dev = ['js/vendor/requirejs/require.js', 'js/config.js']
    _default_css_files_dev = ['css/bokeh-vendor.css', 'css/continuum.css', 'css/main.css']

    _default_rootdir = "."
    _default_server_url = "http://127.0.0.1"
    _default_server_port = 5006

    logo_url = "http://bokeh.pydata.org/_static/bokeh-transparent.png"

    def __init__(self, mode='inline', version=None, rootdir=None, minified=True, server_url=None, server_port=None):

        self.mode = settings.resources(mode)
        self.rootdir = settings.rootdir(rootdir)
        self.version = settings.version(version)
        self.minified = settings.minified(minified)
        self.server_url = server_url
        self.server_port = server_port

        if mode not in ['inline', 'cdn', 'server', 'server-dev', 'relative', 'relative-dev', 'absolute', 'absolute-dev']:
            raise ValueError("wrong value for 'mode' parameter, expected 'inline', 'cdn', 'server', 'server-dev', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode)

        if self.rootdir and not mode.startswith("relative"):
            raise ValueError("setting 'rootdir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not mode.startswith('cdn'):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if self.server_url and not mode.startswith('server'):
            raise ValueError("setting 'server_url' makes sense only when 'mode' is set to 'server'")

        if self.server_port and not mode.startswith('server'):
            raise ValueError("setting 'server_port' makes sense only when 'mode' is set to 'server'")

        self.dev = mode.endswith('-dev')
        if self.dev:
            self.mode = self.mode[:-4]

        js_paths = self.js_paths(dev=self.dev, minified=self.minified)
        css_paths = self.css_paths(dev=self.dev, minified=self.minified)
        base_url = static_path("js")

        self.js_raw = []
        self.css_raw = []
        self.js_files = []
        self.css_files = []
        self.messages = []

        if self.mode == "inline":
            self.js_raw = inline(js_paths)
            self.css_raw = inline(css_paths)
        elif self.mode == "relative":
            rootdir = self.rootdir or self._default_rootdir
            self.js_files = [ relpath(p, rootdir) for p in js_paths ]
            self.css_files = [ relpath(p, rootdir) for p in css_paths ]
            base_url = relpath(base_url, rootdir)
        elif self.mode == "absolute":
            self.js_files = list(js_paths)
            self.css_files = list(css_paths)
        elif self.mode == "cdn":
            cdn = get_cdn_urls(self.version, self.minified)
            self.js_files = list(cdn['js_files'])
            self.css_files = list(cdn['css_files'])
            self.messages.extend(cdn['messages'])
        elif self.mode == "server":
            server_url = self.server_url or self._default_server_url
            server_port = self.server_port or self._default_server_port
            server = get_server_urls(server_url, server_port, self.minified)
            self.js_files = list(server['js_files'])
            self.css_files = list(server['css_files'])
            self.messages.extend(server['messages'])

        if self.dev:
            require = 'require.config({ baseUrl: "%s" });' % base_url
            self.js_raw.append(require)

    def js_paths(self, minified=True, dev=False):
        files = self._default_js_files_dev if self.dev else self._default_js_files
        return _file_paths(files, False if dev else minified)

    def css_paths(self, minified=True, dev=False):
        files = self._default_css_files_dev if self.dev else self._default_css_files
        return _file_paths(files, False if dev else minified)

    @property
    def js_wrapper(self):

        def pad(text, n=4):
            return "\n".join([ " "*n + line for line in text.split("\n") ])

        wrapper = lambda code: '$(function() {\n%s\n});' % pad(code)

        if self.dev:
            js_wrapper = lambda code: 'require(["jquery", "main"], function($, Bokeh) {\n%s\n});' % pad(wrapper(code))
        else:
            js_wrapper = wrapper

        return js_wrapper


RESOURCES_CDN = Resources(mode="cdn")
RESOURCES_INLINE = Resources(mode="inline")






