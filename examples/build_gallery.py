from bokeh.vendor.pycco import generate_func_docs
import os
_basedir = os.path.dirname(__file__)

demo_dir = os.path.join(_basedir, "../bokeh/server/static/demos")


def page_desc(prev_infos, f):
    if len(prev_infos) > 0:
        prev_info = prev_infos[-1]
    else:
        prev_info = {}
    name_ = f.__name__
    #I need to make sure I know where to put this snippet, where I
    #want it written
    plot = f()
    embed_snippet = plot.script_direct_inject(demo_dir, static_path="../")
    page_info = dict(
        f=f, name=name_, embed_snippet=embed_snippet,
        detail_snippet = generate_func_docs(f, embed_snippet),
        detail_page_url=name_ + ".html",
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
        fname = os.path.join(demo_dir, info['detail_page_url'])
        print " writing to ", fname
        with open(fname, "w") as f:
            f.write(t.render(info))
    with open(os.path.join(demo_dir, "gallery.html"), "w") as f:
        f.write(
            _load_template("gallery.html").render(page_infos=page_infos))

if __name__ == "__main__":
    from plotting.file import (
        iris, candlestick, correlation, legend,
        glucose, stocks, line, rect, glyphs, scatter)
    
    example_funcs = [
        iris.iris, candlestick.candlestick, legend.legend, 
        correlation.correlation,
        glucose.glucose, stocks.stocks, 
        line.line_example, rect.rect_example, glyphs.glyphs, scatter.scatter_example
    ]

    make_gallery(example_funcs)
