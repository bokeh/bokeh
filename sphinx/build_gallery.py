from __future__ import print_function

import os
import re
import webbrowser
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter
from bokeh import plotting
from bokeh import plotting_helpers
from bokeh import mpl

# patch open and show to be no-ops
def noop(*args, **kwargs):
    pass
webbrowser.open = noop
plotting.show= noop


def page_desc(module_desc):
    module_path, name = module_desc['file'], module_desc['name']
    var_name = module_desc.get('var_name', None)

    plotting_helpers._PLOTLIST = []
    mpl._PLOTLIST = []

    namespace = {}
    execfile(module_path, namespace)

    if var_name:
        objects = [namespace[var_name]]
    else:
        if plotting_helpers._PLOTLIST:
            objects = plotting_helpers._PLOTLIST
        else:
            objects = mpl._PLOTLIST

    embed_snippet = ""
    for i, obj in enumerate(objects):
        # this _id business is just to have nice readable names for
        # the embed snippet files
        obj._id = name if len(objects) == 1 else name + "." + str(i)
        embed_snippet += obj.create_html_snippet(
            embed_save_loc= SNIPPET_BUILD_DIR,
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

    for i, info in enumerate(page_infos[1:-1], 1):
        info['prev_detail_url']  = page_infos[i-1]['detail_page_url']
        info['prev_detail_name'] = page_infos[i-1]['name']
        info['next_detail_url']  = page_infos[i+1]['detail_page_url']
        info['next_detail_name'] = page_infos[i+1]['name']

    if len(page_infos) > 1:
        page_infos[0]['next_detail_url']   = page_infos[1]['detail_page_url']
        page_infos[0]['next_detail_name']  = page_infos[1]['name']
        page_infos[-1]['prev_detail_url']  = page_infos[-2]['detail_page_url']
        page_infos[-1]['prev_detail_name'] = page_infos[-2]['name']

    detail_template = load_template(DETAIL_TEMPLATE)

    for info in page_infos:
        if DETAIL_TEMPLATE.endswith(".html"):
            fname = os.path.join(DETAIL_BUILD_DIR, info['name'] + ".html")
        elif DETAIL_TEMPLATE.endswith("rst.in"):
            fname = os.path.join(DETAIL_BUILD_DIR, info['name'] + ".rst")
        else:
            raise ValueError("unexpected template filename format: '%s'" % DETAIL_TEMPLATE)
        with open(fname, "w") as f:
            f.write(detail_template.render(info).encode('utf-8'))
        print("wrote", fname)

    if GALLERY_RST_PATH:
        gallery_template = load_template("source/_templates/gallery.rst.in")
        gallery_rst = gallery_template.render(page_infos=page_infos)
        with open(GALLERY_RST_PATH, "w") as f:
            f.write(gallery_rst)
            print("wrote", GALLERY_RST_PATH)

if __name__ == "__main__":
    import json
    import sys
    if len(sys.argv) != 2:
        print("usage: build_gallery.py <gallery_file>")
        sys.exit(1)

    GALLERY_FILE = sys.argv[1]
    gallery_info = json.load(open(GALLERY_FILE))

    BASE_DIR = os.path.dirname(__file__)
    SNIPPET_BUILD_DIR = gallery_info['snippet_build_dir']
    DETAIL_BUILD_DIR = gallery_info['detail_build_dir']
    DETAIL_TEMPLATE = gallery_info['detail_template']
    GALLERY_RST_PATH = gallery_info['gallery_rst_path']
    if len(sys.argv) >= 5:
        GALLERY_RST_PATH = os.path.join(BASE_DIR, GALLERY_RST_PATH)
    HOSTED_STATIC_ROOT="/docs/bokehjs-static/"
    DETAIL_URL_ROOT="./"

    make_gallery(gallery_info['details'])

    try:
        webbrowser.open(HOSTED_STATIC_ROOT + "index.html")
    except:
        pass
