### Imports and Data Generation
import numpy as np
import pandas as pd

from bokeh.io import save
from bokeh.models import DataTable, DynamicFormatter

np.random.seed(42)

# Custom colors in Hex
EUROPE = "#bdfca2"
AMERICA = "#a2c4fc"
GREY = "#d8dfe6"

# Custom colors in RGB
red_color = (245, 112, 110)
green_color = (182, 232, 144)

def interpolate_color(color1, color2, t):
    """Interpolates between two RGB colors."""
    return tuple(int(a + (b - a) * t) for a, b in zip(color1, color2))

def cmap(value):
    """Gets a color from a value between 0 and 1."""
    # Determine which colors to interpolate based on value
    if value <= 0.5:
        interpolated_color = interpolate_color(red_color, (255, 255, 0), value * 2)
    else:
        interpolated_color = interpolate_color((255, 255, 0), green_color, (value - 0.5) * 2)
    # Convert RGB to Hex
    return f"#{interpolated_color[0]:02x}{interpolated_color[1]:02x}{interpolated_color[2]:02x}"


# Sample size
sample_size = 30

# Data generation
dataframe = pd.DataFrame({
    "Name": np.random.choice(["John", "Anna", "Peter", "Linda", "Thomas", "George", "Marie", "Linda"], size=sample_size),
    "Age": np.random.randint(13, 61, size=sample_size),
    "Location": np.random.choice(["New York", "Paris", "Berlin", "London", "Stockholm", "Madrid", "Washington"], size=sample_size),
    "Height": np.round(np.random.uniform(1.5, 2.0, size=sample_size), 2),
})


### DataTable with DynamicFormatters

# Solid grey color for names column
name_format = DynamicFormatter(background_color=GREY)

# Indicate if the person is over 18 years old, and set the text red if they are not
over_18 = np.where(dataframe["Age"] < 18, "red", None)
age_format = DynamicFormatter(text_color="age_color")

# Set the background color of the "Location" column based on the "Continent" column
continent = np.where(dataframe["Location"].isin(["New York", "Washington"]), AMERICA, EUROPE)
location_format = DynamicFormatter(background_color="location_color")

# Set the color of the "Height" column on a continuous scale
norm_height = (dataframe["Height"] - dataframe["Height"].min()) / (dataframe["Height"].max() - dataframe["Height"].min())
height_color = norm_height.apply(cmap)
height_format = DynamicFormatter(background_color="height_color")

# Create the DataTable
data_table = DataTable.from_data(dataframe, include_pandas_index=False, height=800)

# Add the new source columns for the formatters
data_table.source.data["age_color"] = over_18
data_table.source.data["location_color"] = continent
data_table.source.data["height_color"] = height_color

# Apply the formatters
data_table.columns[0].formatter = name_format
data_table.columns[1].formatter = age_format
data_table.columns[2].formatter = location_format
data_table.columns[3].formatter = height_format

save(data_table)
