#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Encapulate the management of any modules that are created in the process
of building a Bokeh Document in a DocumentModelManager class.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
import weakref
from types import ModuleType
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from .document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocumentModuleManager',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DocumentModuleManager:
    ''' Keep track of and clean up after modules created while building Bokeh
    Documents.

    '''

    _document : weakref.ReferenceType[Document]
    _modules: List[ModuleType]

    def __init__(self, document: Document):
        '''

        Args:
            document (Document): A Document to manage modules for
                A weak reference to the Document will be retained

        '''
        self._document = weakref.ref(document)
        self._modules = []

    def __len__(self) -> int:
        return len(self._modules)

    def add(self, module: ModuleType) -> None:
        ''' Add a module associated with a Document.

        .. note::
            This method will install the module in ``sys.modules``

        Args:
            module (Module) : a module to install for the configured Document

        Returns:
            None

        '''
        if module.__name__ in sys.modules:
            raise RuntimeError(f"Add called already-added module {module.__name__!r} for {self._document()!r}")
        sys.modules[module.__name__] = module
        self._modules.append(module)

    def destroy(self) -> None:
        ''' Clean up any added modules, and check that there are no unexpected
        referrers afterwards.

        Returns:
            None

        '''
        from gc import get_referrers
        from types import FrameType

        log.debug(f"Deleting {len(self._modules)} modules for document {self._document()!r}")

        for module in self._modules:

            # Modules created for a Document should have three referrers at this point:
            #
            # - sys.modules
            # - self._modules
            # - a frame object
            #
            # This function will take care of removing these expected references.
            #
            # If there are any additional referrers, this probably means the module will be
            # leaked. Here we perform a detailed check that the only referrers are expected
            # ones. Otherwise issue an error log message with details.
            referrers = get_referrers(module)
            referrers = [x for x in referrers if x is not sys.modules]  # lgtm [py/comparison-using-is]
            referrers = [x for x in referrers if x is not self._modules]  # lgtm [py/comparison-using-is]
            referrers = [x for x in referrers if not isinstance(x, FrameType)]
            if len(referrers) != 0:
                log.error(f"Module {module!r} has extra unexpected referrers! This could indicate a serious memory leak. Extra referrers: {referrers!r}")

            # remove the reference from sys.modules
            if module.__name__ in sys.modules:
                del sys.modules[module.__name__]

            # explicitly clear the module contents and the module here itself
            module.__dict__.clear()
            del module

        # remove the references from self._modules
        self._modules = []

        # the frame reference will take care of itself


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
