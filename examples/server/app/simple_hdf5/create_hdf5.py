from os.path import join

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
    with h5py.File(join(path, 'demo_data.hdf5'), 'w') as f:
        for group, vals in distributions.items():
            gauss_pdf = f.create_group(group)
            gauss_pdf.create_dataset("x", data=x)
            gauss_pdf.create_dataset("pdf", data=getattr(
                ss, vals['name'])(**vals['options']).pdf(x))
