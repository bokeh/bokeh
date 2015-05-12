from __future__ import absolute_import

from arraymanagement.nodes.csvnodes import PandasCSVNode
from arraymanagement.nodes.hdfnodes import PandasHDFNode, PyTables
from arraymanagement.nodes.sql import SimpleQueryTable

global_config = dict(
    is_dataset = False,
    csv_options = {},
    datetime_type = 'datetime64[ns]',
    loaders = {
        '*.csv' : PandasCSVNode,
        '*.CSV' : PandasCSVNode,
        '*.hdf5' : PandasHDFNode,
        '*.h5' : PandasHDFNode,
        '*.pandas' : PandasHDFNode,
        '*.sql' : SimpleQueryTable,
        '*.table' : PyTables,
        },
    )
local_config = {}
