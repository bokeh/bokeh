import os
from six.moves import urllib
import zipfile


def extract_hosted_zip(data_url, save_dir, exclude_term=None):
    """Downloads, then extracts a zip file."""

    zip_name = os.path.join(save_dir, 'temp.zip')

    # get the zip file
    try:
        zip_name, hdrs = urllib.request.urlretrieve(url=data_url, filename=zip_name)
    except IOError, e:
      print "Can't retrieve %r to %r: %s" % (data_url, save_dir, e)
      return

    # extract, then remove temp file
    extract_zip(zip_name=zip_name, exclude_term=exclude_term)
    os.unlink(zip_name)


def extract_zip(zip_name, exclude_term=None):
    """Extracts a zip file to its containing directory."""

    zip_dir = os.path.dirname(os.path.abspath(zip_name))

    try:
        with zipfile.ZipFile(zip_name) as z:

            # write each zipped file out if it isn't a directory
            files = [file for file in z.namelist() if not file.endswith('/')]
            for file in files:

                # remove any provided extra directory term from zip file
                if exclude_term:
                    dest_file = file.replace(exclude_term, '')
                else:
                    dest_file = file

                dest_file = os.path.normpath(os.path.join(zip_dir, dest_file))
                dest_dir = os.path.dirname(dest_file)

                # make directory if it does not exist
                if not os.path.isdir(dest_dir):
                    os.makedirs(dest_dir)

                # read file from zip, then write to
                data = z.read(file)
                with open(dest_file, 'w') as f:
                    f.write(data)

    except zipfile.error, e:
        print "Bad zipfile (%r): %s"%(zip_name, e)
        return


if __name__ == '__main__':

    # info for retrieving and extracting the zip file
    this_dir = os.path.dirname(os.path.realpath(__file__))
    zip_file = 'http://quantquote.com/files/quantquote_daily_sp500_83986.zip'
    zip_dir = 'quantquote_daily_sp500_83986/'

    extract_hosted_zip(data_url=zip_file, save_dir=this_dir, exclude_term=zip_dir)