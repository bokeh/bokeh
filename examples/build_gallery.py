import os
import re
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter
import inspect


_basedir = os.path.dirname(__file__)


demo_dir = os.path.join(_basedir, "../bokeh/server/static/demos")
GALLERY_SNIPPET_PATH = os.path.join(_basedir, "../sphinx/_templates/gallery_core.html")

#These settings work with localhost:5006
HOSTED_STATIC_ROOT="/static/"
DETAIL_URL_ROOT="/static/demos/detail/"
detail_dir = os.path.join(demo_dir, "detail")

def get_code(func):
    code = inspect.getsource(func)
    #remove any decorators
    code = re.sub('^@.*\\n', '', code)
    return code
def page_desc(prev_infos, module_desc):
    module_path, name_ = module_desc
    temp_dict = {}
    execfile(module_path, temp_dict)
    plot = temp_dict['curplot']()

    if len(prev_infos) > 0:
        prev_info = prev_infos[-1]
    else:
        prev_info = {}
    embed_snippet = plot.inject_snippet(
        embed_save_loc= detail_dir, static_path=HOSTED_STATIC_ROOT,
        embed_base_url=DETAIL_URL_ROOT)
    detail_snippet = highlight(open(module_path).read(), PythonLexer(), HtmlFormatter())
    page_info = dict(
        name=name_, embed_snippet=embed_snippet,
        detail_snippet = detail_snippet,
        detail_page_url=DETAIL_URL_ROOT + name_ + ".html",
        prev_detail_url=prev_info.get('detail_page_url', ""),
        prev_detail_name=prev_info.get('name', ""))
    if len(prev_infos) == 0:
        prev_infos = [page_info]
    else:
        prev_infos.append(page_info)

    return prev_infos

def _load_template(filename):
    import jinja2
    with open(os.path.join(_basedir, filename)) as f:
        return jinja2.Template(f.read())

def make_gallery(module_descs):
    page_infos = reduce(page_desc, module_descs, [])
    for p, p_next in [[p, page_infos[i+1]] for i, p in enumerate(page_infos[:-1])]:
        p['next_detail_url'] = p_next['detail_page_url']
        p['next_detail_name'] = p_next['name']
    t = _load_template("detail.html")    
    gallery_template = '''
    <li>
        <a href="%(detail_page_url)s">%(name)s
          <img src="/static/img/gallery/%(name)s.png"
               class="gallery" />
        </a>
        </li>
    '''
    gallery_snippet = '<ul class="gallery clearfix">'
    for info in page_infos:
        gallery_snippet +=  gallery_template % info

        fname = os.path.join(detail_dir, info['name'] + ".html")
        info['HOSTED_STATIC_ROOT']= HOSTED_STATIC_ROOT
        print " writing to ", fname
        with open(fname, "w") as f:
            f.write(t.render(info))
    gallery_snippet += "</ul>"    
    with open(GALLERY_SNIPPET_PATH, "w") as f:
        f.write(gallery_snippet)

if __name__ == "__main__":
    # from plotting.file import (iris, candlestick, correlation, legend, 
    #         glucose, stocks, vector, lorenz,
    #         color_scatter, choropleth, texas, markers)
    # from glyphs import iris_splom, anscombe


    make_gallery(
        [#("glyphs/anscombe.py", 'anscombe',),
        ("plotting/file/candlestick.py", 'candlestick',),    
        ("plotting/file/correlation.py", 'correlation',),    
        ("plotting/file/glucose.py", 'glucose',),    
        ("plotting/file/legend.py", 'legend',),    
        ("plotting/file/stocks.py", 'stocks',),    
        ("plotting/file/choropleth.py", 'choropleth_example',),    
        ("plotting/file/stocks.py", 'stocks',),    
        ("plotting/file/color_scatter.py", 'color_scatter_example',),    
        ("plotting/file/vector.py", 'vector_example',),    
        ("plotting/file/lorenz.py", 'lorenz_example',),    
        #("plotting/file/texas.py", 'texas_example',),    
        ("plotting/file/markers.py", 'scatter_example',),    


         ]
    )

    # example_funcs = [
    #     iris.iris, candlestick.candlestick, legend.legend, 
    #     correlation.correlation, glucose.glucose, stocks.stocks, 
    #     vector.vector_example, lorenz.lorenz_example, color_scatter.color_scatter_example,
    #     iris_splom.iris_splom, anscombe.anscombe,
    #     choropleth.choropleth_example,
    #     texas.texas_example,
    #     #markers.scatter_example,
    # ]
    # make_gallery(example_funcs)

    
    try:
        import webbrowser
        webbrowser.open(HOSTED_STATIC_ROOT + "demos/gallery.html")
    except:
        pass
