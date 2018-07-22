import bokeh.palettes as pal

def test_cmap_generator_function():
    assert pal.viridis(256) == pal.Viridis256
    assert pal.magma(256) == pal.Magma256
    assert pal.plasma(256) == pal.Plasma256
    assert pal.inferno(256) == pal.Inferno256
    assert pal.gray(256) == pal.Greys256
    assert pal.grey(256) == pal.Greys256

def test_palettes_immutability():
    Magma7 = pal.Magma7[:]
    pal.Magma7.reverse()
    assert pal.Magma7 == Magma7

def test_all_palettes___palettes__():
    assert sum(len(p) for p in pal.all_palettes.values()) == len(pal.__palettes__)

def test_palettes_dir():
    assert 'viridis' in dir(pal)
    assert not '__new__' in dir(pal)
