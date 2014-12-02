
require [
  "common/base",
  "source/column_data_source",
], (base, ColumnDataSource) ->

  test('column_data_source_init', () ->
    r = new ColumnDataSource.Model()
    deepEqual(r.get("data"), {})
  )

  test('column_data_source_get_column', () ->
    r = new ColumnDataSource.Model()
    equal(r.get_column("foo"), null)

    r = new ColumnDataSource.Model({data: {"foo": [10]}})
    deepEqual(r.get_column("foo"), [10])
    equal(r.get_column("bar"), null)
  )

  test('column_data_source_get_length', () ->
    r = new ColumnDataSource.Model()
    equal(r.get_length(), null)

    r = new ColumnDataSource.Model({data:{"foo": []}})
    equal(r.get_length(), 0)

    r = new ColumnDataSource.Model({data:{"foo": [10]}})
    equal(r.get_length(), 1)

    r = new ColumnDataSource.Model({data:{"foo": [10, 20], "bar": [30, 40]}})
    equal(r.get_length(), 2)
  )

  test('column_data_source_columns', () ->
    r = new ColumnDataSource.Model({data:{}})
    deepEqual(r.columns(), [])

    r = new ColumnDataSource.Model({data:{"foo": []}})
    deepEqual(r.columns(), ["foo"])

    r = new ColumnDataSource.Model({data:{"foo": [10], "bar": [20]}})
    res = r.columns().sort()
    deepEqual(res, ["bar", "foo"])
  )

  test('column_data_source_datapoints', () ->
    r = new ColumnDataSource.Model()
    deepEqual(r.datapoints(), [])

    r = new ColumnDataSource.Model({data:{"foo": []}})
    deepEqual(r.datapoints(), [])

    r = new ColumnDataSource.Model({data:{"foo": [10]}})
    deepEqual(r.datapoints(), [{"foo": 10}])

    r = new ColumnDataSource.Model({data:{"foo": [10], "bar": [20]}})
    deepEqual(r.datapoints(), [{"foo": 10, "bar": 20}])

    r = new ColumnDataSource.Model({data:{"foo": [10, 20], "bar": [30, 40]}})
    deepEqual(r.datapoints(), [{"foo": 10, "bar": 30}, {"foo": 20, "bar": 40}])

  )
