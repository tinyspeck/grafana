///<reference path="../../headers/common.d.ts" />

import './dashboard_loaders';

import angular from 'angular';
import coreModule from 'app/core/core_module';
import {BundleLoader} from './bundle_loader';

/** @ngInject **/
function setupAngularRoutes($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  var loadOrgBundle = new BundleLoader('app/features/org/all');
  var loadAppsBundle = new BundleLoader('app/features/apps/all');
  var loadAdminBundle = new BundleLoader('app/features/admin/admin');

  $routeProvider
  .when('/', {
    templateUrl: 'public/app/partials/dashboard.html',
    controller : 'LoadDashboardCtrl',
    reloadOnSearch: false,
    pageClass: 'page-dashboard',
  })
  .when('/dashboard/:type/:slug', {
    templateUrl: 'public/app/partials/dashboard.html',
    controller : 'LoadDashboardCtrl',
    reloadOnSearch: false,
    pageClass: 'page-dashboard',
  })
  .when('/dashboard-solo/:type/:slug', {
    templateUrl: 'public/app/features/panel/partials/soloPanel.html',
    controller : 'SoloPanelCtrl',
    pageClass: 'page-dashboard',
  })
  .when('/dashboard-import/:file', {
    templateUrl: 'public/app/partials/dashboard.html',
    controller : 'DashFromImportCtrl',
    reloadOnSearch: false,
    pageClass: 'page-dashboard',
  })
  .when('/dashboard/new', {
    templateUrl: 'public/app/partials/dashboard.html',
    controller : 'NewDashboardCtrl',
    reloadOnSearch: false,
    pageClass: 'page-dashboard',
  })
  .when('/import/dashboard', {
    templateUrl: 'public/app/features/dashboard/partials/import.html',
    controller : 'DashboardImportCtrl',
  })
  .when('/datasources', {
    templateUrl: 'public/app/features/datasources/partials/list.html',
    controller : 'DataSourcesCtrl',
    controllerAs: 'ctrl',
    resolve: loadOrgBundle,
  })
  .when('/datasources/edit/:id', {
    templateUrl: 'public/app/features/datasources/partials/edit.html',
    controller : 'DataSourceEditCtrl',
    resolve: loadOrgBundle,
  })
  .when('/datasources/new', {
    templateUrl: 'public/app/features/datasources/partials/edit.html',
    controller : 'DataSourceEditCtrl',
    resolve: loadOrgBundle,
  })
  .when('/hosts', {
    templateUrl: 'public/app/features/datasources/partials/hosts.html',
    controller : 'DataSourcesCtrl',
    controllerAs: 'ctrl'
    resolve: loadOrgBundle,
  })
  .when('/org', {
    templateUrl: 'public/app/features/org/partials/orgDetails.html',
    controller : 'OrgDetailsCtrl',
    resolve: loadOrgBundle,
  })
  .when('/org/new', {
    templateUrl: 'public/app/features/org/partials/newOrg.html',
    controller : 'NewOrgCtrl',
    resolve: loadOrgBundle,
  })
  .when('/org/users', {
    templateUrl: 'public/app/features/org/partials/orgUsers.html',
    controller : 'OrgUsersCtrl',
    controllerAs: 'ctrl',
    resolve: loadOrgBundle,
  })
  .when('/org/apikeys', {
    templateUrl: 'public/app/features/org/partials/orgApiKeys.html',
    controller : 'OrgApiKeysCtrl',
    resolve: loadOrgBundle,
  })
  .when('/profile', {
    templateUrl: 'public/app/features/profile/partials/profile.html',
    controller : 'ProfileCtrl',
  })
  .when('/profile/password', {
    templateUrl: 'public/app/features/profile/partials/password.html',
    controller : 'ChangePasswordCtrl',
  })
  .when('/profile/select-org', {
    templateUrl: 'public/app/features/profile/partials/select_org.html',
    controller : 'SelectOrgCtrl',
  })
  // ADMIN
  .when('/admin', {
    templateUrl: 'public/app/features/admin/partials/admin_home.html',
    controller : 'AdminHomeCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/settings', {
    templateUrl: 'public/app/features/admin/partials/settings.html',
    controller : 'AdminSettingsCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/users', {
    templateUrl: 'public/app/features/admin/partials/users.html',
    controller : 'AdminListUsersCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/users/create', {
    templateUrl: 'public/app/features/admin/partials/new_user.html',
    controller : 'AdminEditUserCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/users/edit/:id', {
    templateUrl: 'public/app/features/admin/partials/edit_user.html',
    controller : 'AdminEditUserCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/orgs', {
    templateUrl: 'public/app/features/admin/partials/orgs.html',
    controller : 'AdminListOrgsCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/orgs/edit/:id', {
    templateUrl: 'public/app/features/admin/partials/edit_org.html',
    controller : 'AdminEditOrgCtrl',
    resolve: loadAdminBundle,
  })
  .when('/admin/stats', {
    templateUrl: 'public/app/features/admin/partials/stats.html',
    controller : 'AdminStatsCtrl',
    controllerAs: 'ctrl',
    resolve: loadAdminBundle,
  })
  // LOGIN / SIGNUP
  .when('/login', {
    templateUrl: 'public/app/partials/login.html',
    controller : 'LoginCtrl',
  })
  .when('/invite/:code', {
    templateUrl: 'public/app/partials/signup_invited.html',
    controller : 'InvitedCtrl',
  })
  .when('/signup', {
    templateUrl: 'public/app/partials/signup_step2.html',
    controller : 'SignUpCtrl',
  })
  .when('/user/password/send-reset-email', {
    templateUrl: 'public/app/partials/reset_password.html',
    controller : 'ResetPasswordCtrl',
  })
  .when('/user/password/reset', {
    templateUrl: 'public/app/partials/reset_password.html',
    controller : 'ResetPasswordCtrl',
  })
  .when('/dashboard/snapshots', {
    templateUrl: 'public/app/features/snapshot/partials/snapshots.html',
    controller : 'SnapshotsCtrl',
    controllerAs: 'ctrl',
  })
  .when('/apps', {
    templateUrl: 'public/app/features/apps/partials/list.html',
    controller: 'AppListCtrl',
    controllerAs: 'ctrl',
    resolve: loadAppsBundle,
  })
  .when('/apps/:appId/edit', {
    templateUrl: 'public/app/features/apps/partials/edit.html',
    controller: 'AppEditCtrl',
    controllerAs: 'ctrl',
    resolve: loadAppsBundle,
  })
  .when('/apps/:appId/page/:slug', {
    templateUrl: 'public/app/features/apps/partials/page.html',
    controller: 'AppPageCtrl',
    controllerAs: 'ctrl',
    resolve: loadAppsBundle,
  })
  .when('/global-alerts', {
    templateUrl: 'public/app/features/dashboard/partials/globalAlerts.html',
  })
  .when('/styleguide', {
    controller: 'StyleGuideCtrl',
    controllerAs: 'ctrl',
    templateUrl: 'public/app/features/styleguide/styleguide.html',
  })
  .otherwise({
    templateUrl: 'public/app/partials/error.html',
    controller: 'ErrorCtrl'
  });
}

coreModule.config(setupAngularRoutes);
