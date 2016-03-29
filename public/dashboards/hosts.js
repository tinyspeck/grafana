'use strict';

// accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

var collector = '*';
var host = 'slack-shard333b';
var cluster = '*';
var az = '*';

if (!_.isUndefined(ARGS.host)) {
  host = ARGS.host;
}

if (!_.isUndefined(ARGS.cluster)) {
  cluster = ARGS.cluster;
}

if (!_.isUndefined(ARGS.az)) {
  az = ARGS.az;
}

if (!_.isUndefined(ARGS.collector)) {
  az = ARGS.collector;
}

function graphite_request(uri, params){
  var deferred = $.Deferred();
  var http_params = params.join('&');
  var url = '/api/datasources/proxy/1' + uri + '?' + http_params;

  $.getJSON(url)
    .done(function(data) {
      deferred.resolve(data);
    }).fail(function(jqxh, textStatus, error) {
      $.getJSON(url)
        .done(function(data) {
          deferred.resolve(data);
        }).fail(function() {
          deferred.resolve();
        });
  });

  return deferred.promise();
}

function find_metrics(query){
  return graphite_request('/metrics/find', ['query=' + query]);
};

function find_all_metrics(query){
  var deferred = $.Deferred();
  find_metrics(query).then(function(paths) {
    var leaves = _.filter(paths, function(x) { return x['leaf'] });
    var non_leaves = _.filter(paths, function(x) { return !x['leaf'] });
    if (_.isEmpty(non_leaves)) {
      deferred.resolve(leaves);
    } else {
      $.when.apply($, _.map(non_leaves, function(x) { return find_all_metrics(x['id'] + '.*') })).done(function(x) {
        deferred.resolve(leaves.concat(x));
      });
    }
  });
  return deferred.promise();
};

function default_panel(title, prefix, host){
  return {
    title: title,
    type: 'graph',
    datasource: 'graphite',
    span: 4,
    line: true,
    linewidth: 2,
    editable: true,
    nullPointMode: "connected",
    targets: [{
      "target": "aliasByNode(" + prefix + ", 3)"
    }],
    legend: {show: false},
  };
};

function default_row(title){
  return {
    title: title,
    height: '250px',
  }
};

return function(callback) {
  var dashboard;

  var prefix = [collector, az, cluster, host].join('.');
  dashboard = {
    rows: [],
  };

  dashboard.title = host;
  dashboard.editable = true;

  find_metrics(prefix +'.*').then(function(metrics) {
    var promises = _.map(metrics, function(m) { return find_all_metrics(m['id']) });
    $.when.apply($, promises).done(function() {
      for (var index = 0; index < metrics.length; index++) {
        var metric = metrics[index];
        dashboard.rows.push({
          title: metric["text"],
          panels: _.map(arguments[index], function(x) { return default_panel(x['text'], x['id'], host) }),
          collapse: true,
        });
      }
      callback(dashboard)
    });
  });
}
