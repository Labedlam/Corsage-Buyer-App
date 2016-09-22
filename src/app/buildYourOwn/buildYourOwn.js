
angular.module('orderCloud')
    .config(productGeneratorConfig)
    .controller('BuildYourOwnCtrl', BuildYourOwnController)
;

function productGeneratorConfig($stateProvider) {
    $stateProvider
        .state('buildYourOwn', {
            parent: 'base',
            url: '/buildYourOwn',
            data: {componentName: 'Build Your Own'},
            templateUrl: 'buildYourOwn/templates/buildYourOwn.tpl.html',
            controller: 'BuildYourOwnCtrl',
            controllerAs: 'buildYourOwn',
            resolve: {
                // Set the id of the category  into the first parameter into me.listCategories
                Catalog: function($q, OrderCloud) {
                    return OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: 3}, null );
                },
                Order: function($q, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function(order) {
                            dfd.resolve(order);
                        })
                        .catch(function() {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                }
            }
        });
}

function BuildYourOwnController (Catalog) {
    var vm = this;
    vm.categories = Catalog ;
    console.log(vm.categories);

}