#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide definitions for Bokeh WebSocket protocol versions.

A *protocol specification* is a sequence of tuples of the form:

.. code-block:: python

    (
        (<message_type>, <revision>),
        (<message_type>, <revision>),
        ...
    )

Where ``<message_type>`` is string that identifies a message type, e.g,
``'ACK'``, ``'SERVER-INFO-REQ'``, etc. and ``<revision>`` is an integer that
identifies what revision of the message this version of the protocol uses.

A *protocol version* is a string of the form ``'<major>.<minor>'``. The
guidelines for updating the major or minor version are:

``<major>``
    bump when new messages are added or deleted (and reset minor
    version to zero)

``<minor>``
    bump when existing message revisions change

.. data:: spec
    :annotation:

    A mapping of protocol versions to protocol specifications.

    .. code-block:: python

        {
            "1.0" : (
                ("ACK", 1),
                ("OK", 1),
                ("ERROR", 1),
                ("EVENT", 1),
                ('SERVER-INFO-REPLY', 1),
                ('SERVER-INFO-REQ', 1),
                ('PULL-DOC-REQ', 1),
                ('PULL-DOC-REPLY', 1),
                ('PUSH-DOC', 1),
                ('PATCH-DOC', 1)
            ),
        }


'''
###############################################################################
#                                                                             #
#                                                                             #
#                                                                             #
#                       *******************************                       #
#                       ****** !!! IMPORTANT !!! ******                       #
#                       *******************************                       #
#                                                                             #
#                                                                             #
#                                                                             #
#     ANY update to this file MUST be accompanied by the "PROTOCOL" tag.      #
#                                                                             #
#                                                                             #
#                                                                             #
#                                                                             #
###############################################################################

# Please update the docstring above if anything here is changed

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

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'spec',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

spec = {

    "1.0" : (
        ("ACK", 1),
        ("OK", 1),
        ("ERROR", 1),
        ("EVENT", 1),
        ('SERVER-INFO-REPLY', 1),
        ('SERVER-INFO-REQ', 1),
        ('PULL-DOC-REQ', 1),
        ('PULL-DOC-REPLY', 1),
        ('PUSH-DOC', 1),
        ('PATCH-DOC', 1)
    ),

}

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
