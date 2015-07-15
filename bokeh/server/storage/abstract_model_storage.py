#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

class AbstractModelStorage(object):
    """ Abstract base class for concrete model storage interfaces.

    """

    def get(self, key):
        """ Returns a JSON object for a given key.

        Args:
            key (str) : key to look up

        Returns:
            data : JSON data (or None, if key does not exist)

        """
        raise NotImplementedError

    def set(self, key, val):
        """ Save a JSON object for a given key.

        Args:
            key (str) : key to set data for
            val (obj) : model data to set

        Returns:
            None

        """
        raise NotImplementedError

    def create(self, key, val):
        """ Save a JSON object for a new key.

        Args:
            key (str) : key to create and set data for
            val (obj) : model data to set

        Returns:
            None

        Raises:
            DataIntegrityException : if the key already exists

        """
        raise NotImplementedError
