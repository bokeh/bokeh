from __future__ import print_function

import os
import six
import webbrowser

from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

from bokeh import plotting
from bokeh.document import Document
from bokeh.embed import autoload_static
from bokeh.resources import Resources

# patch open and show and save to be no-ops
def noop(*args, **kwargs):
    pass
webbrowser.open = noop
plotting.save = noop
plotting.show = noop

def page_desc(module_desc):
    module_path, name = module_desc['file'], module_desc['name']
    var_name = module_desc.get('var_name', None)

    plotting._default_document = Document()

    namespace = {}
    with open(module_path, "r") as module_file:
        six.exec_(module_file.read(), namespace)

    if var_name:
        objs = [namespace[var_name]]
    else:
        objs = plotting.curdoc().get_context().children

    embed_snippet = ""
    for i, obj in enumerate(objs):
        filename = name + "." + str(i) + ".js"
        js, tag = autoload_static(
            obj,
            Resources(mode="server", root_url=HOSTED_STATIC_ROOT),
            os.path.join(DETAIL_URL_ROOT, filename)
        )
        embed_snippet += tag
        with open(os.path.join(SNIPPET_BUILD_DIR, filename), "w") as f:
            f.write(js)

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
    HOSTED_STATIC_ROOT="/docs/"
    DETAIL_URL_ROOT="./"

    make_gallery(gallery_info['details'])
