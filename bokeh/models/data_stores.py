from __future__ import absolute_import

from ..core.properties import Any, ColumnData, Dict, Instance, List, Seq, String
from ..model import Model
from ..util.dependencies import import_optional

pd = import_optional('pandas')

class ColumnDataStore(Model):

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

    column_names = List(String, help="""
    A list of names for all the columns in this ColumnDataStore.
    """)

    data = ColumnData(String, Seq(Any), help="""
    Mapping of column names to sequences of data. The data can be, e.g,
    Python lists or tuples, NumPy arrays, etc.
    """).asserts(lambda _, data: len(set(len(x) for x in data.values())) <= 1,
                 lambda: warnings.warn("ColumnDataStore's columns must be of the same length", BokehUserWarning))

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

        super(ColumnDataStore, self).__init__(**kw)

        self.column_names[:] = list(raw_data.keys())
        self.data.update(raw_data)

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
