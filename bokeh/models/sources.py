from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import HasProps, abstract
from ..properties import Any, Int, String, Instance, List, Dict, Either, Bool, Enum
from ..validation.errors import COLUMN_LENGTHS
from .. import validation
from ..util.serialization import transform_column_source_data
from .callbacks import Callback
from bokeh.deprecate import deprecated

@abstract
class DataSource(PlotObject):
    """ A base class for data source types. ``DataSource`` is
    not generally useful to instantiate on its own.

    """

    column_names = List(String, help="""
    An list of names for all the columns in this DataSource.
    """)

    selected = Dict(String, Dict(String, Any), default={
        '0d': {'flag': False, 'indices': []},
        '1d': {'indices': []},
        '2d': {'indices': []}
    }, help="""
    A dict to indicate selected indices on different dimensions on this DataSource. Keys are:

    - 0d: indicates whether a Line or Patch glyphs have been hit. Value is a
            dict with the following keys:

            - flag (boolean): true if glyph was with false otherwise
            - indices (list): indices hit (if applicable)

    - 1d: indicates whether any of all other glyph (except [multi]line or
            patches) was hit:

            - indices (list): indices that were hit/selected

    - 2d: indicates whether a [multi]line or patches) were hit:

            - indices (list(list)): indices of the lines/patches that were
                hit/selected
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the selection is changed.
    """)

    def columns(self, *columns):
        """ Returns a ColumnsRef object for a column or set of columns
        on this data source.

        Args:
            *columns

        Returns:
            ColumnsRef

        """
        return ColumnsRef(source=self, columns=list(columns))

class ColumnsRef(HasProps):
    """ A utility object to allow referring to a collection of columns
    from a specified data source, all together.

    """

    source = Instance(DataSource, help="""
    A data source to reference.
    """)

    columns = List(String, help="""
    A list of column names to reference from ``source``.
    """)

class ColumnDataSource(DataSource):
    """ Maps names of columns to sequences or arrays.

    If the ColumnDataSource initializer is called with a single argument that
    is a dict or pandas.DataFrame, that argument is used as the value for the
    "data" attribute. For example::

        ColumnDataSource(mydict) # same as ColumnDataSource(data=mydict)
        ColumnDataSource(df) # same as ColumnDataSource(data=df)

    .. note::
        There is an implicit assumption that all the columns in a
        a given ColumnDataSource have the same length.

    """

    data = Dict(String, Any, help="""
    Mapping of column names to sequences of data. The data can be, e.g,
    Python lists or tuples, NumPy arrays, etc.
    """)

    def __init__(self, *args, **kw):
        """ If called with a single argument that is a dict or
        pandas.DataFrame, treat that implicitly as the "data" attribute.
        """
        if len(args) == 1 and "data" not in kw:
            kw["data"] = args[0]
        # TODO (bev) invalid to pass args and "data", check and raise exception
        raw_data = kw.pop("data", {})
        if not isinstance(raw_data, dict):
            import pandas as pd
            if isinstance(raw_data, pd.DataFrame):
                raw_data = self._data_from_df(raw_data)
            else:
                raise ValueError("expected a dict or pandas.DataFrame, got %s" % raw_data)
        for name, data in raw_data.items():
            self.add(data, name)
        super(ColumnDataSource, self).__init__(**kw)

    @staticmethod
    def _data_from_df(df):
        """ Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            df (DataFrame) : data to convert

        Returns:
            dict(str, list)

        """
        index = df.index
        new_data = {}
        for colname in df:
            new_data[colname] = df[colname].tolist()
        if index.name:
            new_data[index.name] = index.tolist()
        elif index.names and not all([x is None for x in index.names]):
            new_data["_".join(index.names)] = index.tolist()
        else:
            new_data["index"] = index.tolist()
        return new_data

    @classmethod
    @deprecated("Bokeh 0.9.3", "ColumnDataSource initializer")
    def from_df(cls, data):
        """ Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            data (DataFrame) : data to convert

        Returns:
            dict(str, list)

        """
        import warnings
        warnings.warn("Method deprecated in Bokeh 0.9.3")
        return cls._data_from_df(data)

    def to_df(self):
        """ Convert this data source to pandas dataframe.

        If ``column_names`` is set, use those. Otherwise let Pandas
        infer the column names. The ``column_names`` property can be
        used both to order and filter the columns.

        Returns:
            DataFrame

        """
        import pandas as pd
        if self.column_names:
            return pd.DataFrame(self.data, columns=self.column_names)
        else:
            return pd.DataFrame(self.data)

    def add(self, data, name=None):
        """ Appends a new column of data to the data source.

        Args:
            data (seq) : new data to add
            name (str, optional) : column name to use.
                If not supplied, generate a name go the form "Series ####"

        Returns:
            str:  the column name used

        """
        if name is None:
            n = len(self.data)
            while "Series %d"%n in self.data:
                n += 1
            name = "Series %d"%n
        self.column_names.append(name)
        self.data[name] = data
        return name

    def vm_serialize(self, changed_only=True):
        attrs = super(ColumnDataSource, self).vm_serialize(changed_only=changed_only)
        if 'data' in attrs:
            attrs['data'] = transform_column_source_data(attrs['data'])
        return attrs

    def remove(self, name):
        """ Remove a column of data.

        Args:
            name (str) : name of the column to remove

        Returns:
            None

        .. note::
            If the column name does not exist, a warning is issued.

        """
        try:
            self.column_names.remove(name)
            del self.data[name]
        except (ValueError, KeyError):
            import warnings
            warnings.warn("Unable to find column '%s' in data source" % name)

    def push_notebook(self):
        """ Update date for a plot in the IPthon notebook in place.

        This function can be be used to update data in plot data sources
        in the IPython notebook, without having to use the Bokeh server.

        Returns:
            None

        .. warning::
            The current implementation leaks memory in the IPython notebook,
            due to accumulating JS code. This function typically works well
            with light UI interactions, but should not be used for continuously
            updating data. See :bokeh-issue:`1732` for more details and to
            track progress on potential fixes.

        """
        from IPython.core import display
        from bokeh.protocol import serialize_json
        id = self.ref['id']
        model = self.ref['type']
        json = serialize_json(self.vm_serialize())
        js = """
            var ds = Bokeh.Collections('{model}').get('{id}');
            var data = {json};
            ds.set(data);
        """.format(model=model, id=id, json=json)
        display.display_javascript(js, raw=True)

    @validation.error(COLUMN_LENGTHS)
    def _check_column_lengths(self):
        lengths = set(len(x) for x in self.data.values())
        if len(lengths) > 1:
            return str(self)

@abstract
class RemoteSource(DataSource):
    data_url = String(help="""
    The URL to the endpoint for the data.
    """)
    data = Dict(String, Any, help="""
    Additional data to include directly in this data source object. The
    columns provided here are merged with those from the Bokeh server.
    """)
    polling_interval = Int(help="""
    polling interval for updating data source in milliseconds
    """)

class AjaxDataSource(RemoteSource):
    method = Enum('POST', 'GET', help="http method - GET or POST")

    mode = Enum("replace", "append", help="""
    Whether to append new data to existing data (up to ``max_size``),
    or to replace existing data entirely.
    """)
    max_size = Int(help="""
    Maximum size of the data array being kept after each pull requests.
    Larger than that size, the data will be right shifted.
    """)
    if_modified = Bool(False, help="""
    Whether to include an ``If-Modified-Since`` header in AJAX requests
    to the server. If this header is supported by the server, then only
    new data since the last request will be returned.
    """)

class BlazeDataSource(RemoteSource):
    #blaze parts
    expr = Dict(String, Any(), help="""
    blaze expression graph in json form
    """)
    namespace = Dict(String, Any(), help="""
    namespace in json form for evaluating blaze expression graph
    """)
    local = Bool(help="""
    Whether this data source is hosted by the bokeh server or not.
    """)

    def from_blaze(self, remote_blaze_obj, local=True):
        from blaze.server import to_tree
        # only one Client object, can hold many datasets
        assert len(remote_blaze_obj._leaves()) == 1
        leaf = remote_blaze_obj._leaves()[0]
        blaze_client = leaf.data
        json_expr = to_tree(remote_blaze_obj, {leaf : ':leaf'})
        self.data_url = blaze_client.url + "/compute.json"
        self.local = local
        self.expr = json_expr

    def to_blaze(self):
        from blaze.server.client import Client
        from blaze.server import from_tree
        from blaze import Data
        # hacky - blaze urls have `compute.json` in it, but we need to strip it off
        # to feed it into the blaze client lib
        c = Client(self.data_url.rsplit('compute.json', 1)[0])
        d = Data(c)
        return from_tree(self.expr, {':leaf' : d})


class ServerDataSource(BlazeDataSource):
    """ A data source that referes to data located on a Bokeh server.

    The data from the server is loaded on-demand by the client.
    """
    # Paramters of data transformation operations
    # The 'Any' is used to pass primtives around.
    # TODO: (jc) Find/create a property type for 'any primitive/atomic value'
    transform = Dict(String,Either(Instance(PlotObject), Any), help="""
    Paramters of the data transformation operations.

    The associated valuse is minimally a tag that says which downsample routine
    to use.  For some downsamplers, parameters are passed this way too.
    """)
