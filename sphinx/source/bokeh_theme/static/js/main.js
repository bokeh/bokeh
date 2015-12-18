$(document).ready(function() {
  var menuToggle = $('#js-mobile-menu').unbind();
  $('#js-navigation-menu').removeClass("show");

  menuToggle.on('click', function(e) {
    e.preventDefault();
    $('#js-navigation-menu').slideToggle(function(){
      if($('#js-navigation-menu').is(':hidden')) {
        $('#js-navigation-menu').removeAttr('style');
      }
    });
  });

  var loc = window.location.pathname;

  if (loc.split('docs/').length == 1 ) {
    // If index.html only show top-level toc
    $('.toc .toctree-l1').addClass('hide');
    $('.toc').addClass('obfuscate');

  } else {
    // Else, selectively hide toc
    var loc_part = loc.split('docs/')[1].split('.html')[0];

    if (loc_part.split('/').length > 1) {
      loc_part = loc_part.split('/')[0]
    }

    var l1_links = $('.toctree-l1');
    l1_links.each(function(i, l1_link) {
      if ( $(this).hasClass('current') ) {
        $(this).addClass('show');
      } else {
        var href = l1_link.childNodes[0].href;
        var href_part = href.split('docs/')[1].split('/')[0];
        if (href_part == loc_part) {
          $(this).addClass('show');
        } else {
          $(this).addClass('hide');
        }
      }
    });

    var nav_links = $('.navigation.doc .nav-link a');
    nav_links.each(function(i, nav_link) {
      var href = nav_link.href;
      var href_part = href.split('docs/')[1].split('.html')[0];
      if (href_part.split('/').length > 1) {
        href_part = href_part.split('/')[0]
      }
      if (loc_part == href_part) {
        $(this).addClass('current');
      }
    });
  }

});

