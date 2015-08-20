define([
  'lodash',
],
function (_) {
  'use strict';

  function InfluxSeries(options) {
    this.seriesList = options.seriesList;
    this.alias = options.alias;
    this.groupByField = options.groupByField;
    this.annotation = options.annotation;
  }

  var p = InfluxSeries.prototype;

  p.getTimeSeries = function() {
    var output = [];
    var self = this;
    var i;

    _.each(self.seriesList, function(series) {
      var seriesName;
      var timeCol = series.columns.indexOf('time');
      // SLACK_CHANGE - BEGIN
      var recordedTimeCol = series.columns.indexOf('client_time');
      var postedTimeCol = series.columns.indexOf('posted_time');
      // SLACK_CHANGE - END
      var valueCol = 1;
      var groupByCol = -1;

      if (self.groupByField) {
        groupByCol = series.columns.indexOf(self.groupByField);
      }

      // find value column
      _.each(series.columns, function(column, index) {
        if (column !== 'time' &&
          /* SLACK_CHANGE - BEGIN */
          column !== 'client_time' &&
          column !== 'posted_time' &&
          /* SLACK_CHANGE - END */
          column !== 'sequence_number' && column !== self.groupByField) {
          valueCol = index;
        }
      });

      var groups = {};

      if (self.groupByField) {
        groups = _.groupBy(series.points, function (point) {
          return point[groupByCol];
        });
      }
      else {
        groups[series.columns[valueCol]] = series.points;
      }

      _.each(groups, function(groupPoints, key) {
        var datapoints = [];
        for (i = 0; i < groupPoints.length; i++) {
          var metricValue = isNaN(groupPoints[i][valueCol]) ? null : groupPoints[i][valueCol];
          datapoints[i] = [metricValue, groupPoints[i][timeCol]];
          // SLACK_CHANGE - BEGIN
          if ((recordedTimeCol !== -1) && (postedTimeCol !== -1)) {
            datapoints[i][1] -= (groupPoints[i][postedTimeCol] - groupPoints[i][recordedTimeCol]);
          }
          // SLACK_CHANGE - END
        }

        seriesName = series.name + '.' + key;

        if (self.alias) {
          seriesName = self.createNameForSeries(series.name, key);
        }

        output.push({ target: seriesName, datapoints: datapoints });
      });
    });

    return output;
  };

  p.getAnnotations = function () {
    var list = [];
    var self = this;

    _.each(this.seriesList, function (series) {
      var titleCol = null;
      var timeCol = null;
      /* SLACK_CHANGE - BEGIN */
      var recordedTimeCol = null;
      var postedTimeCol = null;
      /* SLACK_CHANGE - END */
      var tagsCol = null;
      var textCol = null;

      _.each(series.columns, function(column, index) {
        if (column === 'time') { timeCol = index; return; }
        // SLACK_CHANGE - BEGIN
        if (column === 'client_time') { recordedTimeCol = index; return; }
        if (column === 'posted_time') { postedTimeCol = index; return; }
        // SLACK_CHANGE - END
        if (column === 'sequence_number') { return; }
        if (!titleCol) { titleCol = index; }
        if (column === self.annotation.titleColumn) { titleCol = index; return; }
        if (column === self.annotation.tagsColumn) { tagsCol = index; return; }
        if (column === self.annotation.textColumn) { textCol = index; return; }
      });

      _.each(series.points, function (point) {
        var data = {
          annotation: self.annotation,
          time: point[timeCol],
          title: point[titleCol],
          tags: point[tagsCol],
          text: point[textCol]
        };

        // SLACK_CHANGE - BEGIN
        if ((recordedTimeCol !== null) && (postedTimeCol !== null)) {
          data.time -= (point[postedTimeCol] - point[recordedTimeCol]);
        }
        // SLACK_CHANGE - END

        if (tagsCol) {
          data.tags = point[tagsCol];
        }

        list.push(data);
      });
    });

    return list;
  };

  p.createNameForSeries = function(seriesName, groupByColValue) {
    var regex = /\$(\w+)/g;
    var segments = seriesName.split('.');

    return this.alias.replace(regex, function(match, group) {
      if (group === 's') {
        return seriesName;
      }
      else if (group === 'g') {
        return groupByColValue;
      }
      var index = parseInt(group);
      if (_.isNumber(index) && index < segments.length) {
        return segments[index];
      }
      return match;
    });

  };

  return InfluxSeries;
});
