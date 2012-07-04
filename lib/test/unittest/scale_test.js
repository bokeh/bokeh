(function() {

  test('test_interactive', function() {
    var data_source1, plot1;
    expect(0);
    data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
      data: [
        {
          x: 1,
          y: -2
        }, {
          x: 2,
          y: -3
        }, {
          x: 3,
          y: -4
        }, {
          x: 4,
          y: -5
        }, {
          x: 5,
          y: -6
        }
      ]
    }, {
      'local': true
    });
    plot1 = Bokeh.scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle');
    plot1.set({
      'render_loop': true
    });
    $('body').append("<div class='chartholder' id='mychart'></div>");
    $('body').append("<div class='chartholder' id='mychart2'></div>");
    window.myrender = function() {
      var view, view_orig;
      view_orig = new plot1.default_view({
        'model': plot1,
        'el': $('#mychart')
      });
      view_orig.render();
      window.view_orig = view_orig;
      view = new plot1.default_view({
        'model': plot1,
        'el': $('#mychart2'),
        'scale': 0.5
      });
      view.render();
      d3.select($('#mychart2 g')).attr('transform', 'scale(0.3, 0.3)');
      return window.view = view;
    };
    return _.defer(window.myrender);
  });

}).call(this);
