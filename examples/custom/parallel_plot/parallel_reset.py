from bokeh.models import ActionTool


class ParallelResetTool(ActionTool):
    """ Tool to reset only plot axes and not selections
    """

    __implementation__ = 'parallel_reset.ts'
