from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import HasProps
from ..properties import Any, Int, String, Instance, List, Dict, Either

class DataSource(PlotObject):
    """ Base class for data sources """
    # List of names of the fields of each tuple in self.data
    # ordering is incoporated here
    column_names = List(String)
    selected = List(Int) # index of selected points

    def columns(self, *columns):
        """ Returns a ColumnsRef object that points to a column or set of
        columns on this data source
        """
        return ColumnsRef(source=self, columns=list(columns))

class ColumnsRef(HasProps):
    source = Instance(DataSource)
    columns = List(String)

class ColumnDataSource(DataSource):
    # Maps names of columns to sequences or arrays
    data = Dict(String, Any)

    # Maps field/column name to a DataRange or FactorRange object. If the
    # field is not in the dict, then a range is created automatically.
    cont_ranges = Dict(String, Instance(".models.Range"))
    discrete_ranges = Dict(String, Instance(".models.Range"))

    def __init__(self, *args, **kw):
        """ Modify the basic DataSource/PlotObj constructor so that if we
        are called with a single argument that is a dict, then we treat
        that implicitly as our "data" attribute.
        """
        if len(args) == 1 and "data" not in kw:
            kw["data"] = args[0]
        raw_data = kw.pop("data", {})
        if not isinstance(raw_data, dict):
            import pandas as pd
            if isinstance(raw_data, pd.DataFrame):
                raw_data = self.from_df(raw_data)
            else:
                raise ValueError("expected a dict or pandas.DataFrame, got %s" % raw_data)
        for name, data in raw_data.items():
            self.add(data, name)
        super(ColumnDataSource, self).__init__(**kw)

    @classmethod
    def from_df(cls, raw_data):
        dfindex = raw_data.index
        new_data = {}
        for colname in raw_data:
            new_data[colname] = raw_data[colname].tolist()
        if dfindex.name:
            new_data[dfindex.name] = dfindex.tolist()
        elif dfindex.names and not all([x is None for x in dfindex.names]):
            new_data["_".join(dfindex.names)] = dfindex.tolist()
        else:
            new_data["index"] = dfindex.tolist()
        return new_data

    def to_df(self):
        """convert data source to pandas dataframe
        local import of pandas because of possible compatability issues (pypy?)
        if we have column_names set, we use those, otherwise we let
        pandas infer the column names.  column_names can be used to
        either order or filter the columns here.
        """
        import pandas as pd
        if self.column_names:
            return pd.DataFrame(self.data, columns=self.column_names)
        else:
            return pd.DataFrame(self.data)

    def add(self, data, name=None):
        """ Appends the data to the list of columns.  Returns the name
        that was inserted.
        """
        if name is None:
            n = len(self.data)
            while "Series %d"%n in self.data:
                n += 1
            name = "Series %d"%n
        self.column_names.append(name)
        self.data[name] = data
        return name

    def remove(self, name):
        try:
            self.column_names.remove(name)
            del self.data[name]
        except (ValueError, KeyError):
            import warnings
            warnings.warn("Unable to find column '%s' in datasource" % name)

class ServerDataSource(DataSource):
    data_url = String()
    owner_username = String()

    # allow us to add some data that isn't on the remote source
    # and join it to the remote data
    data = Dict(String, Any)

    # Paramters of data transformation operations
    # The 'Any' is used to pass primtives around.  Minimally, a tag to say which downsample routine to use.  In some downsamplers, parameters are passed this way too.
    # TODO: Find/create a property type for 'any primitive/atomic value'
    transform = Dict(String,Either(Instance(PlotObject), Any))
