import numpy as np

from bokeh.palettes import Spectral6


def process_data():
    from bokeh.sampledata.gapminder import fertility, life_expectancy, population, regions

    # Make the column names ints not strings for handling
    columns = list(fertility.columns)
    years = list(range(int(columns[0]), int(columns[-1])))
    rename_dict = dict(zip(columns, years))

    fertility = fertility.rename(columns=rename_dict)
    life_expectancy = life_expectancy.rename(columns=rename_dict)
    population = population.rename(columns=rename_dict)
    regions = regions.rename(columns=rename_dict)

    # Turn population into bubble sizes. Use min_size and factor to tweak.
    scale_factor = 200
    population_size = np.sqrt(population / np.pi) / scale_factor
    min_size = 3
    population_size = population_size.where(population_size >= min_size).fillna(min_size)

    # Use pandas categories and categorize & color the regions
    regions.Group = regions.Group.astype('category')
    regions_list = list(regions.Group.cat.categories)

    def get_color(r):
        return Spectral6[regions_list.index(r.Group)]
    regions['region_color'] = regions.apply(get_color, axis=1)

    return fertility, life_expectancy, population_size, regions, years, regions_list
