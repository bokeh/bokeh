from __future__ import absolute_import

import warnings

from ..core.has_props import abstract
from ..core.properties import Any, Bool, ColumnData, Dict, Either, Enum, Instance, Int, JSON, List, Seq, String
from ..model import Model
from ..util.dependencies import import_optional
from ..util.warnings import BokehUserWarning

from .callbacks import Callback
from .data_stores import ColumnDataStore

pd = import_optional('pandas')

@abstract
class DataSource(Model):
    ''' A base class for data source types.

    '''

    selected = Dict(String, Dict(String, Any), default={
        '0d': {'glyph': None, 'indices': []},
        '1d': {'indices': []},
        '2d': {}
    }, help="""
    A dict to indicate selected indices on different dimensions on this DataSource. Keys are:

    .. code-block:: python

        # selection information for line and patch glyphs
        '0d' : {
          # the glyph that was selected
          'glyph': None

          # array with the [smallest] index of the segment of the line that was hit
          'indices': []
        }

        # selection for most (point-like) glyphs, except lines and patches
        '1d': {
          # indices of the points included in the selection
          indices: []
        }

        # selection information for multiline and patches glyphs
        '2d': {
          # mapping of indices of the multiglyph to array of glyph indices that were hit
          # e.g. {3: [5, 6], 4, [5]}
        }

    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the selection is changed.
    """)

@abstract
class ColumnarDataSource(DataSource):
    ''' A base class for data source types, which can be mapped onto
    a columnar format.

    '''

    column_names = List(String, help="""
    An list of names for all the columns in this DataSource.
    """)

class ColumnDataSource(ColumnarDataSource):
    ''' Contains a data store that maps names of columns to sequences or arrays.

    If the ColumnDataSource initializer is called with a single argument that
    is a dict or pandas.DataFrame, that argument is used as the value for its data store's
    "data" attribute.

    .. note::
        There is an implicit assumption that all the columns in a
        a given ColumnDataSource's data store have the same length.

    '''

    data_store = Instance(ColumnDataStore)

    filter = Either(Seq(Int), Seq(Bool), default=[])

    def __init__(self, *args, **kw):
        ''' If called with a single argument that is a dict or
        pandas.DataFrame, treat that implicitly as the "data" attribute for 
        the ColumnDataSource's ColumnDataStore.
        '''
        if len(args) == 1 and "data" not in kw:
            if isinstance(args[0], ColumnDataStore):
                data_store = args[0]
            else:
                data_store = ColumnDataStore(args[0])
        else:
            data_store = ColumnDataStore()

        ns = list(set(len(x) for x in data_store.data.values()))
        n = ns[0] if ns else 0

        filter = kw.pop("filter", list(range(n)))
        if callable(filter):
            kw["filter"] = list(range(n))
        else:
            kw["filter"] = filter

        super(ColumnDataSource, self).__init__(**kw)
        self.data_store = data_store
        self.column_names = self.data_store.column_names

        if callable(filter):
            self.filter = list(filter(self))

    @staticmethod
    def _data_from_df(df):
        ''' Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            df (DataFrame) : data to convert

        Returns:
            dict(str, list)

        '''
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
    def from_df(cls, data):
        ''' Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            data (DataFrame) : data to convert

        Returns:
            dict[str, list]

        '''
        return cls._data_from_df(data)

    def to_df(self):
        ''' Convert this data source to pandas dataframe.

        If ``column_names`` is set, use those. Otherwise let Pandas
        infer the column names. The ``column_names`` property can be
        used both to order and filter the columns.

        Returns:
            DataFrame

        '''
        if not pd:
            raise RuntimeError('Pandas must be installed to convert to a Pandas Dataframe')
        if self.column_names:
            return pd.DataFrame(self.data_store.data, columns=self.column_names)
        else:
            return pd.DataFrame(self.data_store.data)

    def add(self, data, name=None):
        ''' Appends a new column of data to the data store.

        Args:
            data (seq) : new data to add
            name (str, optional) : column name to use.
                If not supplied, generate a name of the form "Series ####"

        Returns:
            str:  the column name used

        '''
        if name is None:
            n = len(self.data_store.data)
            while "Series %d"%n in self.data_store.data:
                n += 1
            name = "Series %d"%n
        self.data_store.column_names.append(name)
        self.column_names.append(name)
        self.data_store.data[name] = data
        return name


    def remove(self, name):
        ''' Remove a column of data.

        Args:
            name (str) : name of the column to remove

        Returns:
            None

        .. note::
            If the column name does not exist, a warning is issued.

        '''
        try:
            self.column_names.remove(name)
            self.data_store.column_names.remove(name)
            del self.data_store.data[name]
        except (ValueError, KeyError):
            import warnings
            warnings.warn("Unable to find column '%s' in data source" % name)

    # TODO Move stream and patch into ColumnDataStore and have ColumnDataSources delegate
    def stream(self, new_data, rollover=None, setter=None):
        ''' Efficiently update data source columns with new append-only data.

        In cases where it is necessary to update data columns in, this method
        can efficiently send only the new data, instead of requiring the
        entire data set to be re-sent.

        Args:
            new_data (dict[str, seq]) : a mapping of column names to sequences of
                new data to append to each column.

                All columns of the data source must be present in ``new_data``,
                with identical-length append data.

            rollover (int, optional) : A maximum column size, above which data
                from the start of the column begins to be discarded. If None,
                then columns will continue to grow unbounded (default: None)

        Returns:
            None

        Raises:
            ValueError

        Example:

        .. code-block:: python

            source = ColumnDataSource(data=dict(foo=[], bar=[]))

            # has new, identical-length updates for all columns in source
            new_data = {
                'foo' : [10, 20],
                'bar' : [100, 200],
            }

            source.stream(new_data)

        '''
        import numpy as np

        newkeys = set(new_data.keys())
        oldkeys = set(self.data.keys())
        if newkeys != oldkeys:
            missing = oldkeys - newkeys
            extra = newkeys - oldkeys
            if missing and extra:
                raise ValueError(
                    "Must stream updates to all existing columns (missing: %s, extra: %s)" % (", ".join(sorted(missing)), ", ".join(sorted(extra)))
                )
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

        self.data._stream(self.document, self, new_data, rollover, setter)

    def patch(self, patches, setter=None):
        ''' Efficiently update data source columns at specific locations

        If it is only necessary to update a small subset of data in a
        ColumnDataSource, this method can be used to efficiently update only
        the subset, instead of requiring the entire data set to be sent.

        This method should be passed a dictionary that maps column names to
        lists of tuples, each of the form ``(index, new_value)``. The value
        at the given index for that column will be updated with the new value.

        Args:
            patches (dict[str, list[tuple]]) : lists of patches for each column.

        Returns:
            None

        Raises:
            ValueError

        Example:

        .. code-block:: python

            source = ColumnDataSource(data=dict(foo=[10, 20], bar=[100, 200]))

            patches = {
                'foo' : [ (0, 1) ],
                'bar' : [ (0, 101), (1, 201) ],
            }

            source.patch(patches)

        '''
        extra = set(patches.keys()) - set(self.data.keys())

        if extra:
            raise ValueError("Can only patch existing columns (extra: %s)" % ", ".join(sorted(extra)))

        for name, patch in patches.items():
            max_ind = max(x[0] for x in patch)
            if max_ind >= len(self.data[name]):
                raise ValueError("Out-of bounds index (%d) in patch for column: %s" % (max_ind, name))

        self.data._patch(self.document, self, patches, setter)

class GeoJSONDataSource(ColumnarDataSource):
    '''

    '''

    geojson = JSON(help="""
    GeoJSON that contains features for plotting. Currently GeoJSONDataSource can
    only process a FeatureCollection or GeometryCollection.
    """)

@abstract
class RemoteSource(ColumnDataSource):
    '''

    '''

    data_url = String(help="""
    The URL to the endpoint for the data.
    """)

    polling_interval = Int(help="""
    polling interval for updating data source in milliseconds
    """)

class AjaxDataSource(RemoteSource):
    '''

    '''

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
