import numpy as np
from ..objects import ServerDataSource

try:
    import scipy
    import scipy.misc
except ImportError as e:
    print(e)


def source(**kwargs):
  kwargs['transform'] = {'resample':'heatmap'}
  kwargs['data'] = {'x': [0],
                                'y': [0],
                                'global_x_range' : [0, 10],
                                'global_y_range' : [0, 10],
                                'global_offset_x' : [0],
                                'global_offset_y' : [0],
                                'dw' : [10],
                                'dh' : [10],
                                'palette': ["Spectral-11"]
                            }
  return ServerDataSource(**kwargs)


def downsample(arr, global_x_range, global_y_range,
               x_bounds, y_bounds, x_resolution, y_resolution,
               index_slice, transpose):
    shape = arr.shape
    print ("**", index_slice, transpose)
    # assume the array is 3d.  If that is the case, we might set
    # index_slice to [None, None, 0].  Then, the slice we pull out will be
    # [x_start:x_end, y_start:y_end, 0].  The goal of the following code
    # is to compute what x_start/x_end is, and then replace the Nones in
    # index_slice with those bounds, to minimize data extracted from pytables
    # transposing the remaining 2d array is also taken into account

    # compute the dimension number of the dimensions we are downsampling over
    # (where the Nones are).  transposing results in swapping dims
    if index_slice:
        image_indexes = [idx for idx, val in enumerate(index_slice) if val is None]
        image_shapes = [shape[x] for x in image_indexes]
    else:
        index_slice = None, None
        image_indexes = [0,1]
        image_shapes = shape

    if transpose:
        image_indexes = image_indexes[::-1]
        image_shapes = image_shapes[::-1]
    # use the data space bounds to compute the indexes into the resulting dimension
    # compute a step size, based on trying to oversample by 3x

    image_x_axis = np.linspace(global_x_range[0],
                               global_x_range[1],
                               image_shapes[0])
    image_y_axis = np.linspace(global_y_range[0],
                               global_y_range[1],
                               image_shapes[1])
    x_resolution, y_resolution = int(round(x_resolution)), int(round(y_resolution))
    x_bounds = [x_bounds.start, x_bounds.end]
    y_bounds = [y_bounds.start, y_bounds.end]
    x_bounds = np.searchsorted(image_x_axis, x_bounds)
    y_bounds = np.searchsorted(image_y_axis, y_bounds)
    x_downsample_factor = max(round((x_bounds[1] - x_bounds[0]) / x_resolution / 3.), 1)
    y_downsample_factor = max(round((y_bounds[1] - y_bounds[0]) / y_resolution / 3.), 1)

    # swap out the Nones with actual slice objects
    index_slice[image_indexes[0]] = slice(x_bounds[0], x_bounds[1], x_downsample_factor)
    index_slice[image_indexes[1]] = slice(y_bounds[0], y_bounds[1], y_downsample_factor)

    subset = arr[tuple(index_slice)]
    if transpose:
        subset = subset.T
        subset = subset[::-1,:]
    image = scipy.misc.imresize(subset, (x_resolution, y_resolution),
                        interp='nearest')
    bounds = image_x_axis[x_bounds[0]:x_bounds[1]]
    dw = np.max(bounds) - np.min(bounds)
    bounds = image_y_axis[y_bounds[0]:y_bounds[1]]
    dh = np.max(bounds) - np.min(bounds)
    return {'data': image,
            'offset_x': image_x_axis[x_bounds[0]],
            'offset_y': image_y_axis[y_bounds[0]],
            'dw': dw,
            'dh': dh,
            'subset': subset,
    }
