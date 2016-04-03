import h5py
import numpy as np


def f(x):
    return np.exp(-x ** 2 / 2) / np.sqrt(2 * np.pi)


a = np.random.rand(100, 1)
b = [f(x) for x in np.linspace(-1, 1, num=100)]


with h5py.File('demo_data.hdf5', 'w') as f:
    hip_data = f.create_dataset("hip_strength", data=a)
    knee_data = f.create_dataset("knee_strength", data=b)
