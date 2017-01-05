''' Provide the ``check_integrity`` function.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

def check_integrity(models):
    ''' Apply validation and integrity checks to a collection of Bokeh models.

    Args:
        models (seq[Model]) : a collection of Models to test

    Returns:
        None

    This function will emit log warning and error messages for all error or
    warning conditions that are detected. For example, layouts without any
    children will trigger a warning:

    .. code-block:: python

        >>> empty_row = Row

        >>> check_integrity([empty_row])
        W-1002 (EMPTY_LAYOUT): Layout has no children: Row(id='2404a029-c69b-4e30-9b7d-4b7b6cdaad5b', ...)

    '''
    messages = dict(error=[], warning=[])

    for model in models:
        validators = []
        for name in dir(model):
            if not name.startswith("_check"): continue
            obj = getattr(model, name)
            if getattr(obj, "validator_type", None):
                validators.append(obj)
        for func in validators:
            messages[func.validator_type].extend(func())

    for msg in sorted(messages['error']):
        logger.error("E-%d (%s): %s: %s" % msg)

    for msg in sorted(messages['warning']):
        logger.warning("W-%d (%s): %s: %s" % msg)

    # This will be turned on in a future release
    # if len(messages['error']) or (len(messages['warning']) and settings.strict()):
    #     raise RuntimeError("Errors encountered during validation (see log output)")
