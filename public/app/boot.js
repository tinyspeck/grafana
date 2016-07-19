(function bootGrafana() {
  'use strict';

  var systemLocate = System.locate;
  System.locate = function(load) {
    var System = this;
    return Promise.resolve(systemLocate.call(this, load)).then(function(address) {
      return address + System.cacheBust;
    });
  };

  // Do not force a refresh of static assets
  // on every initial boot.
  //System.cacheBust = '?bust=' + Date.now();
  System.cacheBust = '';

  System.import('app/app').then(function(app) {
    app.default.init();
  }).catch(function(err) {
    console.log('Loading app module failed: ', err);
  });

})();
