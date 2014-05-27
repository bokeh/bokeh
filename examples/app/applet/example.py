import bokeh.server
from bokeh.plotting import line, circle, curdoc

from bokeh.widgetobjects import (VBoxModelForm, HBox,
                                 BokehApplet, TextInput, PreText,
                                 Select, Slider)
from bokeh.objects import Plot, ColumnDataSource
from bokeh.plot_object import PlotObject
from bokeh.properties import (Dict, Float, String, Instance)
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

class MyModel(VBoxModelForm):
    """Input Widgets, define the fields you want to
    read from the input here as bokeh properties
    input_specs is a list of dictionary, specifying
    how the kind of input widget you want for each
    property.  the name field must match
    one of the properties, for example here,
    we use names of offset and scale.  You can
    also specify title, if you want a different
    label in the generated form
    """
    offset = Float(1.0)
    scale = Float(1.0)
    title = String(default="my sin wave")
    input_specs = [
        {"widget" : TextInput,
         "name" : "title",
         "value" : "my sin wave"},
        {"widget" : Slider,
         "name" : "offset",
         "value" : 1.0,
         "start" : 0.0,
         "end" : 5.0},
        {"widget" : Slider,
         "name" : "scale",
         "value" : 1.0,
         "start" : -5.0,
         "end" : 5.0},
    ]
class MyApp(BokehApplet):
    plot = Instance(Plot)
    source = Instance(ColumnDataSource)

    def create(self, doc):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        self.modelform = MyModel()
        self.modelform.create_inputs(doc)
        self.source = ColumnDataSource(data={'x':[], 'y':[]})
        self.update_data()
        self.plot = line('x', 'y', source=self.source,
                         plot_width=400, plot_height=400,
                         title=self.modelform.title
        )
        self.children.append(self.modelform)
        self.children.append(self.plot)

    def input_change(self, obj, attrname, old, new):
        """
        This function is called whenever the input form changes
        This is responsible for updating the plot, or whatever
        you want.  The signature is
        obj : the object that changed
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
        self.update_data()
        self.plot.title = self.modelform.title

    def update_data(self):
        N = 80
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        logging.debug ("PARAMS %s %s", self.modelform.offset, self.modelform.scale)
        y = self.modelform.offset + y * self.modelform.scale
        self.source.data = {'x' : x, 'y' : y}

# the following addes "/exampleapp" as a url which renders MyApp

bokeh_url = "http://localhost:5006"
MyApp.add_route("/exampleapp", bokeh_url)



"""
Example 2
you need to run download.py to get the data from quantquote
"""
import os
from os.path import join, dirname, splitext
import pandas as pd
data_dir = join(dirname(__file__), "daily")
tickers = os.listdir(data_dir)
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

class StockInputModel(VBoxModelForm):
    """Input Widgets, define the fields you want to
    read from the input here as bokeh properties
    input_specs is a list of dictionary, specifying
    how the kind of input widget you want for each
    property.  the name field must match
    one of the properties, for example here,
    we use names of offset and scale.  You can
    also specify title, if you want a different
    label in the generated form
    """
    ticker1 = String(default="AAPL")
    ticker2 = String(default="GOOG")
    input_specs = [
        {"widget" : Select,
         "name" : "ticker1",
         "value" : "AAPL",
         "options" : ["AAPL","GOOG","INTC","BRCM","YHOO"]
     },
        {"widget" : Select,
         "name" : "ticker2",
         "value" : "GOOG",
         "options" : ["AAPL","GOOG","INTC","BRCM","YHOO"]
     }
    ]

class StockApp(BokehApplet):
    plot = Instance(Plot)
    source = Instance(ColumnDataSource)
    pretext = Instance(PreText)

    def get_data(self, ticker1, ticker2):
        fname = join(data_dir, "table_%s.csv" % ticker1.lower())
        data1 = pd.read_csv(fname,
                            names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
                            header=False,
                            parse_dates=['date'])
        data1 = data1.set_index('date')
        fname = join(data_dir, "table_%s.csv" % ticker2.lower())
        data2 = pd.read_csv(fname,
                            names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
                            header=False,
                            parse_dates=['date'])
        data2 = data2.set_index('date')
        data = pd.DataFrame({ticker1 : data1.c, ticker2 : data2.c})
        data[ticker1 + "_returns"] = data[ticker1].diff()
        data[ticker2 + "_returns"] = data[ticker2].diff()
        data = data.dropna()
        return data

    def create(self, doc):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        self.modelform = StockInputModel()
        self.modelform.create_inputs(doc)
        ticker1 = self.modelform.ticker1
        ticker2 = self.modelform.ticker2
        self.pretext = PreText(text="")
        self.make_source(ticker1, ticker2)
        self.make_plots(ticker1, ticker2)
        self.make_stats()
        self.set_children()

    def make_source(self, ticker1, ticker2):
        df = self.get_data(ticker1, ticker2)
        self.source = ColumnDataSource(data=df)

    def make_plots(self, ticker1, ticker2):
        self.plot = circle(ticker1 + "_returns", ticker2 + "_returns",
                           title="%s vs %s" %(ticker1, ticker2),
                           source=self.source,
                           plot_width=400, plot_height=400,
                           tools="pan,wheel_zoom,select"
        )

    def set_children(self):
        self.children = [self.modelform, self.plot, self.pretext]
        curdoc()._plotcontext.children = [self]
        curdoc().add_all()

    def input_change(self, obj, attrname, old, new):
        """
        This function is called whenever the input form changes
        This is responsible for updating the plot, or whatever
        you want.  The signature is
        obj : the object that changed
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
        if attrname in ("ticker1", "ticker2"):
            ticker1 = self.modelform.ticker1
            ticker2 = self.modelform.ticker2
            self.make_source(ticker1, ticker2)
            self.make_plots(ticker1, ticker2)
            self.set_children()

    def setup_events(self):
        super(StockApp, self).setup_events()
        if self.source:
            self.source.on_change('selected', self, 'selection_change')

    def make_stats(self):
        pandas_df = pd.DataFrame(self.source.data)
        selected = self.source.selected
        if selected:
            pandas_df = pandas_df.iloc[selected, :]
        stats = pandas_df.describe()
        self.pretext.text = str(stats)

    def selection_change(self, obj, attrname, old, new):
        self.make_stats()
# the following addes "/exampleapp" as a url which renders StockApp

bokeh_url = "http://localhost:5006"
StockApp.add_route("/stocks", bokeh_url)


if __name__ == "__main__":

    bokeh.server.run()
