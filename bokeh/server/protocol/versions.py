''' Provides the definitions of Bokeh Websocket Prototol versions.

Attributes:
    spec (dict) : maps protocol versions to their specifications

A protocol specification is a sequence of tuples of the form:

    (
        (<message_type>, <revision>),
        (<message_type>, <revision>),
        ...
    )

Where ``<message_type>`` is string that identifies a message type, e.g,
``'ACK'``,``'SERVER-INFO-REQ'``, etc. and ``<revision>`` is an integer that
identifies what revision of the message this version of the protocol uses.

Protocol versions are given by a string ``'<major>.<minor>'``. The guidelines
for updating the major or minor version are:

``<major>``
    bump when new messages are added or deleted (and reset minor
    version to zero)

``<minor>``
    bump when existing message revisions change

'''
from __future__ import absolute_import

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
