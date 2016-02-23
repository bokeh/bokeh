from __future__ import print_function

import boto
import colorama
import subprocess
import sys

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


def upload_file_to_s3(file_path, content_type="text/html"):
    # Uploads into a build_id folder
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
            key.set_metadata("Content-Type", content_type)
            key.set_contents_from_string(html, policy="public-read")
            ok("Access report at: %s" % (join(s3, filename)))
    else:
        fail("%s is not a file" % file_path)


def get_version_from_git(ref=None):
    cmd = ["git", "describe", "--tags", "--always"]

    if ref is not None:
        cmd.append(ref)

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        write("Failed to get version for %s" % ref)
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])
