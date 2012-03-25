
import numpy as np

from chaco.api import AbstractPlotData
from traits.api import Any, Dict

class PandasPlotData(AbstractPlotData):
    
    # The dataframe
    df = Any()

    # Dict mapping data series name to a mask array holding the selections
    selections = Dict()

    def __init__(self, dataframe):
        """PandasPlotData exposes a PlotData interface from a DataFrame.
        """
        self.df = dataframe

    def list_data(self):
        if self.df is None:
            return []
        else:
            return list(self.df.columsn.values)

    def get_data(self, name):
        if self.df is None:
            return []
        else:
            return np.asarray(self.df[name])

    def set_data(self):
        raise NotImplementedError

    def get_selection(self, name):
        """ Returns the selection for the given column name """
        return self.selections.get(name, None)

    def set_selection(self, name, selection):
        # Store the selection in a separate dict mapping name to its
        # selection array
        self.selections[name] = selection
        self.data_changed = True

