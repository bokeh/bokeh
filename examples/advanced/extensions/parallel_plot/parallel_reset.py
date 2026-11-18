''' Define the toolbar tool that clears selections in the parallel coordinates
plot.

.. bokeh-example-metadata::
    :title: Parallel reset
    :keywords: parallel reset, advanced, extensions
    :apis: bokeh.models.ActionTool
'''

from bokeh.models import ActionTool


class ParallelResetTool(ActionTool):
    """ Tool to reset only plot axes and not selections
    """

    __implementation__ = 'parallel_reset.ts'
