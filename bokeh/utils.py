import urlparse
def urljoin(*args):
    return reduce(urlparse.urljoin, args)
