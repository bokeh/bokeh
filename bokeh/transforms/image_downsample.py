import numpy as np

try:
    import scipy
    import scipy.misc
except ImportError as e:
    print(e)


def downsample(image, image_x_axis, image_y_axis,
               x_bounds, y_bounds, x_resolution, y_resolution):
    x_resolution, y_resolution = int(round(x_resolution)), int(round(y_resolution))
    x_bounds = np.searchsorted(image_x_axis, x_bounds)
    y_bounds = np.searchsorted(image_y_axis, y_bounds)
    #y_bounds = image.shape[0] + 1 - y_bounds[::-1]
    subset = image[y_bounds[0]:y_bounds[1],
                   x_bounds[0]:x_bounds[1]]
    x_downsample_factor = max(round(subset.shape[1] / x_resolution / 3.), 1)
    y_downsample_factor = max(round(subset.shape[0] / y_resolution / 3.), 1)
    subset = subset[::x_downsample_factor, ::y_downsample_factor]
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
