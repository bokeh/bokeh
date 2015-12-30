from __future__ import absolute_import

import base64
import codecs
import unittest

import bokeh.util.session_id
from bokeh.util.session_id import ( generate_session_id,
                                    generate_secret_key,
                                    check_session_id_signature,
                                    _signature,
                                    _reseed_if_needed,
                                    _base64_encode )
import random

# decoder for our flavor of base64 that converts to ascii
# and drops '=' padding
def _base64_decode(encoded):
    # put the padding back
    mod = len(encoded) % 4
    if mod != 0:
        encoded = encoded + ("=" * (4 - mod))
    assert (len(encoded) % 4) == 0
    # base64 lib both takes and returns bytes, we want to work with strings
    encoded_as_bytes = codecs.encode(encoded, 'ascii')
    return base64.urlsafe_b64decode(encoded_as_bytes)

def _base64_decode_utf8(encoded):
    return codecs.decode(_base64_decode(encoded), 'utf-8')

class TestSessionId(unittest.TestCase):
    def test_base64_roundtrip(self):
        for s in [ "", "a", "ab", "abc", "abcd", "abcde", "abcdef", "abcdefg",
                   "abcdefgh", "abcdefghi",
                   "abcdefghijklmnopqrstuvwxyz" ]:
            self.assertEqual(s, _base64_decode_utf8(_base64_encode(s)))

    def test_reseed_if_needed(self):
        # we have to set a seed in order to be able to get state
        random.seed(codecs.encode("abcdefg", "utf-8"))
        state = random.getstate()
        _reseed_if_needed(using_sysrandom=True, secret_key=None)
        # did NOT reseed
        self.assertEqual(state, random.getstate())
        # monkeypatch
        saved = bokeh.util.session_id.random
        try:
            bokeh.util.session_id.random = random
            _reseed_if_needed(using_sysrandom=False, secret_key="abc")
            # DID reseed
            self.assertNotEqual(state, random.getstate())
        finally:
            bokeh.util.session_id.random = saved

    def test_signature(self):
        sig = _signature("xyz", secret_key="abc")
        with_same_key = _signature("xyz", secret_key="abc")
        self.assertEqual(sig, with_same_key)
        with_different_key = _signature("xyz", secret_key="qrs")
        self.assertNotEqual(sig, with_different_key)

    def test_generate_unsigned(self):
        session_id = generate_session_id(signed=False)
        self.assertEqual(44, len(session_id))
        another_session_id = generate_session_id(signed=False)
        self.assertEqual(44, len(another_session_id))

        self.assertNotEqual(session_id, another_session_id)

    def test_generate_signed(self):
        session_id = generate_session_id(signed=True, secret_key="abc")
        self.assertTrue('-' in session_id)
        self.assertTrue(check_session_id_signature(session_id, secret_key="abc", signed=True))
        self.assertFalse(check_session_id_signature(session_id, secret_key="qrs", signed=True))

    def test_check_signature_of_unsigned(self):
        session_id = generate_session_id(signed=False, secret_key="abc") # secret shouldn't be used
        self.assertFalse(check_session_id_signature(session_id, secret_key="abc", signed=True))

    def test_check_signature_of_empty_string(self):
        self.assertFalse(check_session_id_signature("", secret_key="abc", signed=True))

    def test_check_signature_of_junk_with_hyphen_in_it(self):
        self.assertFalse(check_session_id_signature("foo-bar-baz", secret_key="abc", signed=True))

    def test_check_signature_with_signing_disabled(self):
        self.assertTrue(check_session_id_signature("gobbledygook", secret_key="abc", signed=False))

    def test_generate_secret_key(self):
        key = generate_secret_key()
        self.assertEqual(44, len(key))
        key2 = generate_secret_key()
        self.assertEqual(44, len(key2))
        self.assertNotEqual(key, key2)
