from __future__ import absolute_import

from ..core import validation
from ..core.validation.errors import COLUMN_LENGTHS
from ..core.properties import abstract
from ..core.properties import Any, Int, String, Instance, List, Dict, Bool, Enum, JSON
from ..model import Model
from ..util.dependencies import import_optional
from ..util.deprecate import deprecated
from ..util.serialization import transform_column_source_data
from .callbacks import Callback

pd = import_optional('pandas')

@abstract
class DataSource(Model):
    """ A base class for data source types. ``DataSource`` is
    not generally useful to instantiate on its own.

    """

    selected = Dict(String, Dict(String, Any), default={
        '0d': {'glyph': None, 'indices': []},
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

    column_names = List(String, help="""
    An list of names for all the columns in this DataSource.
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
            if pd and isinstance(raw_data, pd.DataFrame):
                raw_data = self._data_from_df(raw_data)
            else:
                raise ValueError("expected a dict or pandas.DataFrame, got %s" % raw_data)
        super(ColumnDataSource, self).__init__(**kw)
        for name, data in raw_data.items():
            self.add(data, name)

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
        if not pd:
            raise RuntimeError('Pandas must be installed to convert to a Pandas Dataframe')
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

    def _to_json_like(self, include_defaults):
        attrs = super(ColumnDataSource, self)._to_json_like(include_defaults=include_defaults)
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

    @deprecated("Bokeh 0.11.0", "bokeh.io.push_notebook")
    def push_notebook(self):
        """ Update a data source for a plot in a Jupyter notebook.

        This function can be be used to update data in plot data sources
        in the Jupyter notebook, without having to use the Bokeh server.

        .. warning::
            This function has been deprecated. Please use
            ``bokeh.io.push_notebook()`` which will push all changes
            (not just data sources) to the last shown plot in a Jupyter
            notebook.

        Returns:
            None

        """
        from bokeh.io import push_notebook
        push_notebook()

    @validation.error(COLUMN_LENGTHS)
    def _check_column_lengths(self):
        lengths = set(len(x) for x in self.data.values())
        if len(lengths) > 1:
            return str(self)


    def stream(self, new_data, rollover=None):
        import numpy as np

        newkeys = set(new_data.keys())
        oldkeys = set(self.data.keys())
        if newkeys != oldkeys:
            missing = oldkeys - newkeys
            extra = newkeys - oldkeys
            if missing and extra:
                raise ValueError("Must stream updates to all existing columns (missing: %s, extra: %s)" % (", ".join(sorted(missing)), ", ".join(sorted(extra))))
            elif missing:
                raise ValueError("Must stream updates to all existing columns (missing: %s)" % ", ".join(sorted(missing)))
            else:
                raise ValueError("Must stream updates to all existing columns (extra: %s)" % ", ".join(sorted(extra)))

        lengths = set()
        for x in new_data.values():
            if isinstance(x, np.ndarray):
                if len(x.shape) != 1:
                    raise ValueError("stream(...) only supports 1d sequences, got ndarray with size %r" % (x.shape,))
                lengths.add(x.shape[0])
            else:
                lengths.add(len(x))

        if len(lengths) > 1:
            raise ValueError("All streaming column updates must be the same length")

        self.data._stream(self.document, self, new_data, rollover)

class GeoJSONDataSource(ColumnDataSource):

    geojson = JSON(help="""
    GeoJSON that contains features for plotting. Currently GeoJSONDataSource can
    only process a FeatureCollection or GeometryCollection.
    """)


@abstract
class RemoteSource(ColumnDataSource):

    data_url = String(help="""
    The URL to the endpoint for the data.
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
    content_type = String(default='application/json', help="""
    Set the "contentType" parameter for the Ajax request.
    """)
    http_headers = Dict(String, String, help="""
    HTTP headers to set for the Ajax request.
    """)
