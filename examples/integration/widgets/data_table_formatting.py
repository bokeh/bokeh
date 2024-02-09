import numpy as np
import pandas as pd

from bokeh.io import save
from bokeh.models import DataTable, StringFormatter, DateFormatter

# Sample size
sample_size = 30

# Data generation
dataframe = pd.DataFrame({
    "text_color_col": np.random.choice(["red", "green", "blue", "black", "grey"], size=sample_size),
    "other_text_color_col": ["some text"] * sample_size,
    "background_color_col": np.random.choice(["red", "green", "blue", "yellow"], size=sample_size),
    "other_background_color_col": ["some text"] * sample_size,
    "font_style_col": np.random.choice(["normal", "italic", "bold", "bold italic"], size=sample_size),
    "other_font_style_col": ["some text"] * sample_size,
    "text_align_col": np.random.choice(["left", "center", "right"], size=sample_size),
    "other_text_align_col": ["some text"] * sample_size,
    "date_col": pd.date_range(start="2020-01-01", periods=sample_size),
})

formatters = [
    StringFormatter(text_color="text_color_col"),
    StringFormatter(text_color="blue"),
    StringFormatter(background_color="background_color_col"),
    StringFormatter(background_color="yellow"),
    StringFormatter(font_style="font_style_col"),
    StringFormatter(font_style="bold"),
    StringFormatter(text_align="text_align_col"),
    StringFormatter(text_align="center"),
    DateFormatter(format="%Y-%m-%d", text_color="text_color_col", font_style="font_style_col"),
]

datatable = DataTable.from_data(dataframe)
for i in range(len(formatters)):
    datatable.columns[i+1].formatter = formatters[i]

save(datatable)
