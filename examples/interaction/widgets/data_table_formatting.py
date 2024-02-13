from datetime import datetime

import numpy as np
import pandas as pd

from bokeh.io import save
from bokeh.models import (ColumnDataSource, DataTable, DateFormatter,
                          NumberFormatter, TableColumn)
from bokeh.palettes import RdYlGn9
from bokeh.transform import factor_cmap, linear_cmap

np.random.seed(1)

sample_size = 10

mean, std, K_std = 1e6, 3e5, 2

data = dict(
    dates=pd.date_range(start=datetime.now().date(), periods=sample_size).tolist(),
    downloads=np.random.normal(mean, std, sample_size),
)

data["is_weekend"] = [str(date.weekday() >= 5) for date in data["dates"]]
data["weekend_bold"] = ["bold" if date.weekday() >= 5 else "normal" for date in data["dates"]]

table = DataTable(
    source=ColumnDataSource(data),
    columns=[
        TableColumn(
            field="dates",
            title="Date",
            formatter=DateFormatter(
                format="%A, %b %-d, %Y",
                font_style="weekend_bold",
                background_color=factor_cmap(
                    field_name="is_weekend",
                    palette=["lightgrey", "white"],
                    factors=["True", "False"],
                ),
            ),
        ),
        TableColumn(
            field="downloads",
            title="Downloads",
            formatter=NumberFormatter(
                format="0.0a",
                font_style="weekend_bold",
                background_color=linear_cmap(
                    field_name="downloads",
                    palette=RdYlGn9[::-1],
                    low=mean - K_std*std,
                    high=mean + K_std*std,
                ),
            ),
        ),
    ],
)

save(table)
