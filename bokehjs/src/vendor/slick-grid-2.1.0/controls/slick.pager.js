var $ = require("jquery");
var Slick = require("../slick.core");
function SlickGridPager(dataView, grid, $container) {
  var $status;

  function init() {
    dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
      updatePager(pagingInfo);
    });

    constructPagerUI();
    updatePager(dataView.getPagingInfo());
  }

  function getNavState() {
    var cannotLeaveEditMode = !Slick.GlobalEditorLock.commitCurrentEdit();
    var pagingInfo = dataView.getPagingInfo();
    var lastPage = pagingInfo.totalPages - 1;

    return {
      canGotoFirst: !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
      canGotoLast: !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum != lastPage,
      canGotoPrev: !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
      canGotoNext: !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum < lastPage,
      pagingInfo: pagingInfo
    }
  }

  function setPageSize(n) {
    dataView.setRefreshHints({
      isFilterUnchanged: true
    });
    dataView.setPagingOptions({pageSize: n});
  }

  function gotoFirst() {
    if (getNavState().canGotoFirst) {
      dataView.setPagingOptions({pageNum: 0});
    }
  }

  function gotoLast() {
    var state = getNavState();
    if (state.canGotoLast) {
      dataView.setPagingOptions({pageNum: state.pagingInfo.totalPages - 1});
    }
  }

  function gotoPrev() {
    var state = getNavState();
    if (state.canGotoPrev) {
      dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum - 1});
    }
  }

  function gotoNext() {
    var state = getNavState();
    if (state.canGotoNext) {
      dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum + 1});
    }
  }

  function constructPagerUI() {
    $container.empty();

    var $nav = $("<span class='bk-slick-pager-nav' />").appendTo($container);
    var $settings = $("<span class='bk-slick-pager-settings' />").appendTo($container);
    $status = $("<span class='bk-slick-pager-status' />").appendTo($container);

    $settings
        .append("<span class='bk-slick-pager-settings-expanded' style='display:none'>Show: <a data=0>All</a><a data='-1'>Auto</a><a data=25>25</a><a data=50>50</a><a data=100>100</a></span>");

    $settings.find("a[data]").click(function (e) {
      var pagesize = $(e.target).attr("data");
      if (pagesize != undefined) {
        if (pagesize == -1) {
          var vp = grid.getViewport();
          setPageSize(vp.bottom - vp.top);
        } else {
          setPageSize(parseInt(pagesize));
        }
      }
    });

    var icon_prefix = "<span class='bk-ui-state-default bk-ui-corner-all bk-ui-icon-container'><span class='bk-ui-icon ";
    var icon_suffix = "' /></span>";

    $(icon_prefix + "bk-ui-icon-lightbulb" + icon_suffix)
        .click(function () {
          $(".bk-slick-pager-settings-expanded").toggle()
        })
        .appendTo($settings);

    $(icon_prefix + "bk-ui-icon-seek-first" + icon_suffix)
        .click(gotoFirst)
        .appendTo($nav);

    $(icon_prefix + "bk-ui-icon-seek-prev" + icon_suffix)
        .click(gotoPrev)
        .appendTo($nav);

    $(icon_prefix + "bk-ui-icon-seek-next" + icon_suffix)
        .click(gotoNext)
        .appendTo($nav);

    $(icon_prefix + "bk-ui-icon-seek-end" + icon_suffix)
        .click(gotoLast)
        .appendTo($nav);

    $container.find(".bk-ui-icon-container")
        .hover(function () {
          $(this).toggleClass("bk-ui-state-hover");
        });

    $container.children().wrapAll("<div class='bk-slick-pager' />");
  }


  function updatePager(pagingInfo) {
    var state = getNavState();

    $container.find(".bk-slick-pager-nav span").removeClass("bk-ui-state-disabled");
    if (!state.canGotoFirst) {
      $container.find(".bk-ui-icon-seek-first").addClass("bk-ui-state-disabled");
    }
    if (!state.canGotoLast) {
      $container.find(".bk-ui-icon-seek-end").addClass("bk-ui-state-disabled");
    }
    if (!state.canGotoNext) {
      $container.find(".bk-ui-icon-seek-next").addClass("bk-ui-state-disabled");
    }
    if (!state.canGotoPrev) {
      $container.find(".bk-ui-icon-seek-prev").addClass("bk-ui-state-disabled");
    }

    if (pagingInfo.pageSize == 0) {
      var totalRowsCount = dataView.getItems().length;
      var visibleRowsCount = pagingInfo.totalRows;
      if (visibleRowsCount < totalRowsCount) {
        $status.text("Showing " + visibleRowsCount + " of " + totalRowsCount + " rows");
      } else {
        $status.text("Showing all " + totalRowsCount + " rows");
      }
      $status.text("Showing all " + pagingInfo.totalRows + " rows");
    } else {
      $status.text("Showing page " + (pagingInfo.pageNum + 1) + " of " + pagingInfo.totalPages);
    }
  }

  init();
}

module.exports = Slick.Controls.Pager;
