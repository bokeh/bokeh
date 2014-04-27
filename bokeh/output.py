

from os.path import abspath, join, normpath, realpath, split, splitext
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
        version = __version__.split('-')
    v = version[0]
    min = ".min" if minified else ""
    base_url = cdn_base_url()
    result = {
        'js_files'  : ['%s/bokeh-%s%s.js' % (base_url, v, min)],
        'css_files' : ['%s/bokeh-%s%s.css' % (base_url, v, min)],
        'messages'  : [],
    }
    if len(version) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : "Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. This configuration is unsupported and may not work!" % (version[0], __version__)
        })
    return result

def inline(paths):
    strings = []
    for path in paths:
        begin = "/* BEGIN %s */" % path
        if path.startswith("http"):
            middle = urllib.urlopen(path).read().decode("utf-8")
        else:
            middle = open(path, 'rb').read().decode("utf-8")
        end = "/* END %s */" % path
        strings.append(begin + '\n' + middle + '\n' + end)
    return strings

def _file_paths(files, minified):
    if minified:
        files = [ root + ".min" + ext for (root, ext) in map(splitext, files) ]
    return [ static_path(file) for file in files ]


class Resources(object):

    js_files = ["js/bokeh.js"]
    css_files = ["css/bokeh.css"]

    js_files_dev = ['js/vendor/requirejs/require.js', 'js/config.js']
    css_files_dev = ['css/bokeh-vendor.css', 'css/continuum.css', 'css/main.css']

    logo_url = "http://bokeh.pydata.org/_static/bokeh-transparent.png"

    def __init__(self, mode='inline', version=None, rootdir=None, minified=True):

        self.mode = settings.resources(mode)
        self.rootdir = settings.rootdir(rootdir)
        self.version = settings.version(version)
        self.minified = settings.minified(minified)

        if mode not in ['inline', 'cdn', 'relative', 'relative-dev', 'absolute', 'absolute-dev']:
            raise ValueError("wrong value for 'mode' parameter, expected 'inline', 'cdn', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode)

        if self.rootdir and not mode.startswith("relative"):
            raise ValueError("setting 'rootdir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not mode.startswith('cdn'):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

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
            self.ss_raw = inline(css_paths)
        elif self.mode == "relative":
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

        if self.dev:
            require = 'require.config({ baseUrl: "%s" });' % base_url
            self.raw_js.append(require)

    def js_paths(self, minified=True, dev=False):
        files = self.js_files_dev if self.dev else self.js_files
        return _file_paths(files, False if dev else minified)

    def css_paths(self, minified=True, dev=False):
        files = self.css_files_dev if self.dev else self.css_files
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






