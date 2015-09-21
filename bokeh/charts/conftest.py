"""Defines chart-wide shared test fixtures.

"""

import pytest
import numpy as np
import pandas as pd

from bokeh.sampledata.autompg import autompg
from bokeh.charts._attributes import AttrSpec


class TestData(object):
    def __init__(self):
        self.cat_list = ['a', 'c', 'a', 'b']
        self.list_data = [[1, 2, 3, 4], [2, 3, 4, 5]]
        self.array_data = [np.array(item) for item in self.list_data]
        self.dict_data = {'col1': self.list_data[0],
                          'col2': self.list_data[1]}
        self.pd_data = pd.DataFrame(self.dict_data)
        self.records_data = self.pd_data.to_dict(orient='records')

        self.auto_data = autompg
        self.single_col_spec = {'test': AttrSpec(df=self.auto_data, columns='cyl',
                                                 name='test', iterable=['a', 'b'])}
        self.multi_col_spec = {'test': AttrSpec(df=self.auto_data,
                                                columns=('cyl', 'origin'),
                                                name='test', iterable=['a', 'b'])}


@pytest.fixture(scope='module')
def test_data():
    return TestData()
