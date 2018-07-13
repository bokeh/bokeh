#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for interacting with S3

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import join

# External imports
import boto
from boto.exception import NoAuthHandlerFound
from boto.s3.key import Key as S3Key

# Bokeh imports
from bokeh._testing.util.git import __version__
from bokeh._testing.util.travis import JOB_ID
from bokeh.util.terminal import trace, ok, fail

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

S3_BUCKET = "bokeh-travis"

S3_URL = "https://s3.amazonaws.com/%s" % S3_BUCKET

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def connect_to_s3():
    """
    Returns the connection object or None if connection failed.
    """
    try:
        return boto.connect_s3()
    except NoAuthHandlerFound:
        fail("Upload was requested but could not connect to S3.")
        fail("This is expected if you are an external contributor submitting a PR to Bokeh.")
        fail("This could also happen if S3 credentials are not available on the machine where this test is running.")
        return None

def upload_file_to_s3_by_job_id(file_path, content_type="text/html", extra_message=None):
    """
    Uploads a file to bokeh-travis s3 bucket under a job_id folder
    """
    s3_filename = join(JOB_ID, file_path)
    return upload_file_to_s3(file_path, s3_filename, content_type, extra_message)


def upload_file_to_s3(file_path, s3_filename, content_type="text/html", extra_message=None):
    """
    Uploads a file to bokeh-travis s3 bucket.
    """
    conn = connect_to_s3()
    upload = conn is not None

    try:
        with open(file_path, "rb") as f:
            contents = f.read()
    except OSError:
        fail("Upload was requested but file %s was not available." % file_path)
        upload = False

    if __version__.endswith("-dirty"):
        fail("Uploads are not permitted when working directory is dirty.")
        fail("Make sure that __version__ doesn't contain -dirty suffix.")
        upload = False

    if upload:
        bucket = conn.get_bucket(S3_BUCKET)
        key = S3Key(bucket, s3_filename)
        key.set_metadata("Content-Type", content_type)
        key.set_contents_from_string(contents, policy="public-read")
        url = join(S3_URL, s3_filename)
        if extra_message is not None:
            ok("%s | Access upload at: %s" % (extra_message, url))
        else:
            trace("Access upload at: %s" % url)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

logging.getLogger('boto').setLevel(logging.INFO)
logging.getLogger('urllib3.connectionpool').setLevel(logging.INFO)
logging.getLogger('requests.packages.urllib3.connectionpool').setLevel(logging.INFO)
