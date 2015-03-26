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

module.exports = {
  Avg: AvgAggregator,
  Min: MinAggregator,
  Max: MaxAggregator,
  Sum: SumAggregator
};
