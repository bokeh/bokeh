''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import base64
import codecs
import hashlib
import hmac
import random
import time

from six import binary_type

from bokeh.settings import settings

# Use the system PRNG for session id generation (if possible)
# NOTE: secure random string generation implementation is adapted
#       from the Django project. Reference:
#       https://github.com/django/django/blob/0ed7d155635da9f79d4dd67e4889087d3673c6da/django/utils/crypto.py
try:
    random = random.SystemRandom()
    using_sysrandom = True
except NotImplementedError:
    import warnings
    warnings.warn('A secure pseudo-random number generator is not available '
                  'on your system. Falling back to Mersenne Twister.')
    if settings.secret_key() is None:
        warnings.warn('A secure pseudo-random number generator is not available '
                      'and no BOKEH_SECRET_KEY has been set. '
                      'Setting a secret key will mitigate the lack of a secure '
                      'generator.')
    using_sysrandom = False

def _ensure_bytes(secret_key):
    if secret_key is None:
        return None
    elif isinstance(secret_key, binary_type):
        return secret_key
    else:
        return codecs.encode(secret_key, 'utf-8')

# this is broken out for unit testability
def _reseed_if_needed(using_sysrandom, secret_key):
    secret_key = _ensure_bytes(secret_key)
    if not using_sysrandom:
        # This is ugly, and a hack, but it makes things better than
        # the alternative of predictability. This re-seeds the PRNG
        # using a value that is hard for an attacker to predict, every
        # time a random string is required. This may change the
        # properties of the chosen random sequence slightly, but this
        # is better than absolute predictability.
        random.seed(
            hashlib.sha256(
                ("%s%s%s" % (
                    random.getstate(),
                    time.time(),
                    secret_key)).encode('utf-8')
            ).digest())

def _base64_encode(decoded):
    # base64 encode both takes and returns bytes, we want to work with strings.
    # If 'decoded' isn't bytes already, assume it's utf-8
    decoded_as_bytes = _ensure_bytes(decoded)
    encoded = codecs.decode(base64.urlsafe_b64encode(decoded_as_bytes), 'ascii')
    # remove padding '=' chars that cause trouble
    return str(encoded.rstrip('='))

def _signature(base_id, secret_key):
    secret_key = _ensure_bytes(secret_key)
    base_id = codecs.encode(base_id, "utf-8")
    signer = hmac.new(secret_key, base_id, hashlib.sha256)
    return _base64_encode(signer.digest())

def _get_random_string(length=36,
                       allowed_chars='abcdefghijklmnopqrstuvwxyz'
                       'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                       secret_key=settings.secret_key_bytes()):
    """
    Return a securely generated random string.
    The default length of 12 with the a-z, A-Z, 0-9 character set returns
    a 71-bit value. log_2((26+26+10)^12) =~ 71 bits
    """
    secret_key = _ensure_bytes(secret_key)
    _reseed_if_needed(using_sysrandom, secret_key)
    return ''.join(random.choice(allowed_chars) for i in range(length))

def generate_session_id(secret_key=settings.secret_key_bytes(), signed=settings.sign_sessions()):
    """ Generate a random session ID.
    Args:
        secret_key (str, optional) : Secret key (default: value of 'BOKEH_SECRET_KEY' env var)
        signed (bool, optional) : Whether to sign the session ID (default: value of 'BOKEH_SIGN_SESSIONS' env var)
    """
    secret_key = _ensure_bytes(secret_key)
    if signed:
        # note: '-' can also be in the base64 encoded signature
        base_id = _get_random_string(secret_key=secret_key)
        return base_id + '-' + _signature(base_id, secret_key)
    else:
        return _get_random_string(secret_key=secret_key)

def check_session_id_signature(session_id, secret_key=settings.secret_key_bytes(), signed=settings.sign_sessions()):
    """ Check the signature of a session ID.
    Args:
        session_id (str) : The session ID to check
        secret_key (str, optional) : Secret key (default: value of 'BOKEH_SECRET_KEY' env var)
        signed (bool, optional) : Whether to check anything (default: value of 'BOKEH_SIGN_SESSIONS' env var)
    """
    secret_key = _ensure_bytes(secret_key)
    if signed:
        pieces = session_id.split('-', 1)
        if len(pieces) != 2:
            return False
        base_id = pieces[0]
        provided_signature = pieces[1]
        expected_signature = _signature(base_id, secret_key)
        # hmac.compare_digest() uses a string compare algorithm that doesn't
        # short-circuit so we don't allow timing analysis
        return hmac.compare_digest(expected_signature, provided_signature)
    else:
        return True
