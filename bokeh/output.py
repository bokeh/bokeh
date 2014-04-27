

from os.path import abspath, join, split
import urllib
import uuid

import jinja2

from . import __version__

def local_static_dir():
    return join(abspath(split(__file__)[0]), "server", "static")

def cdn_url():
    return "http://cdn.pydata.org"


def get_cdn_urls(version=None):
    if version is None:
        version = __version__.split('-')
    v = version[0]
    result = {
        'js_url'   : 'http://cdn.pydata.org/bokeh-%s.js' % v,
        'css_url'  : 'http://cdn.pydata.org/bokeh-%s.css' % v,
        'messages' : [],
    }
    if len(version) > 1:
        result['messages'].append({
            "type" : "warn",
            "text" : "Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. This configuration is unsupported and may not work!" % (version[0], __version__)
        })
    return result

#$("foo").data().bokehPlottype

_server_embed_template = '''
<script
    src="%(script_url)s"
    data-bokeh-plottype="serverconn"
    bokeh_docid="%(docid)s"
    bokeh_ws_conn_string="%(ws_conn_string)s"
    bokeh_docapikey="%(docapikey)s"
    bokeh_root_url="%(root_url)s"
    bokeh_modelid="%(modelid)s"
    bokeh_modeltype="%(modeltype)s"
    async="true"
>
</script>
'''


_static_embed_template = '''
<script
    src="%(embed_filename)s"
    bokeh_plottype="embeddata"
    bokeh_modelid="%(modelid)s"
    bokeh_modeltype="%(modeltype)s"
    async="true"
>
</script>
'''


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

class Resources(object):
    def __init__(self):
        self.messages = []
        self.mode = 'inline'
        self.js_inline = open(join(local_static_dir(), 'js', 'bokeh.min.js'), 'rb').read().decode("utf-8")
        self.css_inline = open(join(local_static_dir(), 'css', 'bokeh.min.css'), 'rb').read().decode("utf-8")

        self.logo_url = "http://bokeh.pydata.org/_static/bokeh-transparent.png"

        cdn = get_cdn_urls()
        self.js_url = cdn['js_url']
        self.css_url = cdn['css_url']
        if self.mode != 'inline':
            self.messages.extend(cdn['messages'])

_default_notebook_resources = Resources()






