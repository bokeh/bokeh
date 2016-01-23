"""Defines chart-wide shared test fixtures."""

import numpy as np
import pandas as pd
import pytest

from bokeh.sampledata.autompg import autompg


class TestData(object):
    """Contains properties with easy access to data used across tests."""
    def __init__(self):
        self.cat_list = ['a', 'c', 'a', 'b']
        self.list_data = [[1, 2, 3, 4], [2, 3, 4, 5]]
        self.array_data = [np.array(item) for item in self.list_data]
        self.dict_data = {'col1': self.list_data[0],
                          'col2': self.list_data[1]}
        self.pd_data = pd.DataFrame(self.dict_data)
        self.records_data = self.pd_data.to_dict(orient='records')

        self.auto_data = autompg
        self._setup_auto_mpg()

    def _setup_auto_mpg(self):

        # add a boolean column
        self.auto_data['large_displ'] = self.auto_data['displ'] > 350

        # add categorical column
        cat = pd.Categorical.from_array(self.auto_data['cyl'])
        new_order = list(reversed(sorted(cat.categories.values.tolist())))
        self.auto_data['reversed_cyl'] = cat.reorder_categories(new_order)


@pytest.fixture(scope='module')
def test_data():
    return TestData()


@pytest.fixture(scope='module')
def wide_data_with_cat(test_data):
    data = test_data.dict_data.copy()
    data['col3'] = test_data.cat_list
    return data


@pytest.fixture(scope='module')
def df_with_cat_index(test_data):
    return pd.DataFrame(test_data.dict_data, index=test_data.cat_list)
