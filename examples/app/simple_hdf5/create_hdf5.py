import h5py
import numpy as np

def getData(f, name):
    shape = f[name].shape
    # Empty array
    data = np.empty(shape, dtype=np.float64)
    # read_dicect to empty arrays
    f[name].read_direct(data)
    return data


def f(x):
    return np.exp(-x ** 2 / 2) / np.sqrt(2 * np.pi)


a = np.random.rand(100, 1)
b = [f(x) for x in np.linspace(-1, 1, num=100)]


with h5py.File('myfile.hdf5', 'w') as f:
    hip_data = f.create_dataset("hip_strength", data=a)
    knee_data = f.create_dataset("knee_strength", data=b)
    print(getData(f, "knee_strength"))


