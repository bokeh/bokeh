from __future__ import print_function

import boto
import colorama

from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from os.path import join, isfile

#
# Output to stdout
#
colorama.init()


def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def red(text):
    return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)


def yellow(text):
    return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)


def blue(text):
    return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)


def green(text):
    return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)


def fail(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (red("[FAIL]"), msg))


def warn(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[WARN]"), msg))


def info(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % ("[INFO]", msg))


def ok(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (green("[OK]"), msg))


def upload_file_to_s3(file_path):
    from .constants import s3, s3_bucket, build_id
    file_ready = isfile(file_path)
    if file_ready:
        try:
            conn = boto.connect_s3()
            bucket = conn.get_bucket(s3_bucket)
            upload = True
        except NoAuthHandlerFound:
            fail("Upload was requested but could not connect to S3.")
            upload = False

        if upload is True:
            with open(file_path, "r") as f:
                html = f.read()
            filename = join(build_id, file_path)
            key = S3Key(bucket, filename)
            key.set_metadata("Content-Type", "text/html")
            key.set_contents_from_string(html, policy="public-read")
            ok("\n%s Access report at: %s" % ("---", join(s3, filename)))
    else:
        fail("%s was not ready" % file_path)
