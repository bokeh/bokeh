import bokeh.command as command

def test_doc():
    import bokeh.command.subcommands as sc
    assert len(command.__doc__.split("\n")) == 5 + 3*len(sc.all)
    for x in sc.all:
        assert (x.name + "\n    " + x.help) in command.__doc__
