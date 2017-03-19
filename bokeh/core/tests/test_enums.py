import bokeh.core.enums as enums

def test_Enumeration_default():
    e = enums.Enumeration()
    assert e.__slots__ == ()

def test_enumeration_basic():
    e = enums.enumeration("foo", "bar", "baz")
    assert isinstance(e, enums.Enumeration)
    assert str(e) == "Enumeration(foo, bar, baz)"
    assert [x for x in e] == ["foo", "bar", "baz"]
    for x in ["foo", "bar", "baz"]:
        assert x in e
    assert "junk" not in e

def test_enumeration_case():
    e = enums.enumeration("foo", "bar", "baz", case_sensitive=False)
    assert isinstance(e, enums.Enumeration)
    assert str(e) == "Enumeration(foo, bar, baz)"
    assert [x for x in e] == ["foo", "bar", "baz"]
    for x in ["foo", "FOO", "bar", "bAr", "baz", "BAZ"]:
        assert x in e
    assert "junk" not in e

def test_enumeration_default():
    # this is private but used by properties
    e = enums.enumeration("foo", "bar", "baz")
    assert e._default == "foo"

# This can be removed when deprecation is complete
def test_accept_left_right_center():
    assert enums.accept_left_right_center("left_center") == "center_left"
    assert enums.accept_left_right_center("right_center") == "center_right"

# any changes to contents of enums.py easily trackable here
def test_enums_contents():
    assert [x for x in dir(enums) if x[0].isupper()] == [
        'Aggregation',
        'Anchor',
        'AngleUnits',
        'ButtonType',
        'DashPattern',
        'DateFormat',
        'DatetimeUnits',
        'DeprecatedAnchor',
        'DeprecatedLegendLocation',
        'Dimension',
        'Dimensions',
        'Direction',
        'Enumeration',
        'FontStyle',
        'HorizontalLocation',
        'JitterRandomDistribution',
        'LatLon',
        'LegendClickPolicy',
        'LegendLocation',
        'LineCap',
        'LineDash',
        'LineJoin',
        'Location',
        'MapType',
        'NamedColor',
        'NumeralLanguage',
        'Orientation',
        'Palette',
        'RenderLevel',
        'RenderMode',
        'RoundingFunction',
        'SizingMode',
        'SliderCallbackPolicy',
        'SortDirection',
        'SpatialUnits',
        'StartEnd',
        'StepMode',
        'TextAlign',
        'TextBaseline',
        'VerticalLocation',
    ]
