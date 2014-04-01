
from flask import render_template
import os

from ..app import bokeh_app


def dom_embed(plot, **kwargs):
    if bokeh_app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(bokeh_app, slug['libs'])
        hemsource = os.path.join(bokeh_app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(bokeh_app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/bokeh.js']
        hem_js = []
    plot2 = make_test_plot()
    return render_template(
        "embed.html", jsfiles=static_js, hemfiles=hem_js,
        docid=plot._session.docid, docapikey=plot._session.apikey, modelid=plot._id,
        plot2=plot2, **kwargs)

def make_test_plot():
    import numpy as np
    from bokeh.plotting import output_server, line

    N = 80

    x = np.linspace(0, 4*np.pi, N)
    y = np.sin(x)

    output_server("line.py example")

    l = line(
        x,y, color="#0000FF",
        plot_height=300, plot_width=300,
        tools="pan,resize")
    return l
    #show()





@bokeh_app.route("/bokeh/generate_embed_test/<inject_type>")
def generate_embed(inject_type):
    """the following 8 functions setup embedding pages in a variety of formats

    urls with no_js don't have any of our javascript included in
    script tags.  the embed.js code is supposed to make sure the
    proper js files are sourced.  Embed.js should only donwload a new
    js file if the existing javascript code isn't in the runtime
    environment.

    static places a script tag into the html markup.

    static_double places two script tags in the dom.  This should
    still cause the bokeh js to be downloaded only once

    the rest of the urls construct a script tag with a source of the
    embed.js along with the proper attributes.

    with_delay doesn't inject until 5 seconds after pageload

    double_delay injects two separate plots, one at 3 seconds in,
        the other at 5 seconds in.

    onload injects at onload

    direct injects as soon as the script block is hit.

    Everyone one of these urls should display the same plot
    """

    plot = make_test_plot()
    delay, double_delay, onload, direct, file_snippet, file_relative_snippet  = [False] * 6
    plot_scr = ""

    if inject_type == "delay":
        delay = True
    if inject_type == "double_delay":
        double_delay = True
    elif inject_type == "onload":
        onload = True
    elif inject_type == "direct":
        direct = True

    elif inject_type == "file_snippet":
        file_snippet = True
        embed_data_file = os.path.join(
            os.path.dirname(
                os.path.abspath(__file__)), "..", "static")
        plot_scr = plot.create_html_snippet(
            embed_base_url = "http://localhost:5006/static/",
            embed_save_loc=embed_data_file)

    elif inject_type == "inline_snippet":
        file_snippet = True
        plot_scr = plot.create_html_snippet(inline=True)

    elif inject_type == "file_relative_snippet":
        file_relative_snippet = True
        embed_data_file = os.path.join(
            os.path.dirname(
                os.path.abspath(__file__)), "..", "static")
        plot_scr = plot.create_html_snippet(
            embed_base_url = "../../static/",
            embed_save_loc=embed_data_file)


    elif inject_type == "static":
        plot_scr = plot.create_html_snippet(server=True)
    elif inject_type == "static_double":

        plot_scr = "%s %s" % (plot.create_html_snippet(server=True),
                              plot.create_html_snippet(server=True))



    return dom_embed(
        plot, delay=delay, onload=onload, 
        direct=direct,  plot_scr=plot_scr, double_delay=double_delay,
        file_snippet=file_snippet, file_relative_snippet=file_relative_snippet)
