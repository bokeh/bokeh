from __future__ import absolute_import, print_function

from os import mkdir, remove
from os.path import exists, expanduser, isdir, join, splitext
from sys import stdout
from zipfile import ZipFile
import six
from six.moves.urllib.request import urlopen

def _bokeh_dir(create=False):
    bokeh_dir = join(expanduser("~"), ".bokeh")
    if not exists(bokeh_dir):
        if not create: return bokeh_dir
        print("Creating %s directory" % bokeh_dir)
        try:
            mkdir(bokeh_dir)
        except OSError:
            raise RuntimeError("could not create bokeh config directory at %s" % bokeh_dir)
    else:
        if not isdir(bokeh_dir):
            raise RuntimeError("%s exists but is not a directory" % bokeh_dir)
    return bokeh_dir

def _data_dir(file_name=None, create=False):
    try:
        import yaml
    except ImportError:
        raise RuntimeError("'yaml' and 'pyyaml' are required to use bokeh.sampledata functions")
    bokeh_dir = _bokeh_dir(create=create)
    data_dir = join(bokeh_dir, "data")
    try:
        config = yaml.load(open(join(bokeh_dir, 'config')))
        data_dir = expanduser(config['sampledata_dir'])
    except (IOError, TypeError):
        pass
    if not exists(data_dir):
        if not create:
            raise RuntimeError('bokeh sample data directory does not exist, please execute bokeh.sampledata.download()')
        print("Creating %s directory" % data_dir)
        try:
            mkdir(data_dir)
        except OSError:
            raise RuntimeError("could not create bokeh data directory at %s" % data_dir)
    else:
        if not isdir(data_dir):
            raise RuntimeError("%s exists but is not a directory" % data_dir)
    if file_name is not None:
        return join(data_dir, file_name)
    else:
        return data_dir

def download(progress=True):
    '''
    Download larger data sets for various Bokeh examples.
    '''
    data_dir = _data_dir(create=True)
    print("Using data directory: %s" % data_dir)

    s3 = 'https://s3.amazonaws.com/bokeh_data/'
    files = [
        (s3, 'CGM.csv'),
        (s3, 'US_Counties.zip'),
        (s3, 'us_cities.json'),
        (s3, 'unemployment09.csv'),
        (s3, 'AAPL.csv'),
        (s3, 'FB.csv'),
        (s3, 'GOOG.csv'),
        (s3, 'IBM.csv'),
        (s3, 'MSFT.csv'),
        (s3, 'WPP2012_SA_DB03_POPULATION_QUINQUENNIAL.zip'),
        (s3, 'gapminder_fertility.csv'),
        (s3, 'gapminder_population.csv'),
        (s3, 'gapminder_life_expectancy.csv'),
        (s3, 'gapminder_regions.csv'),
        (s3, 'world_cities.zip'),
        (s3, 'airports.json'),
        (s3, 'movies.db.zip'),
    ]

    for base_url, file_name in files:
        _getfile(base_url, file_name, data_dir, progress=progress)

def _getfile(base_url, file_name, data_dir, progress=True):
    file_url = join(base_url, file_name)
    file_path = join(data_dir, file_name)

    url = urlopen(file_url)

    with open(file_path, 'wb') as file:
        file_size = int(url.headers["Content-Length"])
        print("Downloading: %s (%d bytes)" % (file_name, file_size))

        fetch_size = 0
        block_size = 16384

        while True:
            data = url.read(block_size)
            if not data:
                break

            fetch_size += len(data)
            file.write(data)

            if progress:
                status = "\r%10d [%6.2f%%]" % (fetch_size, fetch_size*100.0/file_size)
                stdout.write(status)
                stdout.flush()

    if progress:
        print()

    real_name, ext = splitext(file_name)

    if ext == '.zip':
        if not splitext(real_name)[1]:
            real_name += ".csv"

        print("Unpacking: %s" % real_name)

        with ZipFile(file_path, 'r') as zip_file:
            zip_file.extract(real_name, data_dir)

        remove(file_path)

def _open_csv_file(filename):
    # csv differs in Python 2.x and Python 3.x. Open the file differently in each.
    if six.PY2:
        return open(filename, 'rb')
    else:
        return open(filename, 'r', newline='', encoding='utf8')
