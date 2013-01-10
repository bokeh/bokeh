
import numpy as np

from chaco.api import AbstractPlotData
from traits.api import Any, Dict, Tuple

class PandasPlotData(AbstractPlotData):
    
    # The dataframe
    df = Any()

    # Optional "groupby" and "index" to use to select a particular slice
    # of the dataset
    facets = Tuple()
    group_key = Tuple()

    # Dict mapping data series name to a mask array holding the selections
    selections = Dict()

    # A Pandas GroupBy object, used to support faceted access to data
    _groupby = Any()

    def __init__(self, dataframe, **kwargs):
        """ PandasPlotData exposes a PlotData interface from a DataFrame.
        """
        AbstractPlotData.__init__(self, **kwargs)
        self.df = dataframe

    def facet(self, facets):
        """ Returns a list of PandasPlotData objects derived from this one,
        with each one representing a different group.
        """
        groupby = self.df.groupby(by=facets)
        return [PandasPlotData(self.df, facets = facets,
                    _groupby = groupby, group_key = key) \
                    for key in groupby.groups.keys()]

    def list_data(self):
        if self.df is None:
            return []
        else:
            return list(self.df.columns.values)

    def get_data(self, name):
        if self.df is None:
            return []
        elif self.group_key:
            return np.asarray(self._groupby.get_group(self.group_key)[name])
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

