""" Defines the base HTML Fragment Session type
"""
from __future__ import absolute_import

import logging

from .base_html_session import BaseHTMLSession

logger = logging.getLogger(__file__)

class HTMLFragmentSession(BaseHTMLSession):
    """ Produces a DOM fragment which is suitable for embedding in a
    pre-existing HTML DOM.  Differs from HTMLFileSession in that the
    requisite script and css lines are generated separately.
    """

    def contents(self, body_only=False):
        """ Returns the multi-line string needed to embed a plot into
        the <body> of an HTML document.  Includes the JS and CSS by
        default; if **body_only** is True, then returns just the plot
        <div> and associated <script> tags, but none of the static
        files it depends on.
        """
        pass
