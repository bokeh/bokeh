

import os
_basedir = os.path.dirname(__file__)

from bokeh.vendor.pycco import generate_func_docs
MAIN= __name__ == "__main__"

doc_funcs = {}
def doc_dec(f):
    name_ = f.__name__
    def inner_f():
        plot = f()
        if isinstance(plot, str):
            output = plot
        else:
            output = plot.script_direct_inject(
                os.path.join(_basedir, "../static/demos"))
        return generate_func_docs(f, output)
    inner_f.__name__ = name_
    if MAIN:
        doc_funcs[name_] = inner_f
        return inner_f
    else:
        #this causes errors when running as __main__
        from ..app import app
        ret_f = app.route("/bokeh/demo/" + name_)(inner_f)
        return ret_f

@doc_dec
def add():
    """ docstring """
    return str(2+3)


@doc_dec
def make_plot2():

    from numpy import pi, arange, sin, cos
    import numpy as np

    from bokeh.objects import (
        Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, GlyphRenderer,
        PanTool, PreviewSaveTool)

    from bokeh.glyphs import Circle
    from bokeh import session

    x = arange(-2*pi, 2*pi, 0.1)
    y = sin(x)
    z = cos(x)
    widths = np.ones_like(x) * 0.02
    heights = np.ones_like(x) * 0.2

    source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
                                    heights=heights))

    xdr = DataRange1d(sources=[source.columns("x")])
    ydr = DataRange1d(sources=[source.columns("y")])

    circle = Circle(x="x", y="y", fill="red", radius=5, line_color="black")

    glyph_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle)

    pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
    previewtool = PreviewSaveTool(dataranges=[xdr,ydr], dimensions=("width","height"))

    plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
                border= 80)
    #by setting our own name 
    plot._id = "make_plot"
    xaxis = LinearAxis(plot=plot, dimension=0)
    yaxis = LinearAxis(plot=plot, dimension=1)

    plot.renderers.append(glyph_renderer)
    plot.tools = [pantool, previewtool]

    sess = session.HTMLFileSession()

    sess.add(plot, glyph_renderer, xaxis, yaxis, # xgrid, ygrid,
             source,  xdr, ydr, pantool, previewtool)
    sess.plotcontext.children.append(plot)
    sess.plotcontext._dirty = True
    # not so nice.. but set the model doens't know
    # that we appended to children
    return plot





if __name__ == "__main__":
    for func_name, func in doc_funcs.items():
        f_name = os.path.join(
            _basedir,  "../static/demos/",  func_name + ".html")
        with open(f_name, "w") as f:
            f.write(func())

