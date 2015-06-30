''' Provide the ``check_integrity`` function.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)


def check_integrity(models):

    messages = dict(error=[], warning=[])

    for model in models:
        validators = [
            obj for obj in model.__class__.__dict__.values() if getattr(obj, "validator_type", None)
        ]
        for func in validators:
            messages[func.validator_type].extend(func(model))

    for msg in sorted(messages['error']):
        logger.error("E-%d (%s): %s: %s" % msg)

    for msg in sorted(messages['warning']):
        logger.error("W-%d (%s): %s: %s" % msg)

    # This will be turned on in a future release
    # if len(messages['error']) or (len(messages['warning']) and settings.strict()):
    #     raise ValidationError("Errors encountered during validation (see log output)")
