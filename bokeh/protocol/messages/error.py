#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from traceback import format_exception

# Bokeh imports
from ..message import Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'error',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class error(Message):
    ''' Define the ``ERROR`` message for reporting error conditions back to a
    Bokeh server.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'text'      : <error message text>

            # this is optional
            'traceback' : <traceback text>
        }

    '''

    msgtype  = 'ERROR'

    def __repr__(self):
        msg = super().__repr__()
        msg += " --- "
        msg += self.content['text']
        if "traceback" in self.content:
            msg += "\n"
            msg += "".join(self.content['traceback'])
        return msg

    @classmethod
    def create(cls, request_id, text, **metadata):
        ''' Create an ``ERROR`` message

        Args:
            request_id (str) :
                The message ID for the message the precipitated the error.

            text (str) :
                The text of any error message or traceback, etc.

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)
        content = {
            'text'  : text,
        }
        ex_type, ex, tb = sys.exc_info()
        if ex_type:
            content['traceback'] = format_exception(ex_type, ex, tb)
        return cls(header, metadata, content)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
