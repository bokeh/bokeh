
def download():
    '''
    Download larger data sets for various Bokeh examples.
    '''
    base_url = 'https://s3.amazonaws.com/bokeh_data/'
    files = [
        'CGM.csv',
        'US_Counties.csv',
        'unemployment09.csv'
    ]
    for file_name in files:
        _getfile(base_url, file_name)


def _getfile(base_url, file_name):
    from os.path import dirname, join
    import urllib2

    url = join(base_url, file_name)
    u = urllib2.urlopen(url)
    f = open(join(dirname(__file__), file_name), 'wb')
    meta = u.info()
    file_size = int(meta.getheaders("Content-Length")[0])
    print "Downloading: %s Bytes: %s" % (file_name, file_size)

    file_size_dl = 0
    block_sz = 8192
    while True:
        buffer = u.read(block_sz)
        if not buffer:
            break

        file_size_dl += len(buffer)
        f.write(buffer)
        status = r"%10d  [%3.2f%%]" % (file_size_dl, file_size_dl * 100. / file_size)
        status = status + chr(8)*(len(status)+1)
        print status,

    f.close()
