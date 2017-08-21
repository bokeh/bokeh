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
from __future__ import absolute_import

import bokeh.protocol.versions as versions

def test_available_versions():
    assert set(versions.spec.keys()) == {'1.0'}

def test_version_1_0():
    assert versions.spec['1.0'] == (
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
    )
