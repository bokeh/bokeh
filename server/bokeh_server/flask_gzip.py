from __future__ import absolute_import, print_function

from flask import request
import gzip
import six

class Gzip(object):
    def __init__(self, app, compress_level=6, minimum_size=500):
        self.app = app
        self.compress_level = compress_level
        self.minimum_size = minimum_size
        self.app.after_request(self.after_request)

    def after_request(self, response):
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if response.status_code < 200 or \
           response.status_code >= 300 or \
           not response.content_length or \
           response.content_length < self.minimum_size or \
           'gzip' not in accept_encoding.lower() or \
           'Content-Encoding' in response.headers:
            return response

        response.direct_passthrough = False
        gzip_buffer = six.BytesIO()
        gzip_file = gzip.GzipFile(mode='wb', compresslevel=self.compress_level, fileobj=gzip_buffer)
        gzip_file.write(response.data)
        gzip_file.close()
        response.data = gzip_buffer.getvalue()
        response.headers['Content-Encoding'] = 'gzip'
        response.headers['Content-Length'] = len(response.data)

        return response
