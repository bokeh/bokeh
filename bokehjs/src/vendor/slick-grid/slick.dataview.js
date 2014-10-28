(function ($) {
  $.extend(true, window, {
    Slick: {
      Data: {
        DataView: DataView,
        Aggregators: {
          Avg: AvgAggregator,
          Min: MinAggregator,
          Max: MaxAggregator,
          Sum: SumAggregator
        }
      }
    }
  });


  /***
   * A sample Model implementation.
   * Provides a filtered view of the underlying data.
   *
   * Relies on the data item having an "id" property uniquely identifying it.
   */
  function DataView(options) {
    var self = this;

    var defaults = {
      groupItemMetadataProvider: null,
      inlineFilters: false
    };


    // private
    var idProperty = "id";  // property holding a unique row id
    var items = [];         // data by index
    var rows = [];          // data by row
    var idxById = {};       // indexes by id
    var rowsById = null;    // rows by id; lazy-calculated
    var filter = null;      // filter function
    var updated = null;     // updated item ids
    var suspend = false;    // suspends the recalculation
    var sortAsc = true;
    var fastSortField;
    var sortComparer;
    var refreshHints = {};
    var prevRefreshHints = {};
    var filterArgs;
    var filteredItems = [];
    var compiledFilter;
    var compiledFilterWithCaching;
    var filterCache = [];

    // grouping
    var groupingInfoDefaults = {
      getter: null,
      formatter: null,
      comparer: function(a, b) { return a.value - b.value; },
      predefinedValues: [],
      aggregators: [],
      aggregateEmpty: false,
      aggregateCollapsed: false,
      aggregateChildGroups: false,
      collapsed: false,
      displayTotalsRow: true,
      lazyTotalsCalculation: false
    };
    var groupingInfos = [];
    var groups = [];
    var toggledGroupsByLevel = [];
    var groupingDelimiter = ':|:';

    var pagesize = 0;
    var pagenum = 0;
    var totalRows = 0;

    // events
    var onRowCountChanged = new Slick.Event();
    var onRowsChanged = new Slick.Event();
    var onPagingInfoChanged = new Slick.Event();

    options = $.extend(true, {}, defaults, options);


    function beginUpdate() {
      suspend = true;
    }

    function endUpdate() {
      suspend = false;
      refresh();
    }

    function setRefreshHints(hints) {
      refreshHints = hints;
    }

    function setFilterArgs(args) {
      filterArgs = args;
    }

    function updateIdxById(startingIndex) {
      startingIndex = startingIndex || 0;
      var id;
      for (var i = startingIndex, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined) {
          throw "Each data element must implement a unique 'id' property";
        }
        idxById[id] = i;
      }
    }

    function ensureIdUniqueness() {
      var id;
      for (var i = 0, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined || idxById[id] !== i) {
          throw "Each data element must implement a unique 'id' property";
        }
      }
    }

    function getItems() {
      return items;
    }

    function setItems(data, objectIdProperty) {
      if (objectIdProperty !== undefined) {
        idProperty = objectIdProperty;
      }
      items = filteredItems = data;
      idxById = {};
      updateIdxById();
      ensureIdUniqueness();
      refresh();
    }

    function setPagingOptions(args) {
      if (args.pageSize != undefined) {
        pagesize = args.pageSize;
        pagenum = pagesize ? Math.min(pagenum, Math.max(0, Math.ceil(totalRows / pagesize) - 1)) : 0;
      }

      if (args.pageNum != undefined) {
        pagenum = Math.min(args.pageNum, Math.max(0, Math.ceil(totalRows / pagesize) - 1));
      }

      onPagingInfoChanged.notify(getPagingInfo(), null, self);

      refresh();
    }

    function getPagingInfo() {
      var totalPages = pagesize ? Math.max(1, Math.ceil(totalRows / pagesize)) : 1;
      return {pageSize: pagesize, pageNum: pagenum, totalRows: totalRows, totalPages: totalPages};
    }

    function sort(comparer, ascending) {
      sortAsc = ascending;
      sortComparer = comparer;
      fastSortField = null;
      if (ascending === false) {
        items.reverse();
      }
      items.sort(comparer);
      if (ascending === false) {
        items.reverse();
      }
      idxById = {};
      updateIdxById();
      refresh();
    }

    /***
     * Provides a workaround for the extremely slow sorting in IE.
     * Does a [lexicographic] sort on a give column by temporarily overriding Object.prototype.toString
     * to return the value of that field and then doing a native Array.sort().
     */
    function fastSort(field, ascending) {
      sortAsc = ascending;
      fastSortField = field;
      sortComparer = null;
      var oldToString = Object.prototype.toString;
      Object.prototype.toString = (typeof field == "function") ? field : function () {
        return this[field]
      };
      // an extra reversal for descending sort keeps the sort stable
      // (assuming a stable native sort implementation, which isn't true in some cases)
      if (ascending === false) {
        items.reverse();
      }
      items.sort();
      Object.prototype.toString = oldToString;
      if (ascending === false) {
        items.reverse();
      }
      idxById = {};
      updateIdxById();
      refresh();
    }

    function reSort() {
      if (sortComparer) {
        sort(sortComparer, sortAsc);
      } else if (fastSortField) {
        fastSort(fastSortField, sortAsc);
      }
    }

    function setFilter(filterFn) {
      filter = filterFn;
      if (options.inlineFilters) {
        compiledFilter = compileFilter();
        compiledFilterWithCaching = compileFilterWithCaching();
      }
      refresh();
    }

    function getGrouping() {
      return groupingInfos;
    }

    function setGrouping(groupingInfo) {
      if (!options.groupItemMetadataProvider) {
        options.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      }

      groups = [];
      toggledGroupsByLevel = [];
      groupingInfo = groupingInfo || [];
      groupingInfos = (groupingInfo instanceof Array) ? groupingInfo : [groupingInfo];

      for (var i = 0; i < groupingInfos.length; i++) {
        var gi = groupingInfos[i] = $.extend(true, {}, groupingInfoDefaults, groupingInfos[i]);
        gi.getterIsAFn = typeof gi.getter === "function";

        // pre-compile accumulator loops
        gi.compiledAccumulators = [];
        var idx = gi.aggregators.length;
        while (idx--) {
          gi.compiledAccumulators[idx] = compileAccumulatorLoop(gi.aggregators[idx]);
        }

        toggledGroupsByLevel[i] = {};
      }

      refresh();
    }

    /**
     * @deprecated Please use {@link setGrouping}.
     */
    function groupBy(valueGetter, valueFormatter, sortComparer) {
      if (valueGetter == null) {
        setGrouping([]);
        return;
      }

      setGrouping({
        getter: valueGetter,
        formatter: valueFormatter,
        comparer: sortComparer
      });
    }

    /**
     * @deprecated Please use {@link setGrouping}.
     */
    function setAggregators(groupAggregators, includeCollapsed) {
      if (!groupingInfos.length) {
        throw new Error("At least one grouping must be specified before calling setAggregators().");
      }

      groupingInfos[0].aggregators = groupAggregators;
      groupingInfos[0].aggregateCollapsed = includeCollapsed;

      setGrouping(groupingInfos);
    }

    function getItemByIdx(i) {
      return items[i];
    }

    function getIdxById(id) {
      return idxById[id];
    }

    function ensureRowsByIdCache() {
      if (!rowsById) {
        rowsById = {};
        for (var i = 0, l = rows.length; i < l; i++) {
          rowsById[rows[i][idProperty]] = i;
        }
      }
    }

    function getRowById(id) {
      ensureRowsByIdCache();
      return rowsById[id];
    }

    function getItemById(id) {
      return items[idxById[id]];
    }

    function mapIdsToRows(idArray) {
      var rows = [];
      ensureRowsByIdCache();
      for (var i = 0, l = idArray.length; i < l; i++) {
        var row = rowsById[idArray[i]];
        if (row != null) {
          rows[rows.length] = row;
        }
      }
      return rows;
    }

    function mapRowsToIds(rowArray) {
      var ids = [];
      for (var i = 0, l = rowArray.length; i < l; i++) {
        if (rowArray[i] < rows.length) {
          ids[ids.length] = rows[rowArray[i]][idProperty];
        }
      }
      return ids;
    }

    function updateItem(id, item) {
      if (idxById[id] === undefined || id !== item[idProperty]) {
        throw "Invalid or non-matching id";
      }
      items[idxById[id]] = item;
      if (!updated) {
        updated = {};
      }
      updated[id] = true;
      refresh();
    }

    function insertItem(insertBefore, item) {
      items.splice(insertBefore, 0, item);
      updateIdxById(insertBefore);
      refresh();
    }

    function addItem(item) {
      items.push(item);
      updateIdxById(items.length - 1);
      refresh();
    }

    function deleteItem(id) {
      var idx = idxById[id];
      if (idx === undefined) {
        throw "Invalid id";
      }
      delete idxById[id];
      items.splice(idx, 1);
      updateIdxById(idx);
      refresh();
    }

    function getLength() {
      return rows.length;
    }

    function getItem(i) {
      var item = rows[i];

      // if this is a group row, make sure totals are calculated and update the title
      if (item && item.__group && item.totals && !item.totals.initialized) {
        var gi = groupingInfos[item.level];
        if (!gi.displayTotalsRow) {
          calculateTotals(item.totals);
          item.title = gi.formatter ? gi.formatter(item) : item.value;
        }
      }
      // if this is a totals row, make sure it's calculated
      else if (item && item.__groupTotals && !item.initialized) {
        calculateTotals(item);
      }

      return item;
    }

    function getItemMetadata(i) {
      var item = rows[i];
      if (item === undefined) {
        return null;
      }

      // overrides for grouping rows
      if (item.__group) {
        return options.groupItemMetadataProvider.getGroupRowMetadata(item);
      }

      // overrides for totals rows
      if (item.__groupTotals) {
        return options.groupItemMetadataProvider.getTotalsRowMetadata(item);
      }

      return null;
    }

    function expandCollapseAllGroups(level, collapse) {
      if (level == null) {
        for (var i = 0; i < groupingInfos.length; i++) {
          toggledGroupsByLevel[i] = {};
          groupingInfos[i].collapsed = collapse;
        }
      } else {
        toggledGroupsByLevel[level] = {};
        groupingInfos[level].collapsed = collapse;
      }
      refresh();
    }

    /**
     * @param level {Number} Optional level to collapse.  If not specified, applies to all levels.
     */
    function collapseAllGroups(level) {
      expandCollapseAllGroups(level, true);
    }

    /**
     * @param level {Number} Optional level to expand.  If not specified, applies to all levels.
     */
    function expandAllGroups(level) {
      expandCollapseAllGroups(level, false);
    }

    function expandCollapseGroup(level, groupingKey, collapse) {
      toggledGroupsByLevel[level][groupingKey] = groupingInfos[level].collapsed ^ collapse;
      refresh();
    }

    /**
     * @param varArgs Either a Slick.Group's "groupingKey" property, or a
     *     variable argument list of grouping values denoting a unique path to the row.  For
     *     example, calling collapseGroup('high', '10%') will collapse the '10%' subgroup of
     *     the 'high' group.
     */
    function collapseGroup(varArgs) {
      var args = Array.prototype.slice.call(arguments);
      var arg0 = args[0];
      if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
        expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
      } else {
        expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
      }
    }

    /**
     * @param varArgs Either a Slick.Group's "groupingKey" property, or a
     *     variable argument list of grouping values denoting a unique path to the row.  For
     *     example, calling expandGroup('high', '10%') will expand the '10%' subgroup of
     *     the 'high' group.
     */
    function expandGroup(varArgs) {
      var args = Array.prototype.slice.call(arguments);
      var arg0 = args[0];
      if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
        expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, false);
      } else {
        expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), false);
      }
    }

    function getGroups() {
      return groups;
    }

    function extractGroups(rows, parentGroup) {
      var group;
      var val;
      var groups = [];
      var groupsByVal = {};
      var r;
      var level = parentGroup ? parentGroup.level + 1 : 0;
      var gi = groupingInfos[level];

      for (var i = 0, l = gi.predefinedValues.length; i < l; i++) {
        val = gi.predefinedValues[i];
        group = groupsByVal[val];
        if (!group) {
          group = new Slick.Group();
          group.value = val;
          group.level = level;
          group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
          groups[groups.length] = group;
          groupsByVal[val] = group;
        }
      }

      for (var i = 0, l = rows.length; i < l; i++) {
        r = rows[i];
        val = gi.getterIsAFn ? gi.getter(r) : r[gi.getter];
        group = groupsByVal[val];
        if (!group) {
          group = new Slick.Group();
          group.value = val;
          group.level = level;
          group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
          groups[groups.length] = group;
          groupsByVal[val] = group;
        }

        group.rows[group.count++] = r;
      }

      if (level < groupingInfos.length - 1) {
        for (var i = 0; i < groups.length; i++) {
          group = groups[i];
          group.groups = extractGroups(group.rows, group);
        }
      }      

      groups.sort(groupingInfos[level].comparer);

      return groups;
    }

    function calculateTotals(totals) {
      var group = totals.group;
      var gi = groupingInfos[group.level];
      var isLeafLevel = (group.level == groupingInfos.length);
      var agg, idx = gi.aggregators.length;

      if (!isLeafLevel && gi.aggregateChildGroups) {
        // make sure all the subgroups are calculated
        var i = group.groups.length;
        while (i--) {
          if (!group.groups[i].initialized) {
            calculateTotals(group.groups[i]);
          }
        }
      }

      while (idx--) {
        agg = gi.aggregators[idx];
        agg.init();
        if (!isLeafLevel && gi.aggregateChildGroups) {
          gi.compiledAccumulators[idx].call(agg, group.groups);
        } else {
          gi.compiledAccumulators[idx].call(agg, group.rows);
        }
        agg.storeResult(totals);
      }
      totals.initialized = true;
    }

    function addGroupTotals(group) {
      var gi = groupingInfos[group.level];
      var totals = new Slick.GroupTotals();
      totals.group = group;
      group.totals = totals;
      if (!gi.lazyTotalsCalculation) {
        calculateTotals(totals);
      }
    }

    function addTotals(groups, level) {
      level = level || 0;
      var gi = groupingInfos[level];
      var groupCollapsed = gi.collapsed;
      var toggledGroups = toggledGroupsByLevel[level];      
      var idx = groups.length, g;
      while (idx--) {
        g = groups[idx];

        if (g.collapsed && !gi.aggregateCollapsed) {
          continue;
        }

        // Do a depth-first aggregation so that parent group aggregators can access subgroup totals.
        if (g.groups) {
          addTotals(g.groups, level + 1);
        }

        if (gi.aggregators.length && (
            gi.aggregateEmpty || g.rows.length || (g.groups && g.groups.length))) {
          addGroupTotals(g);
        }

        g.collapsed = groupCollapsed ^ toggledGroups[g.groupingKey];
        g.title = gi.formatter ? gi.formatter(g) : g.value;
      }
    } 

    function flattenGroupedRows(groups, level) {
      level = level || 0;
      var gi = groupingInfos[level];
      var groupedRows = [], rows, gl = 0, g;
      for (var i = 0, l = groups.length; i < l; i++) {
        g = groups[i];
        groupedRows[gl++] = g;

        if (!g.collapsed) {
          rows = g.groups ? flattenGroupedRows(g.groups, level + 1) : g.rows;
          for (var j = 0, jj = rows.length; j < jj; j++) {
            groupedRows[gl++] = rows[j];
          }
        }

        if (g.totals && gi.displayTotalsRow && (!g.collapsed || gi.aggregateCollapsed)) {
          groupedRows[gl++] = g.totals;
        }
      }
      return groupedRows;
    }

    function getFunctionInfo(fn) {
      var fnRegex = /^function[^(]*\(([^)]*)\)\s*{([\s\S]*)}$/;
      var matches = fn.toString().match(fnRegex);
      return {
        params: matches[1].split(","),
        body: matches[2]
      };
    }

    function compileAccumulatorLoop(aggregator) {
      var accumulatorInfo = getFunctionInfo(aggregator.accumulate);
      var fn = new Function(
          "_items",
          "for (var " + accumulatorInfo.params[0] + ", _i=0, _il=_items.length; _i<_il; _i++) {" +
              accumulatorInfo.params[0] + " = _items[_i]; " +
              accumulatorInfo.body +
          "}"
      );
      fn.displayName = fn.name = "compiledAccumulatorLoop";
      return fn;
    }

    function compileFilter() {
      var filterInfo = getFunctionInfo(filter);

      var filterBody = filterInfo.body
          .replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
          .replace(/return true\s*([;}]|$)/gi, "{ _retval[_idx++] = $item$; continue _coreloop; }$1")
          .replace(/return ([^;}]+?)\s*([;}]|$)/gi,
          "{ if ($1) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

      // This preserves the function template code after JS compression,
      // so that replace() commands still work as expected.
      var tpl = [
        //"function(_items, _args) { ",
        "var _retval = [], _idx = 0; ",
        "var $item$, $args$ = _args; ",
        "_coreloop: ",
        "for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
        "$item$ = _items[_i]; ",
        "$filter$; ",
        "} ",
        "return _retval; "
        //"}"
      ].join("");
      tpl = tpl.replace(/\$filter\$/gi, filterBody);
      tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
      tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

      var fn = new Function("_items,_args", tpl);
      fn.displayName = fn.name = "compiledFilter";
      return fn;
    }

    function compileFilterWithCaching() {
      var filterInfo = getFunctionInfo(filter);

      var filterBody = filterInfo.body
          .replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
          .replace(/return true\s*([;}]|$)/gi, "{ _cache[_i] = true;_retval[_idx++] = $item$; continue _coreloop; }$1")
          .replace(/return ([^;}]+?)\s*([;}]|$)/gi,
          "{ if ((_cache[_i] = $1)) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

      // This preserves the function template code after JS compression,
      // so that replace() commands still work as expected.
      var tpl = [
        //"function(_items, _args, _cache) { ",
        "var _retval = [], _idx = 0; ",
        "var $item$, $args$ = _args; ",
        "_coreloop: ",
        "for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
        "$item$ = _items[_i]; ",
        "if (_cache[_i]) { ",
        "_retval[_idx++] = $item$; ",
        "continue _coreloop; ",
        "} ",
        "$filter$; ",
        "} ",
        "return _retval; "
        //"}"
      ].join("");
      tpl = tpl.replace(/\$filter\$/gi, filterBody);
      tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
      tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

      var fn = new Function("_items,_args,_cache", tpl);
      fn.displayName = fn.name = "compiledFilterWithCaching";
      return fn;
    }

    function uncompiledFilter(items, args) {
      var retval = [], idx = 0;

      for (var i = 0, ii = items.length; i < ii; i++) {
        if (filter(items[i], args)) {
          retval[idx++] = items[i];
        }
      }

      return retval;
    }

    function uncompiledFilterWithCaching(items, args, cache) {
      var retval = [], idx = 0, item;

      for (var i = 0, ii = items.length; i < ii; i++) {
        item = items[i];
        if (cache[i]) {
          retval[idx++] = item;
        } else if (filter(item, args)) {
          retval[idx++] = item;
          cache[i] = true;
        }
      }

      return retval;
    }

    function getFilteredAndPagedItems(items) {
      if (filter) {
        var batchFilter = options.inlineFilters ? compiledFilter : uncompiledFilter;
        var batchFilterWithCaching = options.inlineFilters ? compiledFilterWithCaching : uncompiledFilterWithCaching;

        if (refreshHints.isFilterNarrowing) {
          filteredItems = batchFilter(filteredItems, filterArgs);
        } else if (refreshHints.isFilterExpanding) {
          filteredItems = batchFilterWithCaching(items, filterArgs, filterCache);
        } else if (!refreshHints.isFilterUnchanged) {
          filteredItems = batchFilter(items, filterArgs);
        }
      } else {
        // special case:  if not filtering and not paging, the resulting
        // rows collection needs to be a copy so that changes due to sort
        // can be caught
        filteredItems = pagesize ? items : items.concat();
      }

      // get the current page
      var paged;
      if (pagesize) {
        if (filteredItems.length < pagenum * pagesize) {
          pagenum = Math.floor(filteredItems.length / pagesize);
        }
        paged = filteredItems.slice(pagesize * pagenum, pagesize * pagenum + pagesize);
      } else {
        paged = filteredItems;
      }

      return {totalRows: filteredItems.length, rows: paged};
    }

    function getRowDiffs(rows, newRows) {
      var item, r, eitherIsNonData, diff = [];
      var from = 0, to = newRows.length;

      if (refreshHints && refreshHints.ignoreDiffsBefore) {
        from = Math.max(0,
            Math.min(newRows.length, refreshHints.ignoreDiffsBefore));
      }

      if (refreshHints && refreshHints.ignoreDiffsAfter) {
        to = Math.min(newRows.length,
            Math.max(0, refreshHints.ignoreDiffsAfter));
      }

      for (var i = from, rl = rows.length; i < to; i++) {
        if (i >= rl) {
          diff[diff.length] = i;
        } else {
          item = newRows[i];
          r = rows[i];

          if ((groupingInfos.length && (eitherIsNonData = (item.__nonDataRow) || (r.__nonDataRow)) &&
              item.__group !== r.__group ||
              item.__group && !item.equals(r))
              || (eitherIsNonData &&
              // no good way to compare totals since they are arbitrary DTOs
              // deep object comparison is pretty expensive
              // always considering them 'dirty' seems easier for the time being
              (item.__groupTotals || r.__groupTotals))
              || item[idProperty] != r[idProperty]
              || (updated && updated[item[idProperty]])
              ) {
            diff[diff.length] = i;
          }
        }
      }
      return diff;
    }

    function recalc(_items) {
      rowsById = null;

      if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
          refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
        filterCache = [];
      }

      var filteredItems = getFilteredAndPagedItems(_items);
      totalRows = filteredItems.totalRows;
      var newRows = filteredItems.rows;

      groups = [];
      if (groupingInfos.length) {
        groups = extractGroups(newRows);
        if (groups.length) {
          addTotals(groups);
          newRows = flattenGroupedRows(groups);
        }
      }

      var diff = getRowDiffs(rows, newRows);

      rows = newRows;

      return diff;
    }

    function refresh() {
      if (suspend) {
        return;
      }

      var countBefore = rows.length;
      var totalRowsBefore = totalRows;

      var diff = recalc(items, filter); // pass as direct refs to avoid closure perf hit

      // if the current page is no longer valid, go to last page and recalc
      // we suffer a performance penalty here, but the main loop (recalc) remains highly optimized
      if (pagesize && totalRows < pagenum * pagesize) {
        pagenum = Math.max(0, Math.ceil(totalRows / pagesize) - 1);
        diff = recalc(items, filter);
      }

      updated = null;
      prevRefreshHints = refreshHints;
      refreshHints = {};

      if (totalRowsBefore != totalRows) {
        onPagingInfoChanged.notify(getPagingInfo(), null, self);
      }
      if (countBefore != rows.length) {
        onRowCountChanged.notify({previous: countBefore, current: rows.length}, null, self);
      }
      if (diff.length > 0) {
        onRowsChanged.notify({rows: diff}, null, self);
      }
    }

    /***
     * Wires the grid and the DataView together to keep row selection tied to item ids.
     * This is useful since, without it, the grid only knows about rows, so if the items
     * move around, the same rows stay selected instead of the selection moving along
     * with the items.
     *
     * NOTE:  This doesn't work with cell selection model.
     *
     * @param grid {Slick.Grid} The grid to sync selection with.
     * @param preserveHidden {Boolean} Whether to keep selected items that go out of the
     *     view due to them getting filtered out.
     * @param preserveHiddenOnSelectionChange {Boolean} Whether to keep selected items
     *     that are currently out of the view (see preserveHidden) as selected when selection
     *     changes.
     * @return {Slick.Event} An event that notifies when an internal list of selected row ids
     *     changes.  This is useful since, in combination with the above two options, it allows
     *     access to the full list selected row ids, and not just the ones visible to the grid.
     * @method syncGridSelection
     */
    function syncGridSelection(grid, preserveHidden, preserveHiddenOnSelectionChange) {
      var self = this;
      var inHandler;
      var selectedRowIds = self.mapRowsToIds(grid.getSelectedRows());
      var onSelectedRowIdsChanged = new Slick.Event();

      function setSelectedRowIds(rowIds) {
        if (selectedRowIds.join(",") == rowIds.join(",")) {
          return;
        }

        selectedRowIds = rowIds;

        onSelectedRowIdsChanged.notify({
          "grid": grid,
          "ids": selectedRowIds
        }, new Slick.EventData(), self);
      }

      function update() {
        if (selectedRowIds.length > 0) {
          inHandler = true;
          var selectedRows = self.mapIdsToRows(selectedRowIds);
          if (!preserveHidden) {
            setSelectedRowIds(self.mapRowsToIds(selectedRows));       
          }
          grid.setSelectedRows(selectedRows);
          inHandler = false;
        }
      }

      grid.onSelectedRowsChanged.subscribe(function(e, args) {
        if (inHandler) { return; }
        var newSelectedRowIds = self.mapRowsToIds(grid.getSelectedRows());
        if (!preserveHiddenOnSelectionChange || !grid.getOptions().multiSelect) {
          setSelectedRowIds(newSelectedRowIds);
        } else {
          // keep the ones that are hidden
          var existing = $.grep(selectedRowIds, function(id) { return self.getRowById(id) === undefined; });
          // add the newly selected ones
          setSelectedRowIds(existing.concat(newSelectedRowIds));
        }
      });

      this.onRowsChanged.subscribe(update);

      this.onRowCountChanged.subscribe(update);

      return onSelectedRowIdsChanged;
    }

    function syncGridCellCssStyles(grid, key) {
      var hashById;
      var inHandler;

      // since this method can be called after the cell styles have been set,
      // get the existing ones right away
      storeCellCssStyles(grid.getCellCssStyles(key));

      function storeCellCssStyles(hash) {
        hashById = {};
        for (var row in hash) {
          var id = rows[row][idProperty];
          hashById[id] = hash[row];
        }
      }

      function update() {
        if (hashById) {
          inHandler = true;
          ensureRowsByIdCache();
          var newHash = {};
          for (var id in hashById) {
            var row = rowsById[id];
            if (row != undefined) {
              newHash[row] = hashById[id];
            }
          }
          grid.setCellCssStyles(key, newHash);
          inHandler = false;
        }
      }

      grid.onCellCssStylesChanged.subscribe(function(e, args) {
        if (inHandler) { return; }
        if (key != args.key) { return; }
        if (args.hash) {
          storeCellCssStyles(args.hash);
        }
      });

      this.onRowsChanged.subscribe(update);

      this.onRowCountChanged.subscribe(update);
    }

    $.extend(this, {
      // methods
      "beginUpdate": beginUpdate,
      "endUpdate": endUpdate,
      "setPagingOptions": setPagingOptions,
      "getPagingInfo": getPagingInfo,
      "getItems": getItems,
      "setItems": setItems,
      "setFilter": setFilter,
      "sort": sort,
      "fastSort": fastSort,
      "reSort": reSort,
      "setGrouping": setGrouping,
      "getGrouping": getGrouping,
      "groupBy": groupBy,
      "setAggregators": setAggregators,
      "collapseAllGroups": collapseAllGroups,
      "expandAllGroups": expandAllGroups,
      "collapseGroup": collapseGroup,
      "expandGroup": expandGroup,
      "getGroups": getGroups,
      "getIdxById": getIdxById,
      "getRowById": getRowById,
      "getItemById": getItemById,
      "getItemByIdx": getItemByIdx,
      "mapRowsToIds": mapRowsToIds,
      "mapIdsToRows": mapIdsToRows,
      "setRefreshHints": setRefreshHints,
      "setFilterArgs": setFilterArgs,
      "refresh": refresh,
      "updateItem": updateItem,
      "insertItem": insertItem,
      "addItem": addItem,
      "deleteItem": deleteItem,
      "syncGridSelection": syncGridSelection,
      "syncGridCellCssStyles": syncGridCellCssStyles,

      // data provider methods
      "getLength": getLength,
      "getItem": getItem,
      "getItemMetadata": getItemMetadata,

      // events
      "onRowCountChanged": onRowCountChanged,
      "onRowsChanged": onRowsChanged,
      "onPagingInfoChanged": onPagingInfoChanged
    });
  }

  function AvgAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.count_ = 0;
      this.nonNullCount_ = 0;
      this.sum_ = 0;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      this.count_++;
      if (val != null && val !== "" && val !== NaN) {
        this.nonNullCount_++;
        this.sum_ += parseFloat(val);
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.avg) {
        groupTotals.avg = {};
      }
      if (this.nonNullCount_ != 0) {
        groupTotals.avg[this.field_] = this.sum_ / this.nonNullCount_;
      }
    };
  }

  function MinAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.min_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        if (this.min_ == null || val < this.min_) {
          this.min_ = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.min) {
        groupTotals.min = {};
      }
      groupTotals.min[this.field_] = this.min_;
    }
  }

  function MaxAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.max_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        if (this.max_ == null || val > this.max_) {
          this.max_ = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.max) {
        groupTotals.max = {};
      }
      groupTotals.max[this.field_] = this.max_;
    }
  }

  function SumAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.sum_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        this.sum_ += parseFloat(val);
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.sum) {
        groupTotals.sum = {};
      }
      groupTotals.sum[this.field_] = this.sum_;
    }
  }

  // TODO:  add more built-in aggregators
  // TODO:  merge common aggregators in one to prevent needles iterating

})(jQuery);
