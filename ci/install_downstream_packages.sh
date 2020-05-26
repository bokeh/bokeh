#!/bin/bash

set -x #echo on

conda install --yes --quiet distributed
conda install --yes --quiet -c pyviz/label/dev holoviews nose
pip install pandas_bokeh
pip install geopandas
git clone https://github.com/PatrikHlobil/Pandas-Bokeh.git
