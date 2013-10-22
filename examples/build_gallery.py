from bokeh.vendor.pycco import generate_func_docs
import os
_basedir = os.path.dirname(__file__)


demo_dir = os.path.join(_basedir, "../bokeh/server/static/demos")


"""
#these settings worked with a github pages checkout named gh-pages-Bokeh that was a peer to Bokeh
demo_dir = os.path.join(_basedir, "../../gh-pages-Bokeh")
HOSTED_STATIC_ROOT="https://s3.amazonaws.com/bokeh_docs/0.2/"
DETAIL_URL_ROOT="/Bokeh/detail/"

"""

#These settings work with localhost:5006
HOSTED_STATIC_ROOT="/static/"
DETAIL_URL_ROOT="/static/demos/detail/"
detail_dir = os.path.join(demo_dir, "detail")
def page_desc(prev_infos, f):
    if len(prev_infos) > 0:
        prev_info = prev_infos[-1]
    else:
        prev_info = {}
    name_ = f.__name__
    #I need to make sure I know where to put this snippet, where I
    #want it written
    plot = f()
    embed_snippet = plot.script_direct_inject(
        detail_dir, static_path=HOSTED_STATIC_ROOT, embed_path=DETAIL_URL_ROOT)
    page_info = dict(
        f=f, name=name_, embed_snippet=embed_snippet,
        detail_snippet = generate_func_docs(f, ""),
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

def make_gallery(functions):
    page_infos = reduce(page_desc, functions, [])
    for p, p_next in [[p, page_infos[i+1]] for i, p in enumerate(page_infos[:-1])]:
        p['next_detail_url'] = p_next['detail_page_url']
        p['next_detail_name'] = p_next['name']
    t = _load_template("detail.html")
    for info in page_infos:
        fname = os.path.join(detail_dir, info['name'] + ".html")
        info['HOSTED_STATIC_ROOT']= HOSTED_STATIC_ROOT
        print " writing to ", fname
        with open(fname, "w") as f:
            f.write(t.render(info))
    with open(os.path.join(demo_dir, "gallery.html"), "w") as f:
        f.write(
            _load_template("gallery.html").render(page_infos=page_infos))

if __name__ == "__main__":
    from plotting.file import (iris, candlestick, correlation, legend,
            glucose, stocks, line, rect, glyphs, scatter, vector, lorenz,
            color_scatter, choropleth, texas, markers)
    from glyphs import iris_splom, anscombe
    
    example_funcs = [
        iris.iris, candlestick.candlestick, legend.legend, 
        correlation.correlation,
        glucose.glucose, stocks.stocks, 
        vector.vector_example, lorenz.lorenz_example, color_scatter.color_scatter_example,
        line.line_example, scatter.scatter_example, 
        rect.rect_example, glyphs.glyphs,
        iris_splom.iris_splom, anscombe.anscombe,
        choropleth.choropleth_example,
        texas.texas_example,
        markers.scatter_example,
    ]
    make_gallery(example_funcs)

    
    try:
        import webbrowser
        webbrowser.open(HOSTED_STATIC_ROOT + "demos/gallery.html")
    except:
        pass
