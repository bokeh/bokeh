from __future__ import print_function
import pytest

import os
import boto
import sys
import colorama
from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from os.path import join
import subprocess

s3_bucket = "bokeh-travis"
s3 = "https://s3.amazonaws.com/%s" % s3_bucket
build_id = os.environ.get('TRAVIS_BUILD_ID')
colorama.init()


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

__version__ = get_version_from_git()


def yellow(text):
    return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)


def green(text):
    return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)


def human_bytes(n):
    """
    Return the number of bytes n in more human readable form.
    """
    if n < 1024:
        return '%d B' % n
    k = n / 1024
    if k < 1024:
        return '%d KB' % round(k)
    m = k / 1024
    if m < 1024:
        return '%.1f MB' % m
    g = m / 1024
    return '%.2f GB' % g


def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def warn(msg=None):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[WARN]"), msg))


def pytest_sessionfinish(session, exitstatus):
    # Only upload the pytest report at the end of the test run
    if os.environ.get('UPLOAD_PYTEST_HTML', "False") == "True":
        try:
            conn = boto.connect_s3()
            bucket = conn.get_bucket(s3_bucket)
            upload = True
        except NoAuthHandlerFound:
            warn("Upload (--upload) was requested but could not connect to S3.")
            warn("Fix your credentials or permissions and re-run tests.")
            upload = False

        if upload:
            with open('pytest-report.html', 'r') as f:
                html = f.read()
            report_size = len(html)
            write("%s Uploading report (%s) ..." % (green(">>>"), human_bytes(report_size)))
            filename = join(__version__, build_id, "report.html")
            key = S3Key(bucket, filename)
            key.set_metadata("Content-Type", "text/html")
            key.set_contents_from_string(html, policy="public-read")
            write("%s Access report at: %s" % (green("---"), join(s3, filename)))
