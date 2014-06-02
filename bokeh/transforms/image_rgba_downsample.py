import numpy as np

try:
    import scipy
    import scipy.misc
except ImportError as e:
    print(e)

# image is a 2D array: x, y of RGBA as uint32
def downsample(image, image_x_axis, image_y_axis,
               x_bounds, y_bounds, x_resolution, y_resolution):
    x_resolution = int(round(x_resolution))
    y_resolution = int(round(y_resolution))
    x_bounds = np.searchsorted(image_x_axis, x_bounds)
    y_bounds = np.searchsorted(image_y_axis, y_bounds)
    #y_bounds = image.shape[0] + 1 - y_bounds[::-1]
    subset = image[y_bounds[0]:y_bounds[1],
                   x_bounds[0]:x_bounds[1]]
    x_downsample_factor = max(round(subset.shape[1] / x_resolution / 3.), 1)
    y_downsample_factor = max(round(subset.shape[0] / y_resolution / 3.), 1)

    subset = subset[::x_downsample_factor, ::y_downsample_factor]

    # Downsampling now occurs across each channel of the image
    subset_view = subset.view(dtype=np.uint8).reshape(subset.shape + (4,)).T
    red, green, blue, alpha = (subset_view[i] for i in range(4))

    red = scipy.misc.imresize(red, (x_resolution, y_resolution), interp='nearest')
    green = scipy.misc.imresize(green, (x_resolution, y_resolution), interp='nearest')
    blue = scipy.misc.imresize(blue, (x_resolution, y_resolution), interp='nearest')
    alpha = scipy.misc.imresize(alpha, (x_resolution, y_resolution), interp='nearest')

    image = np.empty((x_resolution, y_resolution), dtype=np.uint32)
    image_view = image.view(dtype=np.uint8).reshape((x_resolution, y_resolution, 4)).T

    image_view[0] = red.T
    image_view[1] = green.T
    image_view[2] = blue.T
    image_view[3] = alpha.T

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