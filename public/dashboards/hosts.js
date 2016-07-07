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

function expand_metrics(query){
  return graphite_request('/metrics/expand', ['query=' + query]);
};

function find_leafs(query){
  return expand_metrics(query + '&leavesOnly=1');
}

function find_all_metrics(query){
  var deferred = $.Deferred();
  var reqs = _.map([query+'.*', query+'.*.*', query+'.*.*.*', query+'.*.*.*.*' ], function(x) { return find_leafs(x); })
  $.when.apply($, reqs).done(function() {
    var metrics = [];
    _.each(arguments, function(x) {
      metrics = metrics.concat(x['results'])
    });
    deferred.resolve(metrics);
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
    tooltip: {shared: false},
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

  find_all_metrics(prefix).then(function(metrics) {
    var results = _.reject(metrics, function(metric){ return _.contains(metric, 'statsite') && _.contains(['www', 'job_queue', 'dev', 'staging'], metric.split('.')[2])});

    // Row titles are based on the 4th component of the
    // metric name.
    var rows = [];
    _.each(results, function(x) {
      var title = x.split('.')[4];
      var panelName = x.split('.').slice(4).join('.');

      if (title.startsWith('kv')) {
        title = panelName.split('.')[2];
        panelName = panelName.split('.').slice(3).join('.');
      } else if (x.startsWith('graphite')) {
        title = x.split('.')[2];
        panelName = x.split('.').slice(4).join('.');
      }

      if (!_.has(rows, title)) {
        rows[title] = [];
      }
      rows[title].push({'metric': x, 'panelName': panelName});
    });

    _.each(_.keys(rows), function(row) {
      dashboard.rows.push({
        title: row,
        panels: _.map(rows[row], function(x) { return default_panel(x['panelName'], x['metric'], host) }),
        collapse: true,
      });
    });
    callback(dashboard)
  });
}
