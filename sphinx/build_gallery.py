from __future__ import print_function

import os
import re
import webbrowser
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter
from bokeh import plotting
from bokeh import plotting_helpers

# patch open and show to be no-ops
def noop(*args, **kwargs):
    pass
webbrowser.open = noop
plotting.show= noop


def page_desc(module_desc):
    module_path, name = module_desc['file'], module_desc['name']
    var_name = module_desc.get('var_name', None)

    plotting_helpers._PLOTLIST = []

    namespace = {}
    execfile(module_path, namespace)

    if var_name:
        objects = [namespace[var_name]]
    else:
        objects = plotting_helpers._PLOTLIST

    embed_snippet = ""
    for i, obj in enumerate(objects):
        # this _id business is just to have nice readable names for
        # the embed snippet files
        obj._id = name if len(objects) == 1 else name + "." + str(i)
        embed_snippet += obj.create_html_snippet(
            embed_save_loc= GALLERY_BUILD_DIR,
            static_path=HOSTED_STATIC_ROOT,
            embed_base_url=DETAIL_URL_ROOT
        )

    detail_snippet = highlight(
        open(module_path).read(), PythonLexer(), HtmlFormatter()
    )

    return  dict(
        name = name,
        embed_snippet = embed_snippet,
        detail_snippet = detail_snippet,
        detail_page_url = DETAIL_URL_ROOT + name + ".html",
        prev_detail_url = "",
        prev_detail_name = "",
        next_detail_url = "",
        next_detail_name ='',
    )

def load_template(filename):
    import jinja2
    with open(os.path.join(BASE_DIR, filename)) as f:
        return jinja2.Template(f.read())

def make_gallery(module_descs):
    page_infos = [page_desc(desc) for desc in module_descs]

    for i, info in enumerate(page_infos[1:1]):
        info['prev_detail_url']  = page_infos[i-1]['detail_page_url']
        info['prev_detail_name'] = page_infos[i-1]['name']
        info['next_detail_url']  = page_infos[i+1]['detail_page_url']
        info['next_detail_name'] = page_infos[i+1]['name']

    detail_template = load_template("source/_templates/gallery_detail.html")
    gallery_template = load_template("source/_templates/gallery.rst.in")

    for info in page_infos:
        fname = os.path.join(GALLERY_BUILD_DIR, info['name'] + ".html")
        with open(fname, "w") as f:
            f.write(detail_template.render(info).encode('utf-8'))
        print("wrote", fname)

    gallery_rst = gallery_template.render(page_infos=page_infos)

    if GALLERY_RST_PATH:
        with open(GALLERY_RST_PATH, "w") as f:
            f.write(gallery_rst)
            print("wrote", GALLERY_RST_PATH)

if __name__ == "__main__":
    import sys
    if len(sys.argv) not in  [2,3]:
        print("usage: build_gallery.py <gallery build path> [<gallery rst filename>]")
        sys.exit(1)

    BASE_DIR = os.path.dirname(__file__)
    GALLERY_BUILD_DIR = sys.argv[1]
    GALLERY_RST_PATH = None
    if sys.argv[2]:
        GALLERY_RST_PATH = os.path.join(BASE_DIR, sys.argv[2])
    HOSTED_STATIC_ROOT="/docs/bokehjs-static/"
    DETAIL_URL_ROOT="./"

    make_gallery([
        dict(file="../examples/plotting/file/iris.py",          name='iris',),
        dict(file="../examples/plotting/file/image_rgba.py",    name='image_rgba',),
        dict(file="../examples/plotting/file/candlestick.py",   name='candlestick',),
        dict(file="../examples/plotting/file/legend.py",        name='legend',),
        dict(file="../examples/plotting/file/correlation.py",   name='correlation',),
        dict(file="../examples/plotting/file/glucose.py",       name='glucose',),
        dict(file="../examples/plotting/file/stocks.py",        name='stocks',),
        dict(file="../examples/plotting/file/vector.py",        name='vector',),
        dict(file="../examples/plotting/file/histogram.py",     name='histogram',),
        dict(file="../examples/plotting/file/image.py",         name='image',),
        dict(file="../examples/plotting/file/lorenz.py",        name='lorenz',),
        dict(file="../examples/plotting/file/color_scatter.py", name='color_scatter',),
        dict(file="../examples/glyphs/iris_splom.py",           name='iris_splom', var_name="grid"),
        dict(file="../examples/glyphs/anscombe.py",             name='anscombe', var_name="grid"),
        dict(file="../examples/plotting/file/choropleth.py",    name='choropleth',),
        dict(file="../examples/plotting/file/texas.py",         name='texas',),
        dict(file="../examples/plotting/file/markers.py",       name='scatter',),
        dict(file="../examples/plotting/file/burtin.py",        name='burtin',),
        dict(file="../examples/plotting/file/brewer.py",        name='brewer',),
        dict(file="../examples/plotting/file/elements.py",      name='elements',),
        dict(file="../examples/plotting/file/boxplot.py",       name='boxplot',),
    ])

    try:
        webbrowser.open(HOSTED_STATIC_ROOT + "demos/gallery.html")
    except:
        pass
