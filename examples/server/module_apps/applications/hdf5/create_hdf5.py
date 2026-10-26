# Standard library imports
import os
from os.path import join
from tempfile import TemporaryDirectory

# External imports
import h5py
import numpy as np
import scipy.stats as ss


def generate_data(path):
    distributions = {'Gaussian': {'options': dict(loc=0, scale=0.1),
                                  'name': 'norm'},
                     'Exponential': {'options': dict(loc=-0.5, scale=1),
                                     'name': 'expon'},
                     'Chi Square': {'options': dict(loc=-0.5, df=1),
                                    'name': 'chi2'},
                     'Alpha': {'options': dict(a=3, loc=-0.5),
                               'name': 'alpha'},
                     'Beta': {'options': dict(a=3, b=2, loc=-0.5),
                              'name': 'beta'},
                     }
    x = np.linspace(-1, 1, num=1000)
    with TemporaryDirectory(dir=path) as staging:
        _write_data(join(staging, 'demo_data.hdf5'), distributions, x)
        os.replace(join(staging, 'demo_data.hdf5'), join(path, 'demo_data.hdf5'))


def _write_data(filename, distributions, x):
    with h5py.File(filename, 'w') as f:
        for group, vals in distributions.items():
            gauss_pdf = f.create_group(group)
            gauss_pdf.create_dataset("x", data=x)
            gauss_pdf.create_dataset("pdf", data=getattr(
                ss, vals['name'])(**vals['options']).pdf(x))
