$(document).ready(function(){
    $('body').on('click', '.x-dropdown', function(){
        $('.x-drop').toggle();
    });
    $('body').on('click', '.y-dropdown', function(){
        $('.y-drop').toggle();
    });
    $('body').on('click', '.series-dropdown', function(){
        $('.legend-body').hide();
        $('.series-drop').toggle();
    });
    $('body').on('click', '.explode-dropdown', function(){
        $('.explode-drop').toggle();
    });
    $('body').on('click', '.filters-dropdown', function(){
        $('.filter-head').toggle();
        $('.filters-update').toggle();
        $('.select-all-none').hide();
        $('.filter').hide();
    });
    $('body').on('click', '.filter-head', function(){
        if($(this).next('.select-all-none').length == 0){
            $(this).after('<div class="select-all-none"><span class="select-all select-opt">All</span>|<span class="select-none select-opt">None</span>');
        }else{
            $(this).next(".select-all-none").toggle();
        }
        $(this).next(".select-all-none").next(".filter").toggle();
    });
    $('body').on('click', '.adjust-dropdown', function(){
        $('.adjust-drop').toggle();
    });
    $('body').on('click', '.select-opt', function(){
        var checked_bool = $(this).hasClass('select-all') ? true: false;
        $(this).parent().next('.bk-widget').find('.bk-bs-checkbox input').prop( "checked", checked_bool);
        $(this).parent().next('.bk-widget').find('.bk-bs-checkbox input').first().click();
        $(this).parent().next('.bk-widget').find('.bk-bs-checkbox input').first().click();
    });
    $('body').on('click', '.legend-header', function(){
        $(this).next('.legend-body').toggle();
    });

    $('body').on('click', '.export-config', function(){
        var wdg_obj = {}
        $('select, input[type=text]').each(function(){
            var wdg_name = $(this).parent().attr('class').match(/wdgkey-([^ ]*)/)[1];
            var selected_val = $(this).val();
            wdg_obj[wdg_name] = selected_val;
        });
        $('.filter').each(function(){
            var wdg_name = $(this).attr('class').match(/wdgkey-([^ ]*)/)[1];
            wdg_obj[wdg_name] = []
            $(this).find('input').each(function(){
                if($(this).is(":checked")){
                    wdg_obj[wdg_name].push(parseInt($(this).attr('value')));
                }
            });
        });
        var widgets_string = encodeURIComponent(JSON.stringify(wdg_obj));
        var pathname = window.location.pathname.replace('/',''); //remove just the first slash
        window.history.pushState({}, "", pathname+"?widgets=" + widgets_string);
    });
});
