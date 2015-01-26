import os
import urllib
import zipfile


def download_data(url, save_dir, exclude_term):
    name = os.path.join(save_dir, 'temp.zip')

    #get the zip file
    try:
        name, hdrs = urllib.urlretrieve(url, name)
    except IOError, e:
      print "Can't retrieve %r to %r: %s" % (url, save_dir, e)
      return

    # open the zip file
    try:
        z = zipfile.ZipFile(name)
    except zipfile.error, e:
        print "Bad zipfile (from %r): %s"%(url, e)
        return

    # loop over files in list and extract each, if it isn't a directory
    for n in z.namelist():

        if not n.endswith('/'):
            rel_file = n.replace(exclude_term, '')

            dest = os.path.normpath(os.path.join(save_dir, rel_file))
            destdir = os.path.dirname(dest)
            if not os.path.isdir(destdir):
                os.makedirs(destdir)
            data = z.read(n)
            f = open(dest, 'w')
            f.write(data)
            f.close()

    z.close()
    os.unlink(name)


if __name__ == '__main__':

    # info for retrieving and extracting the zip file
    this_dir = os.path.dirname(os.path.realpath(__file__))
    zip_file = 'http://quantquote.com/files/quantquote_daily_sp500_83986.zip'
    zip_dir = 'quantquote_daily_sp500_83986/'

    download_data(url=zip_file, save_dir=this_dir, exclude_term=zip_dir)