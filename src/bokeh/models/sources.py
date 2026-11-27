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

import csv
import gzip
import json
import math
import sys
from dataclasses import asdict, is_dataclass
from datetime import date
from numbers import Real
from os import fspath
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Iterable,
    Iterator,
    Literal,
    Mapping,
    Self,
    Sequence,
    TextIO,
    TypedDict,
    TypeGuard,
    cast,
)

import numpy as np

from ..core.has_props import abstract
from ..core.property.any import Any as AnyVal, AnyRef
from ..core.property.container import ColumnData, Dict, List, RestrictedDict, Seq
from ..core.property.data_class import Dataclass
from ..core.property.data_frame import EagerDataFrame, PandasGroupBy
from ..core.property.enum import Enum
from ..core.property.instance import Instance, InstanceDefault
from ..core.property.json import JSON
from ..core.property.nullable import Nullable
from ..core.property.primitive import Bool, Int, String
from ..core.property.readonly import Readonly
from ..core.property.required import Required
from ..core.validation import warning
from ..core.validation.warnings import GEOMETRY_ATTRIBUTE_LENGTH_MISMATCH
from ..model import Model
from ..util.dependencies import uses_pandas
from ..util.serialization import (
    convert_datetime_array,
    convert_datetime_type,
    convert_timedelta_type,
    is_datetime_type,
    is_timedelta_type,
)
from .callbacks import CustomJS
from .filters import AllIndices, Filter
from .selections import Selection, SelectionPolicy, UnionRenderers

if TYPE_CHECKING:
    import pandas as pd
    from pandas.core.groupby import GroupBy

    from ..core.has_props import Setter
    from ..core.types import PathLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AjaxDataSource',
    'ColumnarDataSource',
    'ColumnDataSource',
    'DataSource',
    'GeoJSONDataSource',
    'GeometryDataSource',
    'GraphDataSource',
    'IndexedDataSource',
    'IndexedSubset',
    'RecordDataSource',
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

    # Mappings are covariant in values, unlike dicts, e.g. dict[str, list[int]] is a DataDictArg.
    type DataDictArg = Mapping[str, Sequence[Value] | npt.NDArray[Value] | pd.Series | pd.Index]

    type Index = int | np.integer[Any] | slice | tuple[int | np.integer[Any] | slice, ...]

    type Patches = Mapping[str, Sequence[tuple[Index, Value]]]

@abstract
class DataSource(Model):
    ''' A base class for data source types.

    '''

@abstract
class IndexedDataSource(DataSource):
    ''' A source exposing one selectable, field-addressable logical record axis.

    Subclasses define their storage and implement the indexed field contract
    in BokehJS. Records do not need to be stored as columns.
    '''

    selected = Readonly(Instance(Selection), default=InstanceDefault(Selection), help="""
    An instance of a ``Selection`` containing logical record indices.
    This is a read-only property. You may only change the attributes of this object
    to change the selection (e.g., ``selected.indices``).
    """)

    selection_policy = Instance(SelectionPolicy, default=InstanceDefault(UnionRenderers), help="""
    An instance of a ``SelectionPolicy`` that determines how selections are set.
    """)

class RecordDataSource(IndexedDataSource):
    ''' A data source backed by an ordered sequence of row dictionaries.

    Glyphs can refer to top-level dictionary keys by field name. Rows can
    have different keys. A missing value in an individual row is treated as
    undefined in BokehJS.

    This source is best suited to small and moderate datasets. Bokeh
    serializes each row dictionary separately. For large numeric datasets,
    :class:`ColumnDataSource` can transport whole arrays in binary form.

    :meth:`from_csv` and :meth:`from_jsonl` use Python's standard library,
    so they are available even in environments without a dataframe library.

    Use an :class:`IndexedSubset` to filter rows. Selection indices refer to
    positions in the full sequence, even when a renderer displays a subset.

    To update rows, assign a new sequence to ``records``. Create a new
    dictionary for each row whose values change.
    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    records = List(Dict(String, AnyRef), help="""
    Row dictionaries with string keys and Bokeh-serializable values. Field
    names are literal keys, including keys that contain dots. Nested values
    are kept as values of their top-level field.
    """).accepts(Seq(Dict(String, AnyRef)), list)

    @classmethod
    def from_jsonl(cls, path: PathLike) -> Self:
        ''' Load a UTF-8 JSON Lines file with one object per nonblank line.

        JSON values retain their types. Malformed JSON and values other than
        objects raise a ``ValueError`` that identifies the line. An initial
        UTF-8 byte order mark is ignored. Paths ending in ``.gz`` or ``.GZ``
        are read as gzip-compressed files.
        '''
        records: list[dict[str, Any]] = []
        with _open_record_file(path, encoding="utf-8-sig") as file:
            for line_number, line in enumerate(file, 1):
                if not line.strip():
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError as error:
                    raise ValueError(f"{path}, line {line_number}: {error.msg}") from error
                if not isinstance(record, dict):
                    raise ValueError(f"{path}, line {line_number}: expected a JSON object")
                records.append(record)
        return cls(records=records)

    @classmethod
    def from_csv(cls, path: PathLike, *, converters: Mapping[str, Callable[[str], Any]] | None = None,
            delimiter: str = ",") -> Self:
        ''' Load a UTF-8 delimited text file whose first row names the fields.

        Field names must be unique and nonempty, and every data row must
        have the same number of fields as the header. Empty physical lines
        are skipped. Values are strings, including empty strings. Use ``converters`` to
        map field names to functions that convert their string values.
        Set ``delimiter="\\t"`` to read tab-separated files.
        Paths ending in ``.gz`` or ``.GZ`` are read as gzip-compressed files.
        '''
        records: list[dict[str, Any]] = []
        converters = {} if converters is None else converters
        with _open_record_file(path, encoding="utf-8-sig", newline="") as file:
            reader = csv.reader(file, delimiter=delimiter, strict=True)

            def read_rows() -> Iterator[tuple[int, list[str]]]:
                # The reader counts physical lines, including those inside quoted fields.
                line_number = 1
                try:
                    for row in reader:
                        if row:
                            yield line_number, row
                        line_number = reader.line_num + 1
                except csv.Error as error:
                    raise ValueError(f"{path}, line {line_number}: {error}") from error

            rows = read_rows()
            _, fields = next(rows, (None, []))
            if not fields or "" in fields or len(set(fields)) != len(fields):
                raise ValueError(f"{path}: expected a header with unique, nonempty field names")
            unknown_fields = sorted(converters.keys() - set(fields))
            if unknown_fields:
                raise ValueError(f"{path}: converters reference unknown fields {unknown_fields}")

            for line_number, values in rows:
                if len(values) != len(fields):
                    raise ValueError(f"{path}, line {line_number}: expected {len(fields)} fields, got {len(values)}")
                record: dict[str, Any] = dict(zip(fields, values))
                for field, convert in converters.items():
                    try:
                        record[field] = convert(record[field])
                    except (TypeError, ValueError, OverflowError) as error:
                        raise ValueError(f"{path}, line {line_number}: cannot convert field {field!r}: {error}") from error
                records.append(record)
        return cls(records=records)

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
    from ..util.warnings import warn

    current_lengths = ', '.join(sorted(str((k, len(v))) for k, v in data.items()))
    warn(
        f"ColumnDataSource's columns must be of the same length. Current lengths: {current_lengths}",
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
            _df = _df.reset_index()
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

    def stream(self, new_data: DataDictArg, rollover: int | None = None) -> None:
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

    def _stream(self, new_data: DataDictArg | pd.Series | pd.DataFrame,
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
            # converted columns are stored back into new_data below
            if not isinstance(new_data, dict):
                new_data = dict(new_data)

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
            setter (ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.
                (default: None)

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

            for ind, value in patch:

                # integer index, patch single value of 1d column
                if isinstance(ind, (int, np.integer)):
                    if not (0 <= ind < col_len):
                        raise ValueError(f"Out-of bounds index ({ind}) in patch for column: {name}")

                # slice index, patch multiple values of 1d column
                elif isinstance(ind, slice):
                    _check_slice(ind)
                    if ind.stop is not None and ind.stop > col_len:
                        raise ValueError(f"Out-of bounds slice index stop ({ind.stop}) in patch for column: {name}")

                    start = 0 if ind.start is None else ind.start
                    stop = col_len if ind.stop is None else ind.stop
                    if start > col_len:
                        raise ValueError(f"Out-of bounds slice index start ({start}) in patch for column: {name}")

                    step = 1 if ind.step is None else ind.step
                    expected = len(range(start, stop, step))
                    if len(value) != expected:
                        raise ValueError(f"Patch slice for column: {name} expects {expected} values, got {len(value)}")

                # multi-index, patch sub-regions of "n-d" column
                elif isinstance(ind, (list, tuple)):
                    if len(ind) == 0:
                        raise ValueError("Empty (length zero) patch multi-index")

                    if len(ind) == 1:
                        raise ValueError("Patch multi-index must contain more than one subindex")

                    ind_0 = ind[0]
                    if not isinstance(ind_0, (int, np.integer)):
                        raise ValueError(f"Initial patch sub-index may only be integer, got: {ind_0}")

                    if not (0 <= ind_0 < col_len):
                        raise ValueError(f"Out-of bounds initial sub-index ({ind_0}) in patch for column: {name}")

                    if not isinstance(self.data[name][ind_0], np.ndarray):
                        raise ValueError("Can only sub-patch into columns with NumPy array items")

                    if len(self.data[name][ind_0].shape) != (len(ind)-1):
                        raise ValueError("Shape mismatch between patch slice and sliced data")

                    elif isinstance(ind_0, slice):
                        _check_slice(ind_0)
                        if ind_0.stop is not None and ind_0.stop > col_len:
                            raise ValueError(f"Out-of bounds initial slice sub-index stop ({ind_0.stop}) in patch for column: {name}")

                    item_shape = self.data[name][ind_0].shape
                    for dim, subind in enumerate(ind[1:]):
                        if not isinstance(subind, (int, np.integer, slice)):
                            raise ValueError(f"Invalid patch sub-index: {subind}")
                        if isinstance(subind, slice):
                            _check_slice(subind)
                            if subind.stop is not None and subind.stop > item_shape[dim]:
                                raise ValueError(f"Out-of bounds sub-index stop ({subind.stop}) in patch for column: {name}")
                        elif not (0 <= subind < item_shape[dim]):
                            raise ValueError(f"Out-of bounds sub-index ({subind}) in patch for column: {name}")

                else:
                    raise ValueError(f"Invalid patch index: {ind}")

        self.data._patch(self.document, self, patches, setter)

class _GeometryAttributes(ColumnData, RestrictedDict[str, Any]):
    pass

def _geometry_value(value: Any) -> Any:
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Mapping):
        return {key: _geometry_value(item) for key, item in value.items()}
    # Rebuild plain containers: subclasses such as namedtuples need other constructor arguments.
    if isinstance(value, tuple):
        return tuple(_geometry_value(item) for item in value)
    if isinstance(value, list):
        return [_geometry_value(item) for item in value]
    return value

def _as_geometry_mapping(value: Any) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        value = getattr(value, "__geo_interface__", None)
    if not isinstance(value, Mapping):
        raise ValueError("geometry values must be GeoJSON mappings or define __geo_interface__")
    return value

def _geometry_mapping(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    value = _as_geometry_mapping(value)
    kind = value.get("type")
    if kind == "Feature":
        return _geometry_mapping(value.get("geometry"))
    if not isinstance(kind, str):
        raise ValueError("geometry mappings must define a 'type'")
    if kind == "GeometryCollection":
        members = value.get("geometries")
        if not isinstance(members, (list, tuple)):
            raise ValueError("GeometryCollection must contain a geometries array")
        return {
            key: [_geometry_mapping(member) for member in members] if key == "geometries" else _geometry_value(item)
            for key, item in value.items()
        }
    return _geometry_value(value)

class _Geometries(Seq[Any, Sequence[Any]]):
    def transform(self, value: Any) -> Sequence[Any]:
        return [_geometry_mapping(item) for item in super().transform(value)]

class _PolygonGeometry(TypedDict):
    type: Literal["Polygon"]
    coordinates: list[list[list[Any]]]

def _geometry_from_xy(x: Sequence[Any], y: Sequence[Any]) -> _PolygonGeometry:
    if not _is_coordinate_row(x) or not _is_coordinate_row(y):
        raise ValueError("polygon x and y coordinates must have matching nesting")
    xs = [convert_datetime_type(value) if isinstance(value, date) or is_datetime_type(value) else value for value in x]
    ys = [convert_datetime_type(value) if isinstance(value, date) or is_datetime_type(value) else value for value in y]
    if len(xs) != len(ys):
        raise ValueError("polygon x and y coordinates must have the same length")

    for value in [*xs, *ys]:
        if isinstance(value, Real) and not isinstance(value, bool):
            if not -math.inf < value < math.inf:
                raise ValueError("polygon coordinates must be finite; use Polygon or MultiPolygon geometry for multipart data")
        elif not isinstance(value, str) and not (
            _is_coordinate_row(value)
            and len(value) > 0 and all(isinstance(item, str) for item in value)
        ):
            raise ValueError("polygon coordinates must be numbers or categorical factors")

    ring = [[list(value) if _is_coordinate_row(value) else value for value in pair] for pair in zip(xs, ys)]
    if not ring:
        return _PolygonGeometry(type="Polygon", coordinates=[])
    if any(isinstance(x_value, Real) != isinstance(xs[0], Real) or isinstance(y_value, Real) != isinstance(ys[0], Real)
           for x_value, y_value in ring):
        raise ValueError("polygon coordinates cannot mix numbers and categorical factors on the same axis")
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    if len(ring) < 4:
        raise ValueError("polygon rings must contain at least three vertices")
    return _PolygonGeometry(type="Polygon", coordinates=[ring])

def _is_coordinate_row(value: Any) -> TypeGuard[Sequence[Any] | npt.NDArray[Any]]:
    return (isinstance(value, (Sequence, np.ndarray)) and not isinstance(value, (str, bytes))
            and (not isinstance(value, np.ndarray) or value.ndim == 1))

def _is_coordinate_sequence(value: Any) -> bool:
    return _is_coordinate_row(value) and (len(value) == 0 or not isinstance(value[0], str))

def _coordinate_nesting(xs: Sequence[Any], ys: Sequence[Any]) -> bool:
    x = xs[0] if len(xs) else None
    y = ys[0] if len(ys) else None
    nested_x = _is_coordinate_sequence(x)
    nested_y = _is_coordinate_sequence(y)

    def categorical_row(value: Any) -> bool:
        return isinstance(value, (list, np.ndarray)) and _is_coordinate_row(value) and len(value) > 0 and all(isinstance(item, str) for item in value)

    if (nested_x and categorical_row(y)) or (nested_y and categorical_row(x)) or (categorical_row(x) and categorical_row(y)):
        return True
    if nested_x != nested_y:
        raise ValueError("polygon x and y coordinates must have matching nesting")
    return nested_x

def _is_geometry_records(value: Any) -> TypeGuard[Mapping[str, Any]]:
    return isinstance(value, Mapping) and "geometry" not in value and "geometries" in value and "data" in value


def _geometry_records(value: Any) -> tuple[list[dict[str, Any] | None], DataDict]:
    data: DataDict
    if isinstance(value, str):
        value = json.loads(value)
    elif not isinstance(value, (Mapping, Sequence)):
        geo_interface = getattr(value, "__geo_interface__", None)
        if geo_interface is not None:
            value = geo_interface

    if _is_geometry_records(value):
        raw_geometries = value["geometries"]
        raw_data = value["data"]
        if not isinstance(raw_data, Mapping):
            raise ValueError("geometry record data must be a mapping of aligned fields")
        return list(raw_geometries), dict(raw_data)

    if isinstance(value, Mapping):
        kind = value.get("type")
        if kind == "FeatureCollection" and "geometry" not in value:
            records = list(value.get("features", []))
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
        record = _as_geometry_mapping(item)
        if record.get("type") == "Feature":
            append(record.get("geometry"), dict(record.get("properties") or {}))
        elif "geometry" in record:
            append(record["geometry"], {key: value for key, value in record.items() if key != "geometry"})
        elif record.get("type") == "GeometryCollection":
            members = record.get("geometries")
            if not isinstance(members, (list, tuple)):
                raise ValueError("GeometryCollection must contain a geometries array")
            for geometry in members:
                append(geometry, attrs)
        else:
            geometries.append(dict(record))
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
    BokehJS field lookup also exposes ``x``, ``y``, and ``z`` for points
    and ``xs``, ``ys``, and ``zs`` for single-path geometries. Attribute
    columns with those names take precedence. Record lookup returns the
    geometry and its stored attributes.

    Positional GeoJSON input expands ``GeometryCollection`` members into
    independently selectable records. The explicit ``geometries=`` form is
    lower-level and preserves each supplied geometry value and its alignment
    with ``data`` exactly, including collection values.
    '''

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if len(args) > 1:
            raise TypeError("GeometryDataSource accepts at most one positional data argument")

        raw_geometries = kwargs.pop("geometries", None)
        raw_data = kwargs.pop("data", None)
        geo_input: Any = None
        if args:
            if raw_geometries is not None or raw_data is not None:
                raise ValueError("provide either positional geometry data or geometries/data keywords")
            geo_input = args[0]
            geometries, data = _geometry_records(geo_input)
        elif raw_geometries is None and raw_data is not None and not isinstance(raw_data, Mapping):
            geo_input = raw_data
            geometries, data = _geometry_records(geo_input)
        elif raw_geometries is None and isinstance(raw_data, Mapping) and "geometry" in raw_data:
            columns = dict(raw_data)
            raw_geometries = columns.pop("geometry")
            geometries = list(raw_geometries)
            data = columns
        else:
            geometries = [] if raw_geometries is None else list(raw_geometries)
            data = {} if raw_data is None else dict(raw_data)

        lengths = {len(column) for column in data.values()}
        if len(lengths) > 1 or (lengths and lengths != {len(geometries)}):
            raise ValueError("geometry attributes must have the same length as geometries")

        # Only geo inputs carry CRS metadata. Checking the type avoids building
        # a second __geo_interface__, and skips DataFrame columns named "crs".
        if "crs" not in kwargs and hasattr(type(geo_input), "__geo_interface__"):
            crs = getattr(geo_input, "crs", None)
            if crs is not None:
                kwargs["crs"] = str(crs)

        kwargs.update(geometries=geometries, data=data)
        super().__init__(**kwargs)

    @classmethod
    def from_xy(cls, x: Sequence[Any] | npt.NDArray[Any], y: Sequence[Any] | npt.NDArray[Any], *, data: Mapping[str, Any] | None = None) -> GeometryDataSource:
        ''' Construct geometry records from familiar x/y coordinate arrays.

        Flat arrays produce one polygon. Nested arrays produce one feature per
        row. The x and y inputs must have matching nesting and lengths, and
        coordinate values must be finite numbers, dates, or categorical
        factors. Empty inputs produce zero features. Nonempty rings are
        closed automatically and require at least three vertices. Lists of
        string lists on both axes are treated as rows. Use tuples for
        multi-level factors on both axes.
        Multipart data should be supplied using natural Polygon or
        MultiPolygon geometry hierarchy instead of sentinel coordinates.
        '''
        if any(isinstance(values, np.ndarray) and values.ndim not in (1, 2) for values in (x, y)):
            raise ValueError("polygon coordinates must be one- or two-dimensional arrays of numbers")
        xs = list(x)
        ys = list(y)
        shaped = any(isinstance(values, np.ndarray) and values.ndim == 2 for values in (x, y))
        if (not xs and not ys) or shaped or _coordinate_nesting(xs, ys):
            if len(xs) != len(ys):
                raise ValueError("polygon x and y coordinates must have the same length")
            if not all(_is_coordinate_row(row) for row in [*xs, *ys]):
                raise ValueError("polygon x and y coordinates must have matching nesting")
            geometries = [_geometry_from_xy(x_row, ys[i]) for i, x_row in enumerate(xs)]
        else:
            geometries = [_geometry_from_xy(xs, ys)]
        return cls(geometries=geometries, data={} if data is None else data)

    geometries = _Geometries(AnyVal, default=[], help="""
    GeoJSON geometry mappings, one per selectable feature.
    """)

    data = _GeometryAttributes(String, Seq(AnyVal), disallow={"geometry"}, help="""
    Attribute columns aligned with ``geometries`` for styling and callbacks.
    The field name ``geometry`` is reserved for geometry values.
    When replacing the geometries, update the attribute columns to match the
    new length. Document validation reports any columns that are misaligned.
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

    @warning(GEOMETRY_ATTRIBUTE_LENGTH_MISMATCH)
    def _check_attribute_lengths(self) -> str | None:
        mismatched = [name for name, column in self.data.items() if len(column) != self.length]
        if mismatched:
            return f"{self}: {', '.join(mismatched)}"
        return None

    def add(self, data: Sequence[Any] | npt.NDArray[Any], name: str) -> str:
        ''' Add an attribute field aligned with the geometry records. '''
        if name == "geometry":
            raise ValueError(f"geometry field {name!r} is reserved")
        if len(data) != self.length:
            raise ValueError(f"attribute {name!r} must have the same length as geometries")
        self.data[name] = data
        return name



def _default_graph_nodes() -> ColumnDataSource:
    return ColumnDataSource(data=dict(index=[]))

def _default_graph_edges() -> ColumnDataSource:
    return ColumnDataSource(data=dict(start=[], end=[]))

_NODE_ALIASES = {"id": "index"}
_EDGE_ALIASES = {"source": "start", "target": "end"}

def _normalize_graph_fields(fields: dict[str, Any], aliases: Mapping[str, str]) -> None:
    for alias, canonical in aliases.items():
        if canonical not in fields and alias in fields:
            fields[canonical] = fields.pop(alias)

def _column_source(data: Mapping[str, Sequence[Any]], aliases: Mapping[str, str]) -> ColumnDataSource:
    columns = dict(data)
    _normalize_graph_fields(columns, aliases)
    return ColumnDataSource(columns)

def _rows_source(rows: Iterable[Mapping[str, Any]]) -> ColumnDataSource:
    records = list(rows)
    fields = list(dict.fromkeys(field for record in records for field in record))
    columns = {}
    for field in fields:
        values = [record.get(field) for record in records]
        if field in {"index", "start", "end"}:
            columns[field] = [list(value) if isinstance(value, tuple) else value for value in values]
            continue
        if any(isinstance(value, (list, tuple)) for value in values):
            if not all(isinstance(value, (list, tuple)) for value in values if value is not None):
                raise ValueError("Can't mix scalar and non-scalar values for graph attributes")
            values = [[] if value is None else list(value) for value in values]
        columns[field] = values
    return ColumnDataSource(columns)

def _tabular_graph_source(value: Any, aliases: Mapping[str, str]) -> ColumnDataSource | None:
    import narwhals.stable.v1 as nw

    if nw.dependencies.is_into_dataframe(value):
        native_columns = set(nw.from_native(value, eager_only=True).columns)
        columns = ColumnDataSource._data_from_df(value)
        # An explicit alias takes precedence over a generated index with
        # the same canonical name. Preserve the index in other cases.
        for alias, canonical in aliases.items():
            if alias in native_columns and canonical not in native_columns:
                columns.pop(canonical, None)
        return _column_source(columns, aliases)

    if uses_pandas(value) or is_dataclass(value) or not isinstance(value, Iterable) or isinstance(value, (str, bytes)):
        try:
            return ColumnDataSource(value)
        except ValueError as error:
            raise ValueError(f"Failed to auto-convert {type(value)} to ColumnDataSource.\n Original error: {error}") from error

    return None

def _node_source(nodes: Any) -> IndexedDataSource:
    if isinstance(nodes, IndexedDataSource):
        return nodes

    if (source := _tabular_graph_source(nodes, _NODE_ALIASES)) is not None:
        return source

    if isinstance(nodes, Mapping):
        if not nodes:
            return _default_graph_nodes()
        if "id" in nodes or "index" in nodes or not all(isinstance(attrs, Mapping) for attrs in nodes.values()):
            return _column_source(nodes, _NODE_ALIASES)
        records = []
        for node_id, attrs in nodes.items():
            if not isinstance(attrs, Mapping):
                raise ValueError("a node mapping must map node identifiers to attribute mappings")
            if "index" in attrs:
                raise ValueError("node attributes cannot contain the reserved 'index' field")
            records.append({"index": node_id, **attrs})
        return _rows_source(records)

    records = []
    for node in nodes:
        if isinstance(node, Mapping):
            record = dict(node)
            _normalize_graph_fields(record, _NODE_ALIASES)
            if "index" not in record:
                raise ValueError("a node record must contain an 'id' or 'index' field")
        elif isinstance(node, tuple) and len(node) == 2 and isinstance(node[1], Mapping):
            node_id, attrs = node
            if "index" in attrs:
                raise ValueError("node tuple attributes cannot contain the reserved 'index' field")
            record = {"index": node_id, **attrs}
        else:
            record = {"index": node}
        records.append(record)
    return _rows_source(records) if records else _default_graph_nodes()

def _edge_source(edges: Any) -> IndexedDataSource:
    if isinstance(edges, IndexedDataSource):
        return edges

    if (source := _tabular_graph_source(edges, _EDGE_ALIASES)) is not None:
        return source

    if isinstance(edges, Mapping):
        if not edges:
            return _default_graph_edges()
        return _column_source(edges, _EDGE_ALIASES)

    records = []
    for edge in edges:
        if isinstance(edge, Mapping):
            record = dict(edge)
            _normalize_graph_fields(record, _EDGE_ALIASES)
            if "start" not in record or "end" not in record:
                raise ValueError("an edge record must contain source/target or start/end fields")
        elif isinstance(edge, (tuple, list)) and len(edge) in (2, 3):
            start, end = edge[:2]
            attrs = edge[2] if len(edge) == 3 else {}
            if not isinstance(attrs, Mapping):
                raise ValueError("the third item of an edge tuple must be an attribute mapping")
            if any(field in attrs for field in ("start", "end")):
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
        for reserved in ("index",):
            if reserved in attrs:
                from ..util.warnings import warn

                warn(f"Converting node attribute {reserved!r} is skipped because it is reserved by GraphDataSource")
                attrs.pop(reserved)
        nodes.append((node_id, attrs))

    edges = []
    for start, end, attrs in graph_edges:
        attrs = dict(attrs)
        for reserved in ("start", "end"):
            if reserved in attrs:
                from ..util.warnings import warn

                warn(f"Converting edge attribute {reserved!r} is skipped because it is reserved by GraphDataSource")
                attrs.pop(reserved)
        edges.append((start, end, attrs))

    return _node_source(nodes), _edge_source(edges)

def _graph_id_key(value: Any) -> tuple[Any, ...]:
    if isinstance(value, np.generic) and not isinstance(value, (np.datetime64, np.timedelta64)):
        value = value.item()
    if isinstance(value, (tuple, list)):
        return ("array", *(_graph_id_key(item) for item in value))
    if value is None:
        return ("null",)
    if isinstance(value, bool):
        return ("boolean", value)
    if isinstance(value, str):
        return ("string", value)
    if isinstance(value, (int, float)):
        if isinstance(value, float) and np.isnan(value):
            return ("number", "nan")
        if value == 0 and np.signbit(value):
            return ("number", "-0")
        return ("number", value)
    # Match the browser identifier after Bokeh serialization.
    if is_datetime_type(value):
        return _graph_id_key(convert_datetime_type(value))
    if is_timedelta_type(value):
        return _graph_id_key(convert_timedelta_type(value))
    if isinstance(value, date):
        return ("string", value.isoformat())
    if uses_pandas(value):
        import pandas as pd
        if value is pd.NA:
            return ("null",)
    raise ValueError("graph node identifiers must be scalar values or nested sequences of scalar values")

def _validate_graph_node_ids(source: IndexedDataSource) -> None:
    if not isinstance(source, ColumnDataSource):
        return
    seen = set()
    for index, value in enumerate(source.data.get("index", [])):
        key = _graph_id_key(value)
        if key in seen:
            raise ValueError(f"duplicate graph node identifier at index {index}")
        seen.add(key)

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
    and edge records may use ``source`` and ``target``. These names fill in
    missing ``index``, ``start``, and ``end`` fields. When the canonical field is
    already present, the alias remains an ordinary attribute. A NetworkX-like
    graph can be passed as the sole positional argument.

    Node identifiers must be unique when Bokeh converts node data into a
    ``ColumnDataSource``. For an existing ``IndexedDataSource``, topology
    lookup uses the first row with a given identifier.

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

        if not isinstance(raw_nodes, IndexedDataSource):
            _validate_graph_node_ids(nodes)
        kwargs.update(nodes=nodes, edges=edges)
        super().__init__(**kwargs)

    nodes = Readonly(Instance(IndexedDataSource), default=_default_graph_nodes, help="""
    The indexed data source containing node records.
    """)

    edges = Readonly(Instance(IndexedDataSource), default=_default_graph_edges, help="""
    The indexed data source containing edge records.
    """)

class IndexedSubset(Model):
    ''' A filtered subset of the logical records in an ``IndexedDataSource``.

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
        indexed_subset.filter &= ~IndexFilter(indices=[10, 11])
    """)

class GeoJSONDataSource(ColumnarDataSource):
    '''

    '''

    geojson = Required(JSON, help="""
    GeoJSON that contains features for plotting. Currently
    ``GeoJSONDataSource`` can only process a ``FeatureCollection`` or
    ``GeometryCollection``.
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

def _open_record_file(path: PathLike, *, encoding: str, newline: str | None = None) -> TextIO:
    open_file = gzip.open if fspath(path).lower().endswith(".gz") else open
    return open_file(path, "rt", encoding=encoding, newline=newline)

def _check_slice(s: slice) -> None:
    if (s.start is not None and s.stop is not None and s.start > s.stop):
        raise ValueError(f"Patch slices must have start < end, got {s}")
    if s.step == 0:
        raise ValueError(f"Patch slices must have non-zero step, got {s}")
    if (s.start is not None and s.start < 0) or \
       (s.stop  is not None and s.stop < 0) or \
       (s.step  is not None and s.step < 0):
        raise ValueError(f"Patch slices must have non-negative (start, stop, step) values, got {s}")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
