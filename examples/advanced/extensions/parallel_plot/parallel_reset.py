''' Define the toolbar tool that clears selections in the parallel coordinates
plot.

.. bokeh-example-metadata::
    :title: Reset tool for a parallel plot
    :keywords: parallel coordinates, reset, custom tool
    :apis: bokeh.models.ActionTool
    :no-index:
'''

from bokeh.models import ActionTool


class ParallelResetTool(ActionTool):
    """ Tool to reset only plot axes and not selections
    """

    __implementation__ = 'parallel_reset.ts'
