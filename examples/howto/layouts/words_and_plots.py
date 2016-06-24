from bokeh.sampledata.glucose import data
from bokeh.sampledata.iris import flowers

from bokeh.charts import Scatter
from bokeh.charts.operations import blend
from bokeh.io import show, output_file
from bokeh.layouts import layout
from bokeh.models import Paragraph, HoverTool, Div
from bokeh.palettes import Spectral4
from bokeh.plotting import figure

output_file("words_and_plots.html")


def text():
    return Paragraph(text="""
        Bacon ipsum dolor amet hamburger brisket prosciutto, pork ball tip andouille
        sausage landjaeger filet mignon ribeye ground round. Jerky fatback cupim
        landjaeger meatball pork loin corned beef, frankfurter short ribs short loin
        bresaola capicola chuck kevin. Andouille biltong turkey, tail t-bone ribeye
        short loin tongue prosciutto kielbasa short ribs boudin. Swine beef ribs
        tri-tip filet mignon bresaola boudin beef meatball venison leberkas fatback
        strip steak landjaeger drumstick prosciutto.
        Bacon ipsum dolor amet hamburger brisket prosciutto, pork ball tip andouille
        sausage landjaeger filet mignon ribeye ground round. Jerky fatback cupim
        landjaeger meatball pork loin corned beef, frankfurter short ribs short loin
        bresaola capicola chuck kevin. Andouille biltong turkey, tail t-bone ribeye
        short loin tongue prosciutto kielbasa short ribs boudin. Swine beef ribs
        tri-tip filet mignon bresaola boudin beef meatball venison leberkas fatback
        strip steak landjaeger drumstick prosciutto.
        """)


def scatter():
    s = Scatter(
        flowers,
        title="Fisher's Iris data set", tools='tap,box_select,save',
        x=blend('petal_length', name='Length'),
        y=blend('petal_width', name='Width'),
        color='species', palette=Spectral4, legend=True,
    )
    # Lets move the legend off-canvas!
    legend = s.legend[0]
    legend.border_line_color = None
    legend.orientation = 'horizontal'
    legend.location = (0, 0)
    s.above.append(legend)
    return s


def hover_plot():
    x = data.ix['2010-10-06'].index.to_series()
    y = data.ix['2010-10-06']['glucose']
    p = figure(
        plot_width=800, plot_height=400, x_axis_type="datetime",
        tools="", toolbar_location=None, title='Hover over points'
    )
    p.line(x, y, line_dash="4 4", line_width=1, color='gray')
    cr = p.circle(
        x, y, size=20, fill_color="grey", alpha=0.1, line_color=None,
        hover_fill_color="firebrick", hover_alpha=0.5, hover_line_color=None
    )
    p.add_tools(HoverTool(tooltips=None, renderers=[cr], mode='hline'))
    return p

def intro():
    return Div(text="""
        <h3>Welcome to Layout!</h3>
        <p>Hopefully you'll see from the code, that the layout tries to get out of your way
        and do the right thing. Of course, it might not always, so please report bugs as you
        find them and attach them to the epic we're creating <a href="">here</a>.</p>
        <p>This is an example of <code>scale_width</code> mode (happy to continue the conversations
        about what to name the modes). In <code>scale_width</code> everything responds to the width
        that's available to it. Plots alter their height to maintain their aspect ratio, and widgets
        are allowed to grow as tall as they need to accomodate themselves. Often times widgets
        stay the same height, but text is a good example of a widget that doesn't.</p>
        <h4>I want to stress that this was all written in python. There is no templating or
        use of <code>bokeh.embed</code>.</h4>
    """)


l = layout(
    [
        [intro()],
        [text(), scatter()],
        [text()],
        [hover_plot(), text()],
    ],
    sizing_mode='scale_width'
)

show(l)
