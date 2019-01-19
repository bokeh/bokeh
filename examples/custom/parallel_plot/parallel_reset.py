from bokeh.models import Action


class ParallelResetTool(Action):
    """ Tool to reset only plot axes and not selections
    """

    __implementation__ = 'parallel_reset.ts'
