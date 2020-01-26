#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for interacting with S3

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from os.path import join

# External imports
import boto
from boto.exception import NoAuthHandlerFound
from boto.s3.key import Key as S3Key

# Bokeh imports
from bokeh._testing.util.git import __version__
from bokeh.util.terminal import fail, ok, trace

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

JOB_ID = os.environ.get("GITHUB_ACTION", "local")

S3_BUCKET = "ci.bokeh.org"

S3_URL = "https://ci.bokeh.org/"

__all__ = (
    'connect_to_s3',
    'upload_file_to_s3',
    'upload_file_to_s3_by_job_id',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def connect_to_s3():
    ''' Return the connection object or None if connection failed.

    '''
    try:
        # calling_format due to https://github.com/boto/boto/issues/2836
        from boto.s3.connection import OrdinaryCallingFormat
        return boto.connect_s3(calling_format=OrdinaryCallingFormat())
    except NoAuthHandlerFound:
        fail("Upload was requested but could not connect to S3.")
        fail("This is expected if you are an external contributor submitting a PR to Bokeh.")
        fail("This could also happen if S3 credentials are not available on the machine where this test is running.")
        return None

def upload_file_to_s3_by_job_id(file_path, content_type="text/html", extra_message=None):
    ''' Upload a file to the ci.bokeh.org s3 bucket under a github-ci/JOB_ID

    '''
    s3_filename = join("github-ci", JOB_ID, file_path)
    return upload_file_to_s3(file_path, s3_filename, content_type, extra_message)


def upload_file_to_s3(file_path, s3_filename, content_type="text/html", extra_message=None):
    ''' Upload a file to the ci.bokeh.org s3 bucket

    '''
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
