"""
This file demonstrates a bokeh applet, which can either be viewed
directly on a bokeh-server, or embedded into a flask application.
See the README.md file in this directory for instructions on running.
"""

import logging
logging.basicConfig(level=logging.DEBUG)

import pandas as pd
from bokeh.models import ColumnDataSource, Plot
from bokeh.plotting import figure, curdoc
from bokeh.properties import String, Instance
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
from bokeh.models.widgets import HBox, VBox, VBoxForm, PreText, Select


keys = ['from_airport', 'from_lng', 'from_lat', 'to_airport', 'to_lng', 'to_lat']
DATA = [
    ['Balandino', 61.838, 55.509, 'Domododevo', 38.51, 55.681],
    ['Balandino', 61.838, 55.509, 'Kazan', 49.464, 56.01],
    ['Balandino', 61.838, 55.509, 'Tolmachevo', 83.084, 55.021],
    ['Domododevo', 38.51, 55.681, 'Balandino', 61.838, 55.509],
    ['Domododevo', 38.51, 55.681, 'Khrabrovo', 20.987, 55.483],
    ['Domododevo', 38.51, 55.681, 'Kazan', 49.464, 56.01],
    ['Domododevo', 38.51, 55.681, 'Beaufort Mcas', -80.539, 32.795],
    ['Domododevo', 38.51, 55.681, 'Penza Airport', 45.035, 53.184],
    ['Domododevo', 38.51, 55.681, 'Bugulma Airport', 53.336, 55.066]
]

def get_data_air():
    data = pd.DataFrame(DATA, columns=keys)
    return data

class AirportApp(VBox):
    extra_generated_classes = [["AirportApp", "AirportApp", "VBox"]]
    jsmodel = "VBox"

    # text statistics
    pretext = Instance(PreText)

    # plots
    from_plot = Instance(Plot)
    to_plot = Instance(Plot)
    plot = Instance(Plot)
    line_plot1 = Instance(Plot)
    line_plot2 = Instance(Plot)
    hist1 = Instance(Plot)
    hist2 = Instance(Plot)

    # data source
    air_source = Instance(ColumnDataSource)

    # layout boxes
    mainrow = Instance(HBox)
    statsbox = Instance(VBox)

    def __init__(self, *args, **kwargs):
        super(AirportApp, self).__init__(*args, **kwargs)
        self._dfs = {}

    @classmethod
    def create(cls):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        # create layout widgets
        obj = cls()
        obj.mainrow = HBox()
        obj.statsbox = VBox()

        # outputs
        obj.pretext = PreText(text="", width=500)
        obj.make_source()
        obj.make_plots()
        obj.make_text()

        # layout
        obj.set_children()
        return obj

    @property
    def selected_dfair(self):
        """
        returns a self.dfair applying the filters to express the current
        selections on the air_source
        """
        pandas_df = self.dfair
        selected = self.air_source.selected
        if selected:
            pandas_df = pandas_df.iloc[selected, :]
        return pandas_df

    def make_source(self):
        self.air_source = ColumnDataSource(data=self.dfair)

    def make_plots(self):
        plots_conf = dict(
            plot_width=400, plot_height=400,
            tools="pan,wheel_zoom,box_select,reset",
            title_text_font_size="10pt"
        )
        # create a scatter plot for the "from" airports
        self.from_plot = figure(title="From", **plots_conf)
        self.from_plot.circle(
            'from_lng', "from_lat",
            size=2,
            source=self.air_source,
            nonselection_alpha=0.02
        )
        # create a scatter plot for the "from" airports
        self.to_plot = figure(title="To", **plots_conf)
        self.to_plot.circle(
            'to_lng', "to_lat",
            size=2,
            source=self.air_source,
            nonselection_alpha=0.02
        )

    def set_children(self):
        """
        Build the app layout
        """
        self.children = [self.mainrow, self.statsbox]
        self.mainrow.children = [self.from_plot, self.to_plot]
        self.statsbox.children = [self.pretext]

    def setup_events(self):
        """
        Map events happening on the app (input changes,
        selections on plots, etc..) to actions
        """
        super(AirportApp, self).setup_events()
        if self.air_source:
            self.air_source.on_change('selected', self, 'airselection_change')

    def make_text(self):
        """
        Change the text of the PreText widget on the UI with the updated
        info about the airports selections
        """
        self.pretext.text = str(self.selected_dfair)

    def airselection_change(self, obj, attrname, old, new):
        self.make_text()
        self.set_children()
        curdoc().add(self)

    @property
    def dfair(self):
        return get_data_air()


# The following code adds a "/bokeh/airports/" url to the bokeh-server and
# renders the AirportApp returned from make_app. If you don't want serve
# this applet from a Bokeh server (for instance if you are embedding in a
# separate Flask application), then just remove this block of code.
@bokeh_app.route("/bokeh/airports/")
@object_page("airports")
def make_app():
    app = AirportApp.create()
    return app
