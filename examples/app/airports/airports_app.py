"""
This file demonstrates a bokeh applet, which can either be viewed
directly on a bokeh-server, or embedded into a flask application.
See the README.md file in this directory for instructions on running.
"""

import logging

logging.basicConfig(level=logging.DEBUG)

from os import listdir
from os.path import dirname, join, splitext

import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource, Plot
from bokeh.plotting import figure, curdoc
from bokeh.properties import String, Instance
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
from bokeh.models.widgets import (HBox, VBox, VBoxForm, PreText, Select,
                                  DataTable, TableColumn, StringFormatter,
                                  NumberFormatter, StringEditor, IntEditor,
                                  NumberEditor, SelectEditor)
from bokeh.charts import Bar

# build up list of airports data in the daily folder
data_dir = join(dirname(__file__), "data")
try:
    tickers = listdir(data_dir)
except OSError as e:
    print('Airports data not available, see README for download instructions.')
    raise e
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

airport_keys = ['id', 'name', 'city', 'country', 'iata', 'icao', 'lat',
                'lng', 'alt', 'dst', 'tz', 'tz_db']
route_keys = ['airline', 'id', 'source_ap', 'source_ap_id',
              'dest_ap', 'dest_ap_id', 'codeshare', 'stops', 'equip']
# airline_keys = ['id', 'name', 'alias', 'iata', 'icao', 'callsign',
#                 'country', 'active']

airports = pd.read_csv(join(data_dir, 'airports.dat'))
routes = pd.read_csv(join(data_dir, 'routes.dat'))
routes = routes[route_keys]
# routes = blaze.Data(join(data_dir, 'routes.dat'), route_keys)
# airlines = blaze.Data(join(data_dir, 'airlines.dat'))


# CONFIGURATIONS

FIG_CONFG = dict(
    plot_width=400, plot_height=400, title_text_font_size="10pt",
    tools="pan,wheel_zoom,box_select,resize,reset",
)
CIRCLES_CONFIG = dict(size=2, nonselection_alpha=0.02)


class AirportApp(VBox):
    extra_generated_classes = [["AirportApp", "AirportApp", "VBox"]]
    jsmodel = "VBox"

    # text statistics
    pretext = Instance(PreText)

    # plots
    from_plot = Instance(Plot)
    to_plot = Instance(Plot)
    hist1 = Instance(Plot)
    hist2 = Instance(Plot)

    # data source
    source = Instance(ColumnDataSource)
    air_source = Instance(ColumnDataSource)
    dest_source = Instance(ColumnDataSource)

    # layout boxes
    mainrow = Instance(HBox)
    histrow = Instance(HBox)
    statsbox = Instance(VBox)

    # inputs
    ticker1 = String(default="AAPL")
    ticker2 = String(default="GOOG")
    ticker1_select = Instance(Select)
    ticker2_select = Instance(Select)
    input_box = Instance(VBoxForm)
    data_table = Instance(DataTable)


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
        obj._routes = None
        obj.mainrow = HBox()
        obj.histrow = HBox()
        obj.statsbox = VBox()
        obj.input_box = VBoxForm()

        # create input widgets
        obj.make_inputs()

        # outputs
        obj.pretext = PreText(text="", width=500)
        obj.make_source()
        obj.make_dest_source()
        obj.make_plots()
        obj.make_stats()
        obj.make_table()

        # layout
        obj.set_children()

        return obj

    def make_table(self):
        columns = [
            TableColumn(field="id",          title="ID",     editor=IntEditor()),
            TableColumn(field="name",          title="Name",     editor=StringEditor()),
            TableColumn(field="city",          title="City",     editor=StringEditor()),
            TableColumn(field="country",          title="Country",     editor=StringEditor()),
            TableColumn(field="lat",         title="Lat.",         editor=NumberEditor()),
            TableColumn(field="lng",          title="Lng.",    editor=NumberEditor()),
        ]
        self.data_table = DataTable(source=self.air_source, columns=columns, editable=True)

    def make_inputs(self):

        self.ticker1_select = Select(
            name='ticker1',
            value='AAPL',
            options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
        )
        self.ticker2_select = Select(
            name='ticker2',
            value='GOOG',
            options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
        )

    @property
    def selected_dfair(self):
        pandas_df = self.dfair
        selected = self.air_source.selected
        if selected:
            pandas_df = pandas_df.iloc[selected, :]

            import pdb; pdb.set_trace()
        return pandas_df

    def make_source(self):
        # self.source = ColumnDataSource(data=self.df)
        self.air_source = ColumnDataSource(data=self.dfair)

    def make_dest_source(self):
        self.dest_source = ColumnDataSource(data=self.dfair)

    def hist_plot_grouped_by(self, key):
        if self._routes is None:
            p = figure(
                title="Flights by Airlines",
                plot_width=500, plot_height=200,
                tools="",
                title_text_font_size="10pt",
            )
        else:
            gr = self._routes.groupby([key])
            counts = gr[key].agg(['count'])

            p = Bar(
                counts, title="Flights by %s" % key,
                xlabel="%s" % key, ylabel="flights",
                tools='resize,hover,save,reset',
                width=500, height=400,stacked=True
            )

        return p

    def make_plots(self):
        # TODO: Let's keep tickers to  add some selection/filtering
        #       functionality later
        ticker1 = self.ticker1
        ticker2 = self.ticker2

        # create the departures scatter plot
        self.from_plot = figure(title="Departures", **FIG_CONFG)
        self.from_plot.circle('lng', "lat", source=self.air_source, **CIRCLES_CONFIG)

        # create the arrivals scatter plot
        self.to_plot = figure(title="Arrivals", **FIG_CONFG)
        self.to_plot.circle('lng', "lat", source=self.dest_source, **CIRCLES_CONFIG)

        # create the histograms plot
        self.bar_plots()

    def bar_plots(self):
        # create the bar plots grouped by airline and source airport
        # TODO: The group by keys should be controlled by tickers on the UI
        self.hist1 = self.hist_plot_grouped_by('airline')
        self.hist2 = self.hist_plot_grouped_by('source_ap')

    def set_children(self):
        self.children = [self.mainrow,  self.histrow, self.data_table]
        self.mainrow.children = [self.from_plot, self.to_plot, self.statsbox]
        self.input_box.children = [self.ticker1_select, self.ticker2_select]
        self.histrow.children = [self.hist1, self.hist2]
        self.statsbox.children = [self.pretext]

    def input_change(self, obj, attrname, old, new):
        if obj == self.ticker2_select:
            self.ticker2 = new
        if obj == self.ticker1_select:
            self.ticker1 = new

        self.make_source()
        self.make_dest_source()
        self.make_plots()
        self.set_children()
        curdoc().add(self)

    def setup_events(self):
        super(AirportApp, self).setup_events()
        if self.air_source:
            self.air_source.on_change('selected', self, 'airselection_change')

        # TODO: Table selection changes do not propagate...

        # if self.ticker1_select:
        #     self.ticker1_select.on_change('value', self, 'input_change')
        # if self.ticker2_select:
        #     self.ticker2_select.on_change('value', self, 'input_change')

    def make_stats(self):
        import StringIO
        output = StringIO.StringIO("")

        cols = ['airline', 'source_ap', 'dest_ap', 'stops', 'equip']
        if self._routes is not None:
            stats = str(self._routes[cols])
        else:
            stats = self.dfair.info(buf=output)# "select an airport!"
            stats = output.getvalue()
        # stats = self.selected_df.describe()
        self.pretext.text = str(stats)

    def airselection_change(self, obj, attrname, old, new):
        sel = self.air_source.selected
        self.update_routes(self.dfair.iloc[sel, :])
        self.select_destinations_from_routes(self._routes)

        self.make_stats()
        self.bar_plots()
        self.set_children()
        curdoc().add(self)

    @property
    def dfair(self):
        return airports[['id', 'name', 'city', 'country', 'lat', 'lng']]
        # return get_data_air(self.ticker1)

    def update_routes(self, airports):
        airports_id = [str(x) for x in airports.id]
        self._routes = routes[routes['source_ap_id'].isin(airports_id)]

    def select_destinations_from_routes(self, active_routes):
        dests_id = [int(x) for x in active_routes.dest_ap_id if x!='\\N']
        dests = airports[airports['id'].isin(dests_id)]


        self.dest_source.selected = list(dests.index)


# The following code adds a "/bokeh/airports/" url to the bokeh-server. This URL
# will render this AirportApp. If you don't want serve this applet from a Bokeh
# server (for instance if you are embedding in a separate Flask application),
# then just remove this block of code.
@bokeh_app.route("/bokeh/airports/")
@object_page("airports")
def make_airports():
    app = AirportApp.create()
    return app
