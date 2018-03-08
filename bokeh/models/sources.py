from __future__ import absolute_import

import warnings

from ..core.has_props import abstract
from ..core.properties import Any, Bool, ColumnData, Dict, Enum, Instance, Int, JSON, List, Seq, String
from ..model import Model
from ..util.dependencies import import_optional
from ..util.serialization import convert_datetime_array
from ..util.warnings import BokehUserWarning

from .callbacks import Callback
from .filters import Filter
from .selections import Selection, SelectionPolicy

pd = import_optional('pandas')

@abstract
class DataSource(Model):
    ''' A base class for data source types.

    '''

    selected = Instance(Selection, help="""
    A Selection that indicates selected indices on this DataSource.
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

    selection_policy = Instance(SelectionPolicy, help="""
    An instance of a SelectionPolicy that determines how selections are set.
    """)

class ColumnDataSource(ColumnarDataSource):
    ''' Maps names of columns to sequences or arrays.

    The ``ColumnDataSource`` is a fundamental data structure of Bokeh. Most
    plots, data tables, etc. will be driven by a ``ColumnDataSource``.

    If the ColumnDataSource initializer is called with a single argument that
    can be any of the following:

    * A Python ``dict`` that maps string names to sequences of values, e.g.
      lists, arrays, etc.

      .. code-block:: python

          data = {'x': [1,2,3,4], 'y': np.ndarray([10.0, 20.0, 30.0, 40.0])}

          source = ColumnDataSource(data)

    * A Pandas ``DataFrame`` object

      .. code-block:: python

          source = ColumnDataSource(df)

      In this case the CDS will have columns corresponding to the columns of
      the ``DataFrame``. If the ``DataFrame`` has a named index column, then
      CDS will also have a column with this name. However, if the index name
      (or any subname of a ``MultiIndex``) is ``None``, then the CDS will have
      a column generically named ``index`` for the index.

    * A Pandas ``GroupBy`` object

      .. code-block:: python

          group = df.groupby(('colA', 'ColB'))

      In this case the CDS will have columns corresponding to the result of
      calling ``group.describe()``. The ``describe`` method generates columns
      for statistical measures such as ``mean`` and ``count`` for all the
      non-grouped orginal columns. The CDS columns are formed by joining
      original column names with the computed measure. For example, if a
      ``DataFrame`` has columns ``'year'`` and ``'mpg'``. Then passing
      ``df.groupby('year')`` to a CDS will result in columns such as
      ``'mpg_mean'``

      If the ``GroupBy.describe`` result has a named index column, then
      CDS will also have a column with this name. However, if the index name
      (or any subname of a ``MultiIndex``) is ``None``, then the CDS will have
      a column generically named ``index`` for the index.

      Note this capability to adapt ``GroupBy`` objects may only work with
      Pandas ``>=0.20.0``.

    .. note::
        There is an implicit assumption that all the columns in a given
        ``ColumnDataSource`` all have the same length at all times. For this
        reason, it is usually preferable to update the ``.data`` property
        of a data source "all at once".

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
            elif pd and isinstance(raw_data, pd.core.groupby.GroupBy):
                raw_data = self._data_from_groupby(raw_data)
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
        tmp_data = {c: v.values for c, v in _df.iteritems()}

        new_data = {}
        for k, v in tmp_data.items():
            if isinstance(k, tuple):
                k = "_".join(k)
            new_data[k] = v

        index_name = ColumnDataSource._df_index_name(df)
        new_data[index_name] = _df.index.values
        return new_data

    @staticmethod
    def _data_from_groupby(group):
        ''' Create a ``dict`` of columns from a Pandas GroupBy,
        suitable for creating a ColumnDataSource.

        The data generated is the result of running ``describe``
        on the group.

        Args:
            group (GroupBy) : data to convert

        Returns:
            dict[str, np.array]

        '''
        return ColumnDataSource._data_from_df(group.describe())

    @staticmethod
    def _df_index_name(df):
        ''' Return the Bokeh-appropriate column name for a DataFrame index

        If there is no named index, then `"index" is returned.

        If there is a single named index, then ``df.index.name`` is returned.

        If there is a multi-index, and the index names are all strings, then
        the names are joined with '_' and the result is returned, e.g. for a
        multi-index ``['ind1', 'ind2']`` the result will be "ind1_ind2".
        Otherwise if any index name is not a string, the fallback name "index"
        is returned.

        Args:
            df (DataFrame) : the DataFrame to find an index name for

        Returns:
            str

        '''
        if df.index.name:
            return df.index.name
        elif df.index.names:
            try:
                return "_".join(df.index.names)
            except TypeError:
                return "index"
        else:
            return "index"


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

    @classmethod
    def from_groupby(cls, data):
        ''' Create a ``dict`` of columns from a Pandas GroupBy,
        suitable for creating a ColumnDataSource.

        The data generated is the result of running ``describe``
        on the group.

        Args:
            data (Groupby) : data to convert

        Returns:
            dict[str, np.array]

        '''
        return cls._data_from_df(data.describe())

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

    def stream(self, new_data, rollover=None):
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
        # calls internal implementation
        self._stream(new_data, rollover)

    def _stream(self, new_data, rollover=None, setter=None):
        ''' Internal implementation to efficiently update data source columns
        with new append-only data.   The interal implementation adds the setter
        attribute.  [https://github.com/bokeh/bokeh/issues/6577]

        In cases where it is necessary to update data columns in, this method
        can efficiently send only the new data, instead of requiring the
        entire data set to be re-sent.

        Args:
            new_data (dict[str, seq] or DataFrame or Series) : a mapping of
                column names to sequences of new data to append to each column,
                a pandas DataFrame, or a pandas Series in case of a single row -
                in this case the Series index is used as column names

                All columns of the data source must be present in ``new_data``,
                with identical-length append data.

            rollover (int, optional) : A maximum column size, above which data
                from the start of the column begins to be discarded. If None,
                then columns will continue to grow unbounded (default: None)
            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)
                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.
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
        needs_length_check = True

        if pd and isinstance(new_data, pd.Series):
            new_data = new_data.to_frame().T

        if pd and isinstance(new_data, pd.DataFrame):
            needs_length_check = False # DataFrame lengths equal by definition
            _df = new_data
            newkeys = set(_df.columns)
            index_name = ColumnDataSource._df_index_name(_df)
            newkeys.add(index_name)
            new_data = dict(_df.iteritems())
            new_data[index_name] = _df.index.values
        else:
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

        import numpy as np
        if needs_length_check:
            lengths = set()
            arr_types = (np.ndarray, pd.Series) if pd else np.ndarray
            for k, x in new_data.items():
                if isinstance(x, arr_types):
                    if len(x.shape) != 1:
                        raise ValueError("stream(...) only supports 1d sequences, got ndarray with size %r" % (x.shape,))
                    lengths.add(x.shape[0])
                else:
                    lengths.add(len(x))

            if len(lengths) > 1:
                raise ValueError("All streaming column updates must be the same length")

        # slightly awkward that we have to call convert_datetime_array here ourselves
        # but the downstream code expects things to already be ms-since-epoch
        for key, values in new_data.items():
            if pd and isinstance(values, (pd.Series, pd.Index)):
                values = values.values
            old_values = self.data[key]
            # Apply the transformation if the new data contains datetimes
            # but the current data has already been transformed
            if (isinstance(values, np.ndarray) and values.dtype.kind.lower() == 'm' and
                isinstance(old_values, np.ndarray) and old_values.dtype.kind.lower() != 'm'):
                new_data[key] = convert_datetime_array(values)
            else:
                new_data[key] = values

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
    if (s.start is not None and s.start < 0) or \
       (s.stop  is not None and s.stop < 0) or \
       (s.step  is not None and s.step < 0):
        raise ValueError("Patch slices must have non-negative (start, stop, step) values, got %s" % s)

class CDSView(Model):
    ''' A view into a ColumnDataSource that represents a row-wise subset.

    '''

    filters = List(Instance(Filter), default=[], help="""
    List of filters that the view comprises.
    """)

    source = Instance(ColumnarDataSource, help="""
    The ColumnDataSource associated with this view. Used to determine
    the length of the columns.
    """)

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
