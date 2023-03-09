import numpy as np
import pandas as pd
from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LabelSet, CustomJS
import pyarrow as pa


def main():
    # dtype = pa.list_(pa.list_(pa.int32()))
    # extra = pd.Series(inner, dtype=pd.ArrowDtype(dtype))
    # numpy_arr = extra.to_numpy()
    source = ColumnDataSource({
        'arr': np.array([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ])
    })

    p = figure()
    p.js_on_event('tap', CustomJS(code='console.log(source.data["arr"])', args={'source': source}))

    show(p)


if __name__ == '__main__':
    main()
