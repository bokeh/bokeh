from __future__ import print_function
from os.path import join
import numpy as np
import uuid
import pandas as pd
from bokeh.objects import (PlotObject, ServerDataSource, Plot, ColumnDataSource)
from bokeh.properties import (HasProps, Dict, Enum, Either, Float, Instance, Int,
                              List, String, Color, Include, Bool, Tuple, Any)
import posixpath
from arraymanagement.client import ArrayClient
import tables

class App(PlotObject):
    data_source = Instance(ColumnDataSource)
    scatter_plot = Instance(Plot)
    stats = String()

    def update(self, **kwargs):
        super(App, self).update(**kwargs)
        if self.data_source:
            self.data_source.on_change('selected', self, 'selection_change')

    def selection_change(self, obj, attrname, old, new):
        pandas_df = pd.DataFrame(self.data_source.data)
        selected = self.data_source.selected
        if selected:
            pandas_df = pandas_df.iloc[selected, :]
        stats = pandas_df.describe()
        self.stats = str(stats)
