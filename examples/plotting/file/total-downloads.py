import os
import sys
import gzip
import argparse
import pandas as pd

from os.path import join, expanduser, abspath
from datetime import datetime as dt
from bokeh.plotting import *

parser = argparse.ArgumentParser()
parser.add_argument('-s', '--data-set', type=str, required=True, help='type of data set', choices=['installers','pkgs'])
parser.add_argument('-D', '--data-dir', type=str, required=True, help='data directory')

args = parser.parse_args()

def load_csv(file_path):
    with gzip.open(file_path) as file:
        df = pd.read_csv(file)
        df['date'] = pd.to_datetime(df.timestamp, unit='s')
        return df

def load_dataset(dataset_name):
    dataset_path = abspath(join(expanduser(args.data_dir), dataset_name))
    datasets = []

    for file_name in sorted(os.listdir(dataset_path)):
        if file_name.endswith('%s.internalpanel.data.gz' % dataset_name):
            datasets.append(load_csv(join(dataset_path, file_name)))

    return pd.concat(datasets)

df = load_dataset(args.data_set)

series = df.date.apply(lambda x: dt(x.year, x.month, x.day))
series = series.value_counts()
series = series.sort_index()

x = []
y = []

prev = 0

for a, b in series.iteritems():
    prev = prev + b
    x.append(a)
    y.append(prev)

output_file("total-downloads.html", title="total-downloads.py example")
line(x, y, x_axis_type='datetime', color='blue', title="Total downloads numbers for %s" % (args.data_set),
     line_width=5, outline_line_width=5, plot_width=1000, plot_height=500)
