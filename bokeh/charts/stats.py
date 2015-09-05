from __future__ import absolute_import

from bokeh.properties import HasProps, Float, Either, String, Date, Datetime, Int, Bool

from ._properties import Column, EitherColumn


class Stat(HasProps):

    data = EitherColumn(Column(Float), Column(Int), Column(String),
                  Column(Date), Column(Datetime), Column(Bool), default=None)
    value = Float()

    def __init__(self, **properties):
        super(Stat, self).__init__(**properties)
        if self.data is not None:
            self.calculate()

    def set_data(self, data):
        # ToDo: checking if equal by props fails here
        if data is not None:
            self.data = data

    def calculate(self, data=None):
        self.set_data(data)
        return self.agg()

    def agg(self):
        return None


class Sum(Stat):

    def agg(self):
        self.value = self.data.sum()
        return self.value


class Mean(Stat):

    def agg(self):
        self.value = self.data.mean()
        return self.value


class Count(Stat):

    def agg(self):
        self.value = self.data.count()
        return self.value


class CountDistinct(Stat):

    def agg(self):
        self.value = self.data.nunique()
        return self.value


class Median(Stat):

    def agg(self):
        self.value = self.data.median()
        return self.value


class StdDeviation(Stat):

    def agg(self):
        self.value = self.data.std()
        return self.value


class Min(Stat):
    def agg(self):
        self.value = self.data.min()
        return self.value


class Max(Stat):
    def agg(self):
        self.value = self.data.max()
        return self.value


class Quantile(Stat):
    interval = Float(default=0.5)
    value = Float()

    def calculate(self, data=None):
        self.set_data(data)
        self.value = self.data.quantile(self.interval)
        return self.value


class Quartile(Stat):
    q1 = Float()
    q2 = Float()
    q3 = Float()

    def calculate(self, data=None):
        self.set_data(data)

        quartiles = self.data.quantile([0.25, 0.5, 0.75])
        self.q1, self.q2, self.q3 = quartiles

stats = {
    'sum': Sum,
    'mean': Mean,
    'count': Count,
    'nunique': CountDistinct,
    'median': Median,
    'stddev': StdDeviation,
    'min': Min,
    'max': Max,
    'quantile': Quantile,
    'quartile': Quartile

}