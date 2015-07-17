#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from bokeh.settings import settings
import flask

class BokehBlueprint(flask.Blueprint):

    def __init__(self, *args, **kwargs):
        super(BokehBlueprint, self).__init__(*args, **kwargs)

    def setup(self, backbone_storage, servermodel_storage, authentication):
        self.backbone_storage = backbone_storage
        self.servermodel_storage = servermodel_storage
        self.authentication = authentication

    def current_user(self):
        return self.authentication.current_user()

bokeh_blueprint = BokehBlueprint(
    'bokeh.server',
    'bokeh.server',
    static_folder='static',
    static_url_path='/bokeh/static',
    template_folder='_templates'
)
