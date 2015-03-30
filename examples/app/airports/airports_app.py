"""
This file demonstrates a bokeh applet, which can either be viewed
directly on a bokeh-server, or embedded into a flask application.
See the README.md file in this directory for instructions on running.
"""

import logging

logging.basicConfig(level=logging.DEBUG)

from os import listdir
from os.path import dirname, join, splitext, exists, abspath
from six.moves import urllib
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
                                  NumberEditor, SelectEditor, Tabs, Panel)
from bokeh.charts import Bar

# build up list of airports data in the daily folder
data_dir = join(abspath(dirname(__file__)), "data")
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
airline_keys = ['id', 'name', 'alias', 'iata', 'icao', 'callsign',
                'country', 'active']

def check_or_download_data():#data_url, save_dir, exclude_term=None):
    """Downloads, then extracts a zip file."""
    heads = [airport_keys, route_keys, airline_keys]
    filenames = ['airports.dat', 'routes.dat', 'airlines.dat']
    urlbase = "https://sourceforge.net/p/openflights/code/HEAD/tree/openflights/data/%s?format=raw"
    for keys, datafile in zip(heads, filenames):
        localfile = join(data_dir, datafile)
        if not exists(localfile):
            url = urlbase % datafile
            print "Oooops, seems like you don't have the data file %s" % datafile
            r = raw_input("Can I download it from %s for you? [y|n]" % url)
            if r.lower() in ("", "y"):
                # get the file
                try:
                    print('Downloading %r to %r' % (url, localfile))
                    urllib.request.urlretrieve(url=url, filename=localfile)
                    with open(localfile, 'r') as lfile:
                        data = lfile.read()
                    fline = "%s\n" % (','.join(keys))
                    with open(localfile, 'w') as lfile:
                        lfile.write(fline + data)

                    print('Download successfully completed')
                except IOError as e:
                    print("Could not successfully retrieve %r" % data_url)
                    raise e

    print("files check done, ready!")

check_or_download_data()

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


# class AirportApp(VBox):
#     extra_generated_classes = [["AirportApp", "AirportApp", "VBox"]]
#     jsmodel = "VBox"
#
#     # text statistics
#     pretext = Instance(PreText)
#
#     # plots
#     from_plot = Instance(Plot)
#     to_plot = Instance(Plot)
#     hist1 = Instance(Plot)
#     hist2 = Instance(Plot)
#
#     # data source
#     source = Instance(ColumnDataSource)
#     air_source = Instance(ColumnDataSource)
#     dest_source = Instance(ColumnDataSource)
#
#     # layout boxes
#     mainrow = Instance(HBox)
#     histrow = Instance(HBox)
#     statsbox = Instance(VBox)
#
#     # inputs
#     ticker1 = String(default="AAPL")
#     ticker2 = String(default="GOOG")
#     ticker1_select = Instance(Select)
#     ticker2_select = Instance(Select)
#     input_box = Instance(VBoxForm)
#     data_table = Instance(DataTable)
#
#
#     def __init__(self, *args, **kwargs):
#         super(AirportApp, self).__init__(*args, **kwargs)
#         self._dfs = {}
#
#     @classmethod
#     def create(cls):
#         """
#         This function is called once, and is responsible for
#         creating all objects (plots, datasources, etc)
#         """
#         # create layout widgets
#         obj = cls()
#         obj._routes = None
#         obj.mainrow = HBox()
#         obj.histrow = HBox()
#         obj.statsbox = VBox()
#         obj.input_box = VBoxForm()
#
#         # create input widgets
#         obj.make_inputs()
#
#         # outputs
#         obj.pretext = PreText(text="", width=500)
#         obj.make_source()
#         obj.make_dest_source()
#         obj.make_plots()
#         obj.make_stats()
#         obj.make_table()
#
#         # layout
#         obj.set_children()
#
#         return obj
#
#     def make_table(self):
#         columns = [
#             TableColumn(field="id",          title="ID",     editor=IntEditor()),
#             TableColumn(field="name",          title="Name",     editor=StringEditor()),
#             TableColumn(field="city",          title="City",     editor=StringEditor()),
#             TableColumn(field="country",          title="Country",     editor=StringEditor()),
#             TableColumn(field="lat",         title="Lat.",         editor=NumberEditor()),
#             TableColumn(field="lng",          title="Lng.",    editor=NumberEditor()),
#         ]
#         self.data_table = DataTable(source=self.air_source, columns=columns, editable=True, width=1200)
#
#     def make_inputs(self):
#
#         self.ticker1_select = Select(
#             name='ticker1',
#             value='AAPL',
#             options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
#         )
#         self.ticker2_select = Select(
#             name='ticker2',
#             value='GOOG',
#             options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
#         )
#
#     @property
#     def selected_dfair(self):
#         pandas_df = self.dfair
#         selected = self.air_source.selected
#         if selected:
#             pandas_df = pandas_df.iloc[selected, :]
#
#             import pdb; pdb.set_trace()
#         return pandas_df
#
#     def make_source(self):
#         # self.source = ColumnDataSource(data=self.df)
#         self.air_source = ColumnDataSource(data=self.dfair)
#
#     def make_dest_source(self):
#         self.dest_source = ColumnDataSource(data=self.dfair)
#
#     def hist_plot_grouped_by(self, key):
#         if self._routes is None:
#             p = figure(
#                 title="Flights by Airlines",
#                 plot_width=500, plot_height=200,
#                 tools="",
#                 title_text_font_size="10pt",
#             )
#         else:
#             gr = self._routes.groupby([key])
#             counts = gr[key].agg(['count'])
#
#             p = Bar(
#                 counts, title="Flights by %s" % key,
#                 xlabel="%s" % key, ylabel="flights",
#                 tools='resize,hover,save,reset',
#                 width=500, height=400,stacked=True
#             )
#
#         return p
#
#     def make_plots(self):
#         # TODO: Let's keep tickers to  add some selection/filtering
#         #       functionality later
#         # ticker1 = self.ticker1
#         # ticker2 = self.ticker2
#
#         # create the departures scatter plot
#         self.from_plot = figure(title="Departures", **FIG_CONFG)
#         self.from_plot.circle('lng', "lat", source=self.air_source, **CIRCLES_CONFIG)
#
#         # create the arrivals scatter plot
#         self.to_plot = figure(title="Arrivals", **FIG_CONFG)
#         self.to_plot.circle('lng', "lat", source=self.dest_source, **CIRCLES_CONFIG)
#
#         # create the histograms plot
#         self.bar_plots()
#
#     def bar_plots(self):
#         # create the bar plots grouped by airline and source airport
#         # TODO: The group by keys should be controlled by tickers on the UI
#         self.hist1 = self.hist_plot_grouped_by('airline')
#         self.hist2 = self.hist_plot_grouped_by('source_ap')
#
#     def set_children(self):
#
#         panels = [
#             Panel(title="Histograms", child=HBox(children=[self.hist1, self.hist2])),
#             Panel(title="Table", child=self.data_table)
#         ]
#
#         self.children = [self.mainrow,  self.histrow]
#         self.mainrow.children = [self.from_plot, self.to_plot, self.statsbox]
#         self.input_box.children = [self.ticker1_select, self.ticker2_select]
#         self.histrow.children = [Tabs(tabs=panels, active=1),
#                                  # self.hist1, self.hist2
#         ]
#         self.statsbox.children = [self.pretext]
#
#     def input_change(self, obj, attrname, old, new):
#         if obj == self.ticker2_select:
#             self.ticker2 = new
#         if obj == self.ticker1_select:
#             self.ticker1 = new
#
#         self.make_source()
#         self.make_dest_source()
#         self.make_plots()
#         self.set_children()
#         curdoc().add(self)
#
#     def setup_events(self):
#         super(AirportApp, self).setup_events()
#         if self.air_source:
#             self.air_source.on_change('selected', self, 'airselection_change')
#
#         # TODO: Table selection changes do not propagate...
#
#         # if self.ticker1_select:
#         #     self.ticker1_select.on_change('value', self, 'input_change')
#         # if self.ticker2_select:
#         #     self.ticker2_select.on_change('value', self, 'input_change')
#
#     def make_stats(self):
#         import StringIO
#         output = StringIO.StringIO("")
#
#         cols = ['airline', 'source_ap', 'dest_ap', 'stops', 'equip']
#         if self._routes is not None:
#             stats = str(self._routes[cols])
#         else:
#             stats = self.dfair.info(buf=output)# "select an airport!"
#             stats = output.getvalue()
#         # stats = self.selected_df.describe()
#         self.pretext.text = str(stats)
#
#     def airselection_change(self, obj, attrname, old, new):
#         sel = self.air_source.selected
#         self.update_routes(self.dfair.iloc[sel, :])
#         self.select_destinations_from_routes(self._routes)
#
#         self.make_stats()
#         self.bar_plots()
#         self.set_children()
#         curdoc().add(self)
#
#     @property
#     def dfair(self):
#         return airports[['id', 'name', 'city', 'country', 'lat', 'lng']]
#         # return get_data_air(self.ticker1)
#
#     def update_routes(self, airports):
#         airports_id = [str(x) for x in airports.id]
#         self._routes = routes[routes['source_ap_id'].isin(airports_id)]
#
#     def select_destinations_from_routes(self, active_routes):
#         dests_id = [int(x) for x in active_routes.dest_ap_id if x!='\\N']
#         dests = airports[airports['id'].isin(dests_id)]
#
#
#         self.dest_source.selected = list(dests.index)
#
#
# # The following code adds a "/bokeh/airports/" url to the bokeh-server. This URL
# # will render this AirportApp. If you don't want serve this applet from a Bokeh
# # server (for instance if you are embedding in a separate Flask application),
# # then just remove this block of code.
# @bokeh_app.route("/bokeh/airports/")
# @object_page("airports")
# def make_airports():
#     app = AirportApp.create()
#     return app

#
#
#
# """
# This file demonstrates a bokeh applet, which can either be viewed
# directly on a bokeh-server, or embedded into a flask application.
# See the README.md file in this directory for instructions on running.
# """
#
# import logging
#
# logging.basicConfig(level=logging.DEBUG)
#
# from os import listdir
# from os.path import dirname, join, splitext
#
# import numpy as np
# import pandas as pd
#
# from bokeh.models import ColumnDataSource, Plot
# from bokeh.plotting import figure, curdoc
# from bokeh.properties import String, Instance
# from bokeh.server.app import bokeh_app
# from bokeh.server.utils.plugins import object_page
# from bokeh.models.widgets import (HBox, VBox, VBoxForm, PreText,
#                                   Select, AppHBox, AppVBox, AppVBoxForm)
#
#
#
from bokeh.simpleapp import simpleapp


dfair = airports[['id', 'name', 'city', 'country', 'lat', 'lng']]

def make_plots():
    # TODO: Let's keep tickers to  add some selection/filtering
    #       functionality later
    # ticker1 = self.ticker1
    # ticker2 = self.ticker2

    air_source = ColumnDataSource(data=dfair)
    dest_source = ColumnDataSource(data=dfair)

    # create the departures scatter plot
    from_plot = figure(title="Departures", **FIG_CONFG)
    from_plot.circle('lng', "lat", source=air_source, **CIRCLES_CONFIG)

    # create the arrivals scatter plot
    to_plot = figure(title="Arrivals", **FIG_CONFG)
    to_plot.circle('lng', "lat", source=dest_source, **CIRCLES_CONFIG)

    box = HBox(from_plot, to_plot)
    # create the histograms plot

    return box
    # self.bar_plots()

select1 = Select(name='ticker1', value='AAPL', options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO'])
# @simpleapp(select1, select2)
@simpleapp(select1)
def aiports(self):

    # panels = [
    #     Panel(title="Histograms", child=HBox(children=[self.hist1, self.hist2])),
    #     Panel(title="Table", child=self.data_table)
    # ]
    plotsbox = make_plots()
    # self.children = [self.mainrow,  self.histrow]
    # self.mainrow.children = [self.from_plot, self.to_plot, self.statsbox]
    # self.input_box.children = [self.ticker1_select, self.ticker2_select]
    # self.histrow.children = [Tabs(tabs=panels, active=1),
    #                          # self.hist1, self.hist2
    # ]
    # self.statsbox.children = [self.pretext]
    return plotsbox

aiports.route("/bokeh/airports/")

#
# select1 = Select(name='ticker1', value='AAPL', options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO'])
# select2 = Select(name='ticker2', value='GOOG', options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO'])
#
# @simpleapp(select1, select2)
# def stock(ticker1, ticker2):
#     pretext = PreText(text="", width=500)
#     df = get_data(ticker1, ticker2)
#     source = ColumnDataSource(data=df)
#     source.tags = ['main_source']
#     p = figure(
#         title="%s vs %s" % (ticker1, ticker2),
#         plot_width=400, plot_height=400,
#         tools="pan,wheel_zoom,box_select,reset",
#         title_text_font_size="10pt",
#     )
#     p.circle(ticker1 + "_returns", ticker2 + "_returns",
#              size=2,
#              nonselection_alpha=0.02,
#              source=source
#     )
#     stats = df.describe()
#     pretext.text = str(stats)
#     row1 = HBox(children=[p, pretext])
#     hist1 = hist_plot(df, ticker1)
#     hist2 = hist_plot(df, ticker2)
#     row2 = HBox(children=[hist1, hist2])
#     line1 = line_plot(ticker1, source)
#     line2 = line_plot(ticker2, source, line1.x_range)
#     output =  VBox(children=[row1, row2, line1, line2])
#     return output
#
# stock.route("/bokeh/stocks/")
#
# @simpleapp(select1, select2)
# def stock2(ticker1, ticker2):
#     pretext = PreText(text="", width=500)
#     df = get_data(ticker1, ticker2)
#     source = ColumnDataSource(data=df)
#     source.tags = ['main_source']
#     p = figure(
#         title="%s vs %s" % (ticker1, ticker2),
#         plot_width=400, plot_height=400,
#         tools="pan,wheel_zoom,box_select,reset",
#         title_text_font_size="10pt",
#     )
#     p.circle(ticker1 + "_returns", ticker2 + "_returns",
#              size=2,
#              nonselection_alpha=0.02,
#              source=source
#     )
#     stats = df.describe()
#     pretext.text = str(stats)
#     hist1 = hist_plot(df, ticker1)
#     hist2 = hist_plot(df, ticker2)
#     line1 = line_plot(ticker1, source)
#     line2 = line_plot(ticker2, source, line1.x_range)
#     return dict(scatterplot=p,
#                 statstext=pretext,
#                 hist1=hist1,
#                 hist2=hist2,
#                 line1=line1,
#                 line2=line2)
#
# @stock2.layout
# def stock2_layout(app):
#     widgets = AppVBoxForm(app=app, children=['ticker1', 'ticker2'])
#     row1 = AppHBox(app=app, children=['scatterplot', 'statstext'])
#     row2 = AppHBox(app=app, children=['hist1', 'hist2'])
#     all_plots = AppVBox(app=app, children=[row1, row2, 'line1', 'line2'])
#     app = AppHBox(app=app, children=[widgets, all_plots])
#     return app
#
# @stock2.update(['ticker1', 'ticker2'])
# def stock2_update_input(ticker1, ticker2, app):
#     return stock2(ticker1, ticker2)
#
# @stock2.update([({'tags' : 'main_source'}, ['selected'])])
# def stock2_update_selection(ticker1, ticker2, app):
#     source = app.select_one({'tags' : 'main_source'})
#     df = get_data(ticker1, ticker2)
#     if source.selected:
#         selected_df = df.iloc[source.selected, :]
#     else:
#         selected_df = df
#     hist1 = hist_plot(df, ticker1, selected_df=selected_df)
#     hist2 = hist_plot(df, ticker2, selected_df=selected_df)
#     app.objects['hist1'] = hist1
#     app.objects['hist2'] = hist2
#     app.objects['statstext'].text = str(selected_df.describe())
#
# stock2.route("/bokeh/stocks2/")
#
# def hist_plot(df, ticker, selected_df=None):
#     if selected_df is None:
#         selected_df = df
#     global_hist, global_bins = np.histogram(df[ticker + "_returns"], bins=50)
#     hist, bins = np.histogram(selected_df[ticker + "_returns"], bins=50)
#     width = 0.7 * (bins[1] - bins[0])
#     center = (bins[:-1] + bins[1:]) / 2
#     start = global_bins.min()
#     end = global_bins.max()
#     top = hist.max()
#     p = figure(
#         title="%s hist" % ticker,
#         plot_width=500, plot_height=200,
#         tools="",
#         title_text_font_size="10pt",
#         x_range=[start, end],
#         y_range=[0, top],
#     )
#     p.rect(center, hist / 2.0, width, hist)
#     return p
#
# def line_plot(ticker, source, x_range=None):
#     p = figure(
#         title=ticker,
#         x_range=x_range,
#         x_axis_type='datetime',
#         plot_width=1000, plot_height=200,
#         title_text_font_size="10pt",
#         tools="pan,wheel_zoom,box_select,reset"
#     )
#     p.circle(
#         'date', ticker,
#         size=2,
#         source=source,
#         nonselection_alpha=0.02
#     )
#     return p
#
# # build up list of stock data in the daily folder
# data_dir = join(dirname(__file__), "daily")
# try:
#     tickers = listdir(data_dir)
# except OSError as e:
#     print('Stock data not available, see README for download instructions.')
#     raise e
# tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]
#
# # cache stock data as dict of pandas DataFrames
# pd_cache = {}
#
#
# def get_ticker_data(ticker):
#     fname = join(data_dir, "table_%s.csv" % ticker.lower())
#     data = pd.read_csv(
#         fname,
#         names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
#         header=False,
#         parse_dates=['date']
#     )
#     data = data.set_index('date')
#     data = pd.DataFrame({ticker: data.c, ticker + "_returns": data.c.diff()})
#     return data
#
#
# def get_data(ticker1, ticker2):
#     if pd_cache.get((ticker1, ticker2)) is not None:
#         return pd_cache.get((ticker1, ticker2))
#
#     # only append columns if it is the same ticker
#     if ticker1 != ticker2:
#         data1 = get_ticker_data(ticker1)
#         data2 = get_ticker_data(ticker2)
#         data = pd.concat([data1, data2], axis=1)
#     else:
#         data = get_ticker_data(ticker1)
#
#     data = data.dropna()
#     pd_cache[(ticker1, ticker2)] = data
#     return data