#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportAttributeAccessIssue=false, reportIndexIssue=false, reportOperatorIssue=false, reportAssignmentType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import sys
from dataclasses import asdict, is_dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Iterable,
    Mapping,
    Sequence,
    cast,
)

import numpy as np

from ..core.has_props import abstract
from ..core.property.any import Any as AnyVal, AnyRef
from ..core.property.container import ColumnData, Dict, Seq
from ..core.property.data_class import Dataclass
from ..core.property.data_frame import EagerDataFrame, PandasGroupBy
from ..core.property.enum import Enum
from ..core.property.instance import Instance, InstanceDefault
from ..core.property.json import JSON
from ..core.property.nullable import Nullable
from ..core.property.primitive import Bool, Int, String
from ..core.property.readonly import Readonly
from ..core.property.required import Required
from ..model import Model
from ..util.dependencies import uses_pandas
from ..util.serialization import convert_datetime_array
from .callbacks import CustomJS
from .filters import AllIndices, Filter
from .selections import GraphSelectionPolicy, Selection, SelectionPolicy

if TYPE_CHECKING:
    import pandas as pd
    from pandas.core.groupby import GroupBy

    from ..core.has_props import Setter

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AjaxDataSource',
    'CDSView',
    'ColumnarDataSource',
    'ColumnDataSource',
    'DataSource',
    'GeoJSONDataSource',
    'GeometryDataSource',
    'GraphDataSource',
    'IndexedDataSource',
    'ServerSentDataSource',
    'WebDataSource',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

if TYPE_CHECKING:
    import numpy.typing as npt

    type Value = Any

    type DataDict = dict[str, Sequence[Value] | npt.NDArray[Value] | pd.Series | pd.Index]

    type Index = int | slice | tuple[int | slice, ...]

    type Patches = Mapping[str, Sequence[tuple[Index, Value]]]

@abstract
class DataSource(Model):
    ''' A base class for data source types.

    This class only provides common model lifecycle and data-change signaling.
    Data sources with a single field-addressable record axis should derive
    from :class:`~bokeh.models.sources.IndexedDataSource`.

    '''

@abstract
class IndexedDataSource(DataSource):
    ''' A base class for sources exposing one selectable record axis.

    The storage layout is defined by subclasses. It does not have to be a
    mapping of column names to flat arrays.
    '''

    selected = Readonly(Instance(Selection), default=InstanceDefault(Selection), help="""
    An instance of a ``Selection`` that indicates selected indices on this ``DataSource``.
    This is a read-only property. You may only change the attributes of this object
    to change the selection (e.g., ``selected.indices``).
    """)

    selection_policy = Instance(SelectionPolicy, default=InstanceDefault(SelectionPolicy), help="""
    An instance of a ``SelectionPolicy`` that determines how selections are set.
    """)

@abstract
class ColumnarDataSource(IndexedDataSource):
    ''' A base class for data source types, which can be mapped onto
    a columnar format.

    '''

    default_values = Dict(String, AnyRef, default={}, help="""
    Defines the default value for each column.

    This is used when inserting rows into a data source, e.g. by edit tools,
    when a value for a given column is not explicitly provided. If a default
    value is missing, a tool will defer to its own configuration or will try
    to let the data source to infer a sensible default value.
    """)

def _cds_lengths_warning(_, __, data: dict[str, Any]) -> None:
    from ..util.warnings import BokehUserWarning, warn

    current_lengths = ', '.join(sorted(str((k, len(v))) for k, v in data.items()))
    warn(
        f"ColumnDataSource's columns must be of the same length. Current lengths: {current_lengths}",
        BokehUserWarning,
    )

class ColumnDataSource(ColumnarDataSource):
    ''' Maps names of columns to sequences or arrays.

    The ``ColumnDataSource`` is a fundamental data structure of Bokeh. Most
    plots, data tables, etc. will be driven by a ``ColumnDataSource``.

    If the ``ColumnDataSource`` initializer is called with a single argument that
    can be any of the following:

    * A Python ``dict`` that maps string names to sequences of values, e.g.
      lists, arrays, etc.

      .. code-block:: python

          data = {'x': [1,2,3,4], 'y': np.array([10.0, 20.0, 30.0, 40.0])}

          source = ColumnDataSource(data)

    .. note::
        ``ColumnDataSource`` only creates a shallow copy of ``data``. Use e.g.
        ``ColumnDataSource(copy.deepcopy(data))`` if initializing from another
        ``ColumnDataSource.data`` object that you want to keep independent.

    * A Pandas ``DataFrame`` object

      .. code-block:: python

          source = ColumnDataSource(df)

      In this case the CDS will have columns corresponding to the columns of
      the ``DataFrame``. If the ``DataFrame`` columns have multiple levels,
      they will be flattened using an underscore (e.g. level_0_col_level_1_col).
      The index of the ``DataFrame`` will be flattened to an ``Index`` of tuples
      if it's a ``MultiIndex``, and then reset using ``reset_index``. The result
      will be a column with the same name if the index was named, or
      level_0_name_level_1_name if it was a named ``MultiIndex``. If the
      ``Index`` did not have a name or the ``MultiIndex`` name could not be
      flattened/determined, the ``reset_index`` function will name the index column
      ``index``, or ``level_0`` if the name ``index`` is not available.

    * A Pandas ``GroupBy`` object

      .. code-block:: python

          group = df.groupby(('colA', 'ColB'))

      In this case the CDS will have columns corresponding to the result of
      calling ``group.describe()``. The ``describe`` method generates columns
      for statistical measures such as ``mean`` and ``count`` for all the
      non-grouped original columns. The CDS columns are formed by joining
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

    data = ColumnData(String, Seq(AnyVal), help="""
    Mapping of column names to sequences of data. The columns can be, e.g,
    Python lists or tuples, NumPy arrays, etc.

    The .data attribute can also be set from dataclass, Pandas DataFrames, or
    GroupBy objects. In these cases, the behaviour is identical to passing the
    objects to the ``ColumnDataSource`` initializer.
    """).accepts(
        EagerDataFrame, lambda x: ColumnDataSource._data_from_df(x),
     ).accepts(
        PandasGroupBy, lambda x: ColumnDataSource._data_from_groupby(x),
     ).accepts(
        Dataclass, lambda x: ColumnDataSource(asdict(x)),
    ).asserts(lambda _, data: len({len(x) for x in data.values()}) <= 1, _cds_lengths_warning)

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        ''' If called with a single argument that is a dict, dataclass, or
        ``pandas.DataFrame``, treat that implicitly as the "data" attribute.

        '''
        if len(args) == 1 and "data" not in kwargs:
            kwargs["data"] = args[0]

        # TODO (bev) invalid to pass args and "data", check and raise exception
        raw_data: DataDict = kwargs.pop("data", {})

        if not isinstance(raw_data, dict):
            import narwhals.stable.v1 as nw

            if uses_pandas(raw_data):
                import pandas as pd
            else:
                pd = None

            if nw.dependencies.is_into_dataframe(raw_data):
                raw_data = self._data_from_df(raw_data)
            elif pd and isinstance(raw_data, pd.core.groupby.GroupBy):
                raw_data = self._data_from_groupby(raw_data)
            elif is_dataclass(raw_data):
                raw_data = asdict(raw_data)
            else:
                raise ValueError(f"expected a dict, dataclass, or eager dataframe support by Narwhals, got {raw_data}")
        super().__init__(**kwargs)
        self.data.update(raw_data)

    @property
    def column_names(self) -> list[str]:
        ''' A list of the column names in this data source.

        '''
        return list(self.data)

    @property
    def length(self) -> int:
        ''' Number of row entries in the data. Note: All columns have the same number of row entries.

        '''
        data_lengths = {len(v) for _, v in self.data.items()}

        match len(data_lengths):
            case 0:
                return 0
            case 1:
                return data_lengths.pop()
            case _:
                raise RuntimeError(f"expected all columns to have the same length, "
                                   f"got {len(data_lengths)} different lengths: {data_lengths}")

    @staticmethod
    def _data_from_df(df: pd.DataFrame) -> DataDict:
        ''' Create a ``dict`` of columns from a Pandas ``DataFrame``,
        suitable for creating a ColumnDataSource.

        Args:
            df (DataFrame) : data to convert

        Returns:
            dict[str, np.array]

        '''
        import narwhals.stable.v1 as nw

        if nw.dependencies.is_pandas_like_dataframe(df):
            pdx = nw.get_native_namespace(nw.from_native(df))
            _df = df.copy()

            # Flatten columns
            if isinstance(_df.columns, pdx.MultiIndex):
                try:
                    _df.columns = ['_'.join(col) for col in _df.columns.values]
                except TypeError:
                    raise TypeError('Could not flatten MultiIndex columns. '
                                    'use string column names or flatten manually')
            # Transform columns CategoricalIndex in list
            if isinstance(_df.columns, pdx.CategoricalIndex):
                _df.columns = _df.columns.tolist()
            # Flatten index
            index_name = ColumnDataSource._df_index_name(_df)
            if index_name == 'index':
                _df.index = pdx.Index(_df.index.values)
            else:
                _df.index = pdx.Index(_df.index.values, name=index_name)
            _df.reset_index(inplace=True)
            _df = nw.from_native(_df, eager_only=True)
        else:
            _df = nw.from_native(df, eager_only=True)
            if 'index' in _df.columns and 'level_0' in _df.columns:
                raise ValueError('Could use dataframe with both "index" and "level_0" as column names.')
            elif 'index' in _df.columns:
                # Mirror pandas `reset_index` behaviour
                _df = _df.with_row_index('level_0')
            else:
                _df = _df.with_row_index()

        new_data: DataDict = {}
        for column, series in _df.to_dict(as_series=True).items():
            array = series.to_numpy()
            try:
                array.flags.writeable = True # override Pandas copy-on-write behavior
            except ValueError:
                array = array.copy() # some arrays aren't writable, so just copy them
            new_data[column] = array

        return new_data

    @staticmethod
    def _data_from_groupby(group: GroupBy[Any]) -> DataDict:
        ''' Create a ``dict`` of columns from a Pandas ``GroupBy``,
        suitable for creating a ``ColumnDataSource``.

        The data generated is the result of running ``describe``
        on the group.

        Args:
            group (GroupBy) : data to convert

        Returns:
            dict[str, np.array]

        '''
        return ColumnDataSource._data_from_df(group.describe())

    @staticmethod
    def _df_index_name(df: pd.DataFrame) -> str:
        ''' Return the Bokeh-appropriate column name for a ``DataFrame`` index

        If there is no named index, then `"index" is returned.

        If there is a single named index, then ``df.index.name`` is returned.

        If there is a multi-index, and the index names are all strings, then
        the names are joined with '_' and the result is returned, e.g. for a
        multi-index ``['ind1', 'ind2']`` the result will be "ind1_ind2".
        Otherwise if any index name is not a string, the fallback name "index"
        is returned.

        Args:
            df (DataFrame) : the ``DataFrame`` to find an index name for

        Returns:
            str

        '''
        if isinstance(df.index.name, str):
            return df.index.name
        elif df.index.names:
            try:
                # Non-string index names fall back through TypeError below.
                return "_".join(cast("Sequence[str]", df.index.names))
            except TypeError:
                return "index"
        else:
            return "index"

    @classmethod
    def from_df(cls, data: pd.DataFrame) -> DataDict:
        ''' Create a ``dict`` of columns from a Pandas ``DataFrame``,
        suitable for creating a ``ColumnDataSource``.

        Args:
            data (DataFrame) : data to convert

        Returns:
            dict[str, np.array]

        '''
        return cls._data_from_df(data)

    @classmethod
    def from_groupby(cls, data: pd.core.groupby.GroupBy) -> DataDict:
        ''' Create a ``dict`` of columns from a Pandas ``GroupBy``,
        suitable for creating a ``ColumnDataSource``.

        The data generated is the result of running ``describe``
        on the group.

        Args:
            data (Groupby) : data to convert

        Returns:
            dict[str, np.array]

        '''
        return cls._data_from_df(data.describe())

    def to_df(self) -> pd.DataFrame:
        ''' Convert this data source to pandas ``DataFrame``.

        Returns:
            DataFrame

        '''
        import pandas as pd
        return pd.DataFrame(self.data)

    def add(self, data: Sequence[Any], name: str | None = None) -> str:
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
            while f"Series {n}" in self.data:
                n += 1
            name = f"Series {n}"
        self.data[name] = data
        return name

    def remove(self, name: str) -> None:
        ''' Remove a column of data.

        Args:
            name (str) : name of the column to remove

        Returns:
            None

        .. note::
            If the column name does not exist, a warning is issued.

        '''
        try:
            del self.data[name]
        except (ValueError, KeyError):
            from ..util.warnings import warn

            warn(f"Unable to find column '{name}' in data source")

    def stream(self, new_data: DataDict, rollover: int | None = None) -> None:
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

    def _stream(self, new_data: DataDict | pd.Series | pd.DataFrame,
            rollover: int | None = None, setter: Setter | None = None) -> None:
        ''' Internal implementation to efficiently update data source columns
        with new append-only data. The internal implementation adds the setter
        attribute.  [https://github.com/bokeh/bokeh/issues/6577]

        In cases where it is necessary to update data columns in, this method
        can efficiently send only the new data, instead of requiring the
        entire data set to be re-sent.

        Args:
            new_data (dict[str, seq] or DataFrame or Series) : a mapping of
                column names to sequences of new data to append to each column,
                a pandas DataFrame, or a pandas Series in case of a single row -
                in this case the Series index is used as column names

                All columns in ``new_data`` must be the same length. In case
                data source is not empty, the column names in ``new_data``
                must match those of the data source exactly (otherwise an
                exception is raised). If the data source is empty then
                ``new_data`` replaces the empty ``.data`` dict of the
                data source.

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
        pd = sys.modules.get("pandas")

        needs_length_check = True

        if pd and isinstance(new_data, (pd.Series, pd.DataFrame)):
            if isinstance(new_data, pd.Series):
                new_data = cast("pd.Series", new_data).to_frame().T

            needs_length_check = False # DataFrame lengths equal by definition
            _df = new_data
            newkeys = set(_df.columns)
            index_name = ColumnDataSource._df_index_name(_df)
            newkeys.add(index_name)
            new_data = dict(_df.items())
            new_data[index_name] = _df.index.values
        else:
            newkeys = set(new_data.keys())

        # The pandas branch above converts DataFrames and Series into column dictionaries.
        new_data = cast("DataDict", new_data)

        oldkeys = set(self.data.keys())

        # stream to empty source
        if len(oldkeys) == 0:
            self.data.update({k: [] for k in newkeys})
        elif newkeys != oldkeys:
            missing = sorted(oldkeys - newkeys)
            extra = sorted(newkeys - oldkeys)
            if missing and extra:
                raise ValueError(f"Must stream updates to all existing columns (missing: {', '.join(missing)}, extra: {', '.join(extra)})")
            elif missing:
                raise ValueError(f"Must stream updates to all existing columns (missing: {', '.join(missing)})")
            else:
                raise ValueError(f"Must stream updates to all existing columns (extra: {', '.join(extra)})")

        if needs_length_check:
            lengths: set[int] = set()
            arr_types = (np.ndarray, pd.Series) if pd else (np.ndarray,)
            for _, x in new_data.items():
                if isinstance(x, arr_types):
                    if len(x.shape) != 1:
                        raise ValueError(f"stream(...) only supports 1d sequences, got ndarray with size {x.shape!r}")
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

    def patch(self, patches: Patches, setter: Setter | None = None) -> None:
        ''' Efficiently update data source columns at specific locations

        If it is only necessary to update a small subset of data in a
        ``ColumnDataSource``, this method can be used to efficiently update only
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

            dict(foo=[11, 12, 30], bar=[101, 200, 301])

        For a more comprehensive example, see :bokeh-tree:`examples/server/app/patch_app.py`.

        '''
        extra = set(patches.keys()) - set(self.data.keys())

        if extra:
            raise ValueError(f"Can only patch existing columns (extra: {', '.join(sorted(extra))})")

        for name, patch in patches.items():

            col_len = len(self.data[name])

            for ind, _ in patch:

                # integer index, patch single value of 1d column
                if isinstance(ind, int):
                    if ind > col_len or ind < 0:
                        raise ValueError(f"Out-of bounds index ({ind}) in patch for column: {name}")

                # slice index, patch multiple values of 1d column
                elif isinstance(ind, slice):
                    _check_slice(ind)
                    if ind.stop is not None and ind.stop > col_len:
                        raise ValueError(f"Out-of bounds slice index stop ({ind.stop}) in patch for column: {name}")

                # multi-index, patch sub-regions of "n-d" column
                elif isinstance(ind, (list, tuple)):
                    if len(ind) == 0:
                        raise ValueError("Empty (length zero) patch multi-index")

                    if len(ind) == 1:
                        raise ValueError("Patch multi-index must contain more than one subindex")

                    ind_0 = ind[0]
                    if not isinstance(ind_0, int):
                        raise ValueError(f"Initial patch sub-index may only be integer, got: {ind_0}")

                    if ind_0 > col_len or ind_0 < 0:
                        raise ValueError(f"Out-of bounds initial sub-index ({ind_0}) in patch for column: {name}")

                    if not isinstance(self.data[name][ind_0], np.ndarray):
                        raise ValueError("Can only sub-patch into columns with NumPy array items")

                    if len(self.data[name][ind_0].shape) != (len(ind)-1):
                        raise ValueError("Shape mismatch between patch slice and sliced data")

                    elif isinstance(ind_0, slice):
                        _check_slice(ind_0)
                        if ind_0.stop is not None and ind_0.stop > col_len:
                            raise ValueError(f"Out-of bounds initial slice sub-index stop ({ind_0.stop}) in patch for column: {name}")

                    # Note: bounds of sub-indices after the first are not checked!
                    for subind in ind[1:]:
                        if not isinstance(subind, (int, slice)):
                            raise ValueError(f"Invalid patch sub-index: {subind}")
                        if isinstance(subind, slice):
                            _check_slice(subind)

                else:
                    raise ValueError(f"Invalid patch index: {ind}")

        self.data._patch(self.document, self, patches, setter)

def _default_graph_nodes() -> ColumnDataSource:
    return ColumnDataSource(data=dict(index=[]))

def _default_graph_edges() -> ColumnDataSource:
    return ColumnDataSource(data=dict(start=[], end=[]))

def _column_source(data: Mapping[str, Sequence[Any]], aliases: Mapping[str, str]) -> ColumnDataSource:
    columns = dict(data)
    for alias, canonical in aliases.items():
        if alias not in columns:
            continue
        if canonical in columns:
            raise ValueError(f"graph data cannot contain both {alias!r} and {canonical!r} fields")
        columns[canonical] = columns.pop(alias)
    return ColumnDataSource(columns)

def _rows_source(rows: Iterable[Mapping[str, Any]]) -> ColumnDataSource:
    records = list(rows)
    fields = list(dict.fromkeys(field for record in records for field in record))
    columns = {}
    for field in fields:
        values = [record.get(field) for record in records]
        if any(isinstance(value, (list, tuple)) for value in values):
            if not all(isinstance(value, (list, tuple)) for value in values if value is not None):
                raise ValueError("Can't mix scalar and non-scalar values for graph attributes")
            values = [[] if value is None else list(value) for value in values]
        columns[field] = values
    return ColumnDataSource(columns)

def _node_source(nodes: Any) -> IndexedDataSource:
    if isinstance(nodes, IndexedDataSource):
        return nodes

    import narwhals.stable.v1 as nw
    if uses_pandas(nodes) or nw.dependencies.is_into_dataframe(nodes):
        return ColumnDataSource(nodes)

    if isinstance(nodes, Mapping):
        if not nodes:
            return _default_graph_nodes()
        if "id" in nodes or "index" in nodes or not all(isinstance(attrs, Mapping) for attrs in nodes.values()):
            return _column_source(nodes, {"id": "index"})
        records = []
        for node_id, attrs in nodes.items():
            if not isinstance(attrs, Mapping):
                raise ValueError("a node mapping must map node identifiers to attribute mappings")
            if "id" in attrs or "index" in attrs:
                raise ValueError("node attributes cannot contain reserved 'id' or 'index' fields")
            records.append({"index": node_id, **attrs})
        return _rows_source(records)

    records = []
    for node in nodes:
        if isinstance(node, Mapping):
            record = dict(node)
            if "id" in record:
                if "index" in record:
                    raise ValueError("a node record cannot contain both 'id' and 'index'")
                record["index"] = record.pop("id")
            if "index" not in record:
                raise ValueError("a node record must contain an 'id' or 'index' field")
        elif isinstance(node, tuple) and len(node) == 2 and isinstance(node[1], Mapping):
            node_id, attrs = node
            if "id" in attrs or "index" in attrs:
                raise ValueError("node tuple attributes cannot contain reserved 'id' or 'index' fields")
            record = {"index": node_id, **attrs}
        else:
            record = {"index": node}
        records.append(record)
    return _rows_source(records) if records else _default_graph_nodes()

def _edge_source(edges: Any) -> IndexedDataSource:
    if isinstance(edges, IndexedDataSource):
        return edges

    import narwhals.stable.v1 as nw
    if uses_pandas(edges) or nw.dependencies.is_into_dataframe(edges):
        return ColumnDataSource(edges)

    if isinstance(edges, Mapping):
        if not edges:
            return _default_graph_edges()
        if any(field in edges for field in ("source", "target", "start", "end")):
            return _column_source(edges, {"source": "start", "target": "end"})
        raise ValueError("edge data must contain 'source'/'target' or 'start'/'end' fields")

    records = []
    for edge in edges:
        if isinstance(edge, Mapping):
            record = dict(edge)
            for alias, canonical in (("source", "start"), ("target", "end")):
                if alias in record:
                    if canonical in record:
                        raise ValueError(f"an edge record cannot contain both {alias!r} and {canonical!r}")
                    record[canonical] = record.pop(alias)
            if "start" not in record or "end" not in record:
                raise ValueError("an edge record must contain source/target or start/end fields")
        elif isinstance(edge, tuple) and len(edge) in (2, 3):
            start, end = edge[:2]
            attrs = edge[2] if len(edge) == 3 else {}
            if not isinstance(attrs, Mapping):
                raise ValueError("the third item of an edge tuple must be an attribute mapping")
            if any(field in attrs for field in ("source", "target", "start", "end")):
                raise ValueError("edge tuple attributes cannot contain endpoint fields")
            record = {"start": start, "end": end, **attrs}
        else:
            raise ValueError("an edge must be a mapping or a (source, target[, attributes]) tuple")
        records.append(record)
    return _rows_source(records) if records else _default_graph_edges()

def _graph_sources(graph: Any) -> tuple[IndexedDataSource, IndexedDataSource]:
    try:
        graph_nodes = graph.nodes(data=True)
        graph_edges = graph.edges(data=True)
    except (AttributeError, TypeError) as error:
        raise ValueError("expected a NetworkX-like graph with nodes(data=True) and edges(data=True)") from error

    nodes = []
    for node_id, attrs in graph_nodes:
        attrs = dict(attrs)
        for reserved in ("id", "index"):
            if reserved in attrs:
                from ..util.warnings import warn

                warn(f"Converting node attribute {reserved!r} is skipped because it is reserved by GraphDataSource")
                attrs.pop(reserved)
        nodes.append((node_id, attrs))

    edges = []
    for start, end, attrs in graph_edges:
        attrs = dict(attrs)
        for reserved in ("source", "target", "start", "end"):
            if reserved in attrs:
                from ..util.warnings import warn

                warn(f"Converting edge attribute {reserved!r} is skipped because it is reserved by GraphDataSource")
                attrs.pop(reserved)
        edges.append((start, end, attrs))

    return _node_source(nodes), _edge_source(edges)

class GraphDataSource(DataSource):
    ''' A coupled pair of indexed data sources representing a graph.

    ``nodes`` contains one logical record per node and exposes an ``index``
    field. ``edges`` contains one logical record per edge and exposes ``start``
    and ``end`` fields referring to node identifiers.

    The child sources may use any storage layout supported by
    ``IndexedDataSource``.
    Keeping them together gives graph renderers and interaction policies a
    single topology-aware data model without forcing nodes and edges onto one
    shared record axis.

    Graph-shaped Python data is accepted directly. Node records may use ``id``
    and edge records may use ``source`` and ``target``; these familiar names
    are normalized to Bokeh's internal ``index``, ``start``, and ``end``
    fields. A NetworkX-like graph can be passed as the sole positional
    argument.

    '''

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if len(args) > 1:
            raise TypeError("GraphDataSource accepts at most one positional graph argument")
        graph = args[0] if args else kwargs.pop("graph", None)
        if args and "graph" in kwargs:
            raise TypeError("GraphDataSource graph was provided more than once")

        raw_nodes = kwargs.pop("nodes", None)
        raw_edges = kwargs.pop("edges", None)
        if graph is not None:
            if raw_nodes is not None or raw_edges is not None:
                raise ValueError("provide either a graph or explicit nodes and edges, not both")
            nodes, edges = _graph_sources(graph)
        else:
            nodes = _default_graph_nodes() if raw_nodes is None else _node_source(raw_nodes)
            edges = _default_graph_edges() if raw_edges is None else _edge_source(raw_edges)

        super().__init__(nodes=nodes, edges=edges, **kwargs)

    nodes = Readonly(Instance(IndexedDataSource), default=_default_graph_nodes, help="""
    The indexed data source containing node records.
    """)

    edges = Readonly(Instance(IndexedDataSource), default=_default_graph_edges, help="""
    The indexed data source containing edge records.
    """)

    selection_policy = Instance(GraphSelectionPolicy, default=InstanceDefault(GraphSelectionPolicy), help="""
    Controls how direct node or edge selections propagate through graph topology.
    """)

def _geometry_mapping(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, Mapping):
        value = getattr(value, "__geo_interface__", None)
    if not isinstance(value, Mapping):
        raise ValueError("geometry values must be GeoJSON mappings or define __geo_interface__")
    geometry = dict(value)
    if geometry.get("type") == "Feature":
        return _geometry_mapping(geometry.get("geometry"))
    if "type" not in geometry:
        raise ValueError("geometry mappings must define a 'type'")
    return geometry

def _geometry_records(value: Any) -> tuple[list[dict[str, Any] | None], dict[str, list[Any]]]:
    if isinstance(value, str):
        value = json.loads(value)
    elif not isinstance(value, (Mapping, Sequence)):
        geo_interface = getattr(value, "__geo_interface__", None)
        if geo_interface is not None:
            value = geo_interface

    if isinstance(value, Mapping):
        kind = value.get("type")
        if kind == "FeatureCollection":
            records = list(value.get("features", []))
        elif kind == "GeometryCollection":
            records = list(value.get("geometries", []))
        else:
            records = [value]
    else:
        records = list(value)

    geometries: list[dict[str, Any] | None] = []
    properties: list[dict[str, Any]] = []

    def append(item: Any, attrs: dict[str, Any] | None = None) -> None:
        if item is None:
            geometries.append(None)
            properties.append({} if attrs is None else attrs)
            return
        if not isinstance(item, Mapping):
            append(_geometry_mapping(item), attrs)
            return

        record = dict(item)
        if record.get("type") == "Feature":
            append(record.get("geometry"), dict(record.get("properties") or {}))
        elif record.get("type") == "GeometryCollection":
            for geometry in record.get("geometries", []):
                append(geometry, attrs)
        elif "geometry" in record:
            geometry = record.pop("geometry")
            append(geometry, record)
        else:
            geometries.append(_geometry_mapping(record))
            properties.append({} if attrs is None else attrs)

    for item in records:
        append(item)

    fields = list(dict.fromkeys(field for record in properties for field in record))
    data = {field: [record.get(field) for record in properties] for field in fields}
    return geometries, data

class GeometryDataSource(IndexedDataSource):
    ''' A feature-indexed source containing geometry records and attributes.

    Geometry values use GeoJSON geometry mappings. Python objects implementing
    ``__geo_interface__`` (including GeoPandas and Shapely objects) and GeoJSON
    FeatureCollections are accepted directly and normalized for transport.

    Attribute columns remain available to data specs for vectorized styling,
    while coordinates retain their natural Polygon/MultiPolygon hierarchy.
    '''

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if len(args) > 1:
            raise TypeError("GeometryDataSource accepts at most one positional data argument")

        if args and "crs" not in kwargs:
            crs = getattr(args[0], "crs", None)
            if crs is not None:
                kwargs["crs"] = str(crs)

        raw_geometries = kwargs.pop("geometries", None)
        raw_data = kwargs.pop("data", None)
        if args:
            if raw_geometries is not None or raw_data is not None:
                raise ValueError("provide either positional geometry data or geometries/data keywords")
            geometries, data = _geometry_records(args[0])
        elif raw_geometries is None and raw_data is not None and not isinstance(raw_data, Mapping):
            geometries, data = _geometry_records(raw_data)
        elif raw_geometries is None and isinstance(raw_data, Mapping) and "geometry" in raw_data:
            columns = dict(raw_data)
            raw_geometries = columns.pop("geometry")
            geometries = [_geometry_mapping(value) for value in raw_geometries]
            data = columns
        else:
            geometries = [] if raw_geometries is None else [_geometry_mapping(value) for value in raw_geometries]
            data = {} if raw_data is None else dict(raw_data)

        lengths = {len(column) for column in data.values()}
        if len(lengths) > 1 or (lengths and lengths != {len(geometries)}):
            raise ValueError("geometry attributes must have the same length as geometries")

        super().__init__(geometries=geometries, data=data, **kwargs)

    geometries = Seq(AnyVal, default=[], help="""
    GeoJSON geometry mappings, one per selectable feature.
    """)

    data = ColumnData(String, Seq(AnyVal), help="""
    Attribute columns aligned with ``geometries`` for styling and callbacks.
    """)

    crs = Nullable(String, help="""
    Optional coordinate reference system identifier or description.
    """)

    @property
    def column_names(self) -> list[str]:
        return ["geometry", *self.data]  # pyright: ignore[reportGeneralTypeIssues]

    @property
    def length(self) -> int:
        return len(self.geometries)

    def stream(self, new_data: Any, rollover: int | None = None, setter: Setter | None = None) -> None:
        ''' Append geometry records and attributes, optionally retaining only
        the newest ``rollover`` records.

        This is the geometry-record analogue of
        :meth:`~bokeh.models.sources.ColumnDataSource.stream` and synchronizes
        through normal model property events in server applications.
        '''
        geometries, data = _geometry_records(new_data)
        existing_fields = set(self.data)
        new_fields = set(data)
        if existing_fields and new_fields != existing_fields:
            missing = sorted(existing_fields - new_fields)
            extra = sorted(new_fields - existing_fields)
            details = []
            if missing:
                details.append(f"missing: {', '.join(missing)}")
            if extra:
                details.append(f"extra: {', '.join(extra)}")
            raise ValueError(f"Must stream updates to all existing attributes ({', '.join(details)})")

        combined_geometries = [*self.geometries, *geometries]  # pyright: ignore[reportGeneralTypeIssues]
        combined_data = {
            field: [*self.data.get(field, []), *values]
            for field, values in data.items()
        }
        if rollover is not None:
            if rollover < 0:
                raise ValueError("rollover must be non-negative")
            combined_geometries = [] if rollover == 0 else combined_geometries[-rollover:]
            combined_data = {
                field: [] if rollover == 0 else values[-rollover:]
                for field, values in combined_data.items()
            }

        self.set_from_json("geometries", combined_geometries, setter=setter)
        self.set_from_json("data", combined_data, setter=setter)

    def patch(self, patches: Mapping[str, Sequence[tuple[int, Any]]], setter: Setter | None = None) -> None:
        ''' Replace complete geometry or attribute values at feature indices. '''
        valid_fields = {"geometry", *self.data}  # pyright: ignore[reportGeneralTypeIssues]
        extra = set(patches) - valid_fields
        if extra:
            raise ValueError(f"Can only patch existing geometry fields (extra: {', '.join(sorted(extra))})")

        geometries = list(self.geometries)
        data = {field: list(values) for field, values in self.data.items()}
        for field, changes in patches.items():
            values = geometries if field == "geometry" else data[field]
            for index, value in changes:
                if index < 0 or index >= self.length:
                    raise ValueError(f"Out-of bounds index ({index}) in patch for field: {field}")
                values[index] = _geometry_mapping(value) if field == "geometry" else value

        if "geometry" in patches:
            self.set_from_json("geometries", geometries, setter=setter)
        if set(patches) - {"geometry"}:
            self.set_from_json("data", data, setter=setter)

class CDSView(Model):
    ''' A view into a ``ColumnDataSource`` that represents a row-wise subset.

    '''

    filter = Instance(Filter, default=InstanceDefault(AllIndices), help="""
    Defines the subset of indices to use from the data source this view applies to.

    By default all indices are used (``AllIndices`` filter). This can be changed by
    using specialized filters like ``IndexFilter``, ``BooleanFilter``, etc. Filters
    can be composed using set operations to create non-trivial data masks. This can
    be accomplished by directly using models like ``InversionFilter``, ``UnionFilter``,
    etc., or by using set operators on filters, e.g.:

    .. code-block:: python

        # filters everything but indexes 10 and 11
        cds_view.filter &= ~IndexFilter(indices=[10, 11])
    """)

class GeoJSONDataSource(GeometryDataSource):
    ''' A geometry source populated from a GeoJSON document.

    Geometry hierarchy is retained, including Polygon holes and every member
    of a MultiPolygon. Feature properties are exposed as attribute fields.

    '''

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        geojson = kwargs.get("geojson")
        if geojson is not None and "geometries" not in kwargs and "data" not in kwargs:
            geometries, data = _geometry_records(geojson)
            kwargs["geometries"] = geometries
            kwargs["data"] = data
        super().__init__(*args, **kwargs)
        self.on_change("geojson", self._update_geojson)

    def _update_geojson(self, attr: str, old: Any, new: Any) -> None:
        geometries, data = _geometry_records(new)
        self.update(geometries=geometries, data=data)

    geojson = Required(JSON, help="""
    GeoJSON geometry, feature, GeometryCollection, or FeatureCollection.
    """)

@abstract
class WebDataSource(ColumnDataSource):
    ''' Base class for web column data sources that can update from data
    URLs.

    .. note::
        This base class is typically not useful to instantiate on its own.

    '''

    adapter = Nullable(Instance(CustomJS), help="""
    A JavaScript callback to adapt raw JSON responses to Bokeh ``ColumnDataSource``
    format.

    If provided, this callback is executes immediately after the JSON data is
    received, but before appending or replacing data in the data source. The
    ``CustomJS`` callback will receive the ``AjaxDataSource`` as ``cb_obj`` and
    will receive the raw JSON response as ``cb_data.response``. The callback
    code should return a ``data`` object suitable for a Bokeh ``ColumnDataSource``
    (i.e.  a mapping of string column names to arrays of data).
    """)

    max_size = Nullable(Int, help="""
    Maximum size of the data columns. If a new fetch would result in columns
    larger than ``max_size``, then earlier data is dropped to make room.
    """)

    mode = Enum("replace", "append", help="""
    Whether to append new data to existing data (up to ``max_size``), or to
    replace existing data entirely.
    """)

    data_url = Required(String, help="""
    A URL to to fetch data from.
    """)

class ServerSentDataSource(WebDataSource):
    ''' A data source that can populate columns by receiving server sent
    events endpoints.

    '''

class AjaxDataSource(WebDataSource):
    ''' A data source that can populate columns by making Ajax calls to REST
    endpoints.

    The ``AjaxDataSource`` can be especially useful if you want to make a
    standalone document (i.e. not backed by the Bokeh server) that can still
    dynamically update using an existing REST API.

    The response from the REST API should match the ``.data`` property of a
    standard ``ColumnDataSource``, i.e. a JSON dict that maps names to arrays
    of values:

    .. code-block:: python

        {
            'x' : [1, 2, 3, ...],
            'y' : [9, 3, 2, ...]
        }

    Alternatively, if the REST API returns a different format, a ``CustomJS``
    callback can be provided to convert the REST response into Bokeh format,
    via the ``adapter`` property of this data source.

    Initial data can be set by specifying the ``data`` property directly.
    This is necessary when used in conjunction with a ``FactorRange``, even
    if the columns in `data`` are empty.

    A full example can be seen at :bokeh-tree:`examples/basic/data/ajax_source.py`

    '''

    polling_interval = Nullable(Int, help="""
    A polling interval (in milliseconds) for updating data source.
    """)

    method = Enum('POST', 'GET', help="""
    Specify the HTTP method to use for the Ajax request (GET or POST)
    """)

    if_modified = Bool(False, help="""
    Whether to include an ``If-Modified-Since`` header in Ajax requests
    to the server. If this header is supported by the server, then only
    new data since the last request will be returned.
    """)

    content_type = String(default='application/json', help="""
    Set the "contentType" parameter for the Ajax request.
    """)

    http_headers = Dict(String, String, help="""
    Specify HTTP headers to set for the Ajax request.

    Example:

    .. code-block:: python

        ajax_source.headers = { 'x-my-custom-header': 'some value' }

    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _check_slice(s: slice) -> None:
    if (s.start is not None and s.stop is not None and s.start > s.stop):
        raise ValueError(f"Patch slices must have start < end, got {s}")
    if (s.start is not None and s.start < 0) or \
       (s.stop  is not None and s.stop < 0) or \
       (s.step  is not None and s.step < 0):
        raise ValueError(f"Patch slices must have non-negative (start, stop, step) values, got {s}")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
