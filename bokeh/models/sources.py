from __future__ import absolute_import

import warnings

from ..core.has_props import abstract
from ..core.properties import Any, Bool, ColumnData, Dict, Enum, Instance, Int, JSON, List, Seq, String
from ..model import Model
from ..util.dependencies import import_optional
from ..util.warnings import BokehUserWarning

from .callbacks import Callback

pd = import_optional('pandas')

@abstract
class DataSource(Model):
    ''' A base class for data source types.

    '''

    selected = Dict(String, Dict(String, Any), default={
        '0d': {'glyph': None, 'indices': []},
        '1d': {'indices': []},
        '2d': {'indices': {}}
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
          # e.g. {3: [5, 6], 4: [5]}
          indices: {}
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
    ''' Maps names of columns to sequences or arrays.

    If the ColumnDataSource initializer is called with a single argument that
    is a dict or pandas.DataFrame, that argument is used as the value for the
    "data" attribute. For example::

        ColumnDataSource(mydict) # same as ColumnDataSource(data=mydict)
        ColumnDataSource(df) # same as ColumnDataSource(data=df)

    .. note::
        There is an implicit assumption that all the columns in a
        a given ColumnDataSource have the same length.

    '''

    data = ColumnData(String, Seq(Any), help="""
    Mapping of column names to sequences of data. The data can be, e.g,
    Python lists or tuples, NumPy arrays, etc.
    """).asserts(lambda _, data: len(set(len(x) for x in data.values())) <= 1,
                 lambda obj, name, data: warnings.warn(
                    "ColumnDataSource's columns must be of the same length. " +
                    "Current lengths: %s" % ", ".join(sorted(str((k, len(v))) for k, v in data.items())), BokehUserWarning))

    def __init__(self, *args, **kw):
        ''' If called with a single argument that is a dict or
        pandas.DataFrame, treat that implicitly as the "data" attribute.

        '''
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
        self.column_names[:] = list(raw_data.keys())
        self.data.update(raw_data)

    @staticmethod
    def _data_from_df(df):
        ''' Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            df (DataFrame) : data to convert

        Returns:
            dict[str, np.array]

        '''
        _df = df.copy()
        index = _df.index
        new_data = _df.to_dict('series')

        if index.name:
            new_data[index.name] = index.values
        elif index.names and not all([x is None for x in index.names]):
            new_data["_".join(index.names)] = index.values
        else:
            new_data["index"] = index.values
        return new_data

    @classmethod
    def from_df(cls, data):
        ''' Create a ``dict`` of columns from a Pandas DataFrame,
        suitable for creating a ColumnDataSource.

        Args:
            data (DataFrame) : data to convert

        Returns:
            dict[str, np.array]

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
            return pd.DataFrame(self.data, columns=self.column_names)
        else:
            return pd.DataFrame(self.data)

    def add(self, data, name=None):
        ''' Appends a new column of data to the data source.

        Args:
            data (seq) : new data to add
            name (str, optional) : column name to use.
                If not supplied, generate a name of the form "Series ####"

        Returns:
            str:  the column name used

        '''
        if name is None:
            n = len(self.data)
            while "Series %d"%n in self.data:
                n += 1
            name = "Series %d"%n
        self.column_names.append(name)
        self.data[name] = data
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
            del self.data[name]
        except (ValueError, KeyError):
            import warnings
            warnings.warn("Unable to find column '%s' in data source" % name)

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
        lists of tuples that describe a patch change to apply. To replace
        individual items in columns entirely, the tuples should be of the
        form:

        .. code-block:: python

            (index, new_value)  # replace a single column value

            # or

            (slice, new_values) # replace several column values

        Values at an index or slice will be replaced with the corresponding
        new values.

        In the case of columns whose values are other arrays or lists, (e.g.
        image or patches glyphs), it is also possible to patch "subregions".
        In this case the first item of the tuple should be a whose first
        element is the index of the array item in the CDS patch, and whose
        subsequent elements are integer indices or slices into the array item:

        .. code-block:: python

            # replace the entire 10th column of the 2nd array:

              +----------------- index of item in column data source
              |
              |       +--------- row subindex into array item
              |       |
              |       |       +- column subindex into array item
              V       V       V
            ([2, slice(None), 10], new_values)

        Imagining a list of 2d NumPy arrays, the patch above is roughly
        equivalent to:

        .. code-block:: python

            data = [arr1, arr2, ...]  # list of 2d arrays

            data[2][:, 10] = new_data

        There are some limitations to the kinds of slices and data that can
        be accepted.

        * Negative ``start``, ``stop``, or ``step`` values for slices will
          result in a ``ValueError``.

        * In a slice, ``start > stop`` will result in a ``ValueError``

        * When patching 1d or 2d subitems, the subitems must be NumPy arrays.

        * New values must be supplied as a **flattened one-dimensional array**
          of the appropriate size.

        Args:
            patches (dict[str, list[tuple]]) : lists of patches for each column

        Returns:
            None

        Raises:
            ValueError

        Example:

        The following example shows how to patch entire column elements. In this case,

        .. code-block:: python

            source = ColumnDataSource(data=dict(foo=[10, 20, 30], bar=[100, 200, 300]))

            patches = {
                'foo' : [ (slice(2), [11, 12]) ],
                'bar' : [ (0, 101), (2, 301) ],
            }

            source.patch(patches)

        After this operation, the value of the ``source.data`` will be:

        .. code-block:: python

            dict(foo=[11, 22, 30], bar=[101, 200, 301])

        For a more comprehensive complete example, see :bokeh-tree:`examples/howto/patch_app.py`.

        '''
        import numpy as np

        extra = set(patches.keys()) - set(self.data.keys())

        if extra:
            raise ValueError("Can only patch existing columns (extra: %s)" % ", ".join(sorted(extra)))

        for name, patch in patches.items():

            col_len = len(self.data[name])

            for ind, value in patch:

                # integer index, patch single value of 1d column
                if isinstance(ind, int):
                    if ind > col_len or ind < 0:
                        raise ValueError("Out-of bounds index (%d) in patch for column: %s" % (ind, name))

                # slice index, patch multiple values of 1d column
                elif isinstance(ind, slice):
                    _check_slice(ind)
                    if ind.stop is not None and ind.stop > col_len:
                        raise ValueError("Out-of bounds slice index stop (%d) in patch for column: %s" % (ind.stop, name))

                # multi-index, patch sub-regions of "n-d" column
                elif isinstance(ind, (list, tuple)):
                    if len(ind) == 0:
                        raise ValueError("Empty (length zero) patch multi-index")

                    if len(ind) == 1:
                        raise ValueError("Patch multi-index must contain more than one subindex")

                    if not isinstance(ind[0], int):
                        raise ValueError("Initial patch sub-index may only be integer, got: %s" % ind[0])

                    if ind[0] > col_len or ind[0] < 0:
                        raise ValueError("Out-of bounds initial sub-index (%d) in patch for column: %s" % (ind, name))

                    if not isinstance(self.data[name][ind[0]], np.ndarray):
                        raise ValueError("Can only sub-patch into columns with NumPy array items")

                    if len(self.data[name][ind[0]].shape) != (len(ind)-1):
                        raise ValueError("Shape mismatch between patch slice and sliced data")

                    elif isinstance(ind[0], slice):
                        _check_slice(ind[0])
                        if ind[0].stop is not None and ind[0].stop > col_len:
                            raise ValueError("Out-of bounds initial slice sub-index stop (%d) in patch for column: %s" % (ind.stop, name))

                    # Note: bounds of sub-indices after the first are not checked!
                    for subind in ind[1:]:
                        if not isinstance(subind, (int, slice)):
                            raise ValueError("Invalid patch sub-index: %s" % subind)
                        if isinstance(subind, slice):
                            _check_slice(subind)

                else:
                    raise ValueError("Invalid patch index: %s" % ind)

        self.data._patch(self.document, self, patches, setter)

def _check_slice(s):
    if (s.start is not None and s.stop is not None and s.start > s.stop):
        raise ValueError("Patch slices must have start < end, got %s" % s)
    if (s.start is not None and s.start < 1) or \
       (s.stop  is not None and s.stop < 1) or \
       (s.step  is not None and s.step < 1):
        raise ValueError("Patch slices must have positive (start, stop, step) values, got %s" % s)

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
