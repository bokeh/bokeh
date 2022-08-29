#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Encapsulate implicit state that is useful for Bokeh plotting APIs.

.. note::
    While ``State`` objects can also be manipulated explicitly, they are
    automatically configured when the output functions like |output_file|
    from :ref:`bokeh.io` are used. Therefore, manipulating ``State`` objects is
    usually not necessary.

Generating output for Bokeh plots requires coordinating several things:

|Document|
    Groups together Bokeh models that may be shared between plots (e.g.,
    range or data source objects) into one common structure.

:class:`~bokeh.resources.Resources`
    Control how JavaScript and CSS for the client library BokehJS are
    included and used in the generated output.

It is possible to handle the configuration of these things manually, and some
examples of doing this can be found in ``examples/models`` directory. When
developing sophisticated applications, it may be necessary or desirable to work
at this level. However, for general use this would quickly become burdensome.
This module provides a ``State`` class that encapsulates these objects and
ensures their proper configuration in many common usage scenarios.

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
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, cast

# Bokeh imports
from ..core.types import PathLike
from ..document import Document
from ..resources import Resources, ResourcesMode

if TYPE_CHECKING:
    from ..core.types import ID
    from ..server.server import Server
    from .notebook import CommsHandle, NotebookType

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'curstate',
    'State',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class State:
    ''' Manage state related to controlling Bokeh output.

    .. autoclasstoc::

    '''

    _file: FileConfig | None

    _notebook: bool
    _notebook_type: NotebookType | None
    last_comms_handle: CommsHandle | None
    uuid_to_server: dict[ID, Server]

    def __init__(self) -> None:
        self.last_comms_handle = None
        self.uuid_to_server = {} # Mapping from uuid to server instance
        self.reset()

    # Properties --------------------------------------------------------------

    @property
    def document(self) -> Document:
        ''' A default |Document| to use for all output operations.

        '''
        return self._document

    @document.setter
    def document(self, doc: Document) -> None:
        self._document = doc

    @property
    def file(self) -> FileConfig | None:
        ''' A structure with the default configuration for file output (READ ONLY)

            See :class:`~bokeh.io.state.FileConfig`.

        '''
        return self._file

    @property
    def notebook(self) -> bool:
        ''' Whether to generate notebook output on show operations. (READ ONLY)

        '''
        return self._notebook

    @property
    def notebook_type(self) -> NotebookType | None:
        ''' Notebook type

        '''
        return self._notebook_type

    @notebook_type.setter
    def notebook_type(self, notebook_type: NotebookType) -> None:
        ''' Notebook type, acceptable values are 'jupyter' as well as any names
        defined by external notebook hooks that have been installed.

        '''
        if notebook_type is None or not isinstance(notebook_type, str):
            raise ValueError("Notebook type must be a string")
        self._notebook_type = cast("NotebookType", notebook_type.lower())

    # Public methods ----------------------------------------------------------

    def output_file(self, filename: PathLike, title: str = "Bokeh Plot",
            mode: ResourcesMode | None = None, root_dir: PathLike | None = None) -> None:
        ''' Configure output to a standalone HTML file.

        Calling ``output_file`` does not clear the effects of any other calls to
        |output_notebook|, etc. It adds an additional output destination
        (publishing to HTML files). Any other active output modes continue
        to be active.

        Args:
            filename (PathLike, e.g. str, Path) : a filename for saving the HTML document

            title (str, optional) : a title for the HTML document

            mode (str, optional) : how to include BokehJS (default: ``'cdn'``)

                One of: ``'inline'``, ``'cdn'``, ``'relative(-dev)'`` or
                ``'absolute(-dev)'``. See :class:`~bokeh.resources.Resources`
                for more details.

            root_dir (str, optional) : root dir to use for absolute resources
                (default: None)

                This value is ignored for other resource types, e.g. ``INLINE`` or ``CDN``.

        .. warning::
            The specified output file will be overwritten on every save, e.g.,
            every time ``show()`` or ``save()`` is called.

        '''
        self._file = FileConfig(
            filename=filename,
            resources=Resources(mode=mode, root_dir=root_dir),
            title=title,
        )

        if os.path.isfile(filename):
            log.info(f"Session output file '{filename}' already exists, will be overwritten.")

    def output_notebook(self, notebook_type: NotebookType = "jupyter") -> None:
        ''' Generate output in notebook cells.

        Calling ``output_notebook`` does not clear the effects of any other
        calls to |output_file|, etc. It adds an additional output destination
        (publishing to notebook output cells). Any other active output modes
        continue to be active.

        Returns:
            None

        '''
        self._notebook = True
        self.notebook_type = notebook_type

    def reset(self) -> None:
        ''' Deactivate all currently active output modes and set ``curdoc()``
        to a fresh empty ``Document``.

        Subsequent calls to ``show()`` will not render until a new output mode
        is activated.

        Returns:
            None

        '''
        self._reset_with_doc(Document())

    # Private methods ---------------------------------------------------------

    def _reset_keeping_doc(self) -> None:
        ''' Reset output modes but DO NOT replace the default Document

        '''
        self._file = None
        self._notebook = False
        self._notebook_type = None

    def _reset_with_doc(self, doc: Document) -> None:
        ''' Reset output modes but DO replace the default Document

        '''
        self._document = doc
        self._reset_keeping_doc()

def curstate() -> State:
    ''' Return the current State object

    Returns:
      State : the current default State object

    '''
    global _STATE
    if _STATE is None:
        _STATE = State()
    return _STATE

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dataclass(frozen=True)
class FileConfig:
    filename: PathLike
    resources: Resources
    title: str

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_STATE: State | None = None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
