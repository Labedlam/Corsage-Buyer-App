angular.module('orderCloud')
    .config(ProductListConfig)
    .controller('ProductListCtrl', ProductListController)
;

function ProductListConfig($stateProvider) {
    $stateProvider
        .state('catalog.products', {
            url: '/products',
            templateUrl: 'catalog/products/templates/products.tpl.html',
            controller: 'ProductListCtrl',
            controllerAs: 'products'
        })
    ;
}

function ProductListController($q, OrderCloud) {
    var vm = this;
    vm.list = {
        Meta: {},
        Items: []
    };
    vm.searchfunction = Search;

    function Search(searchTerm) {
        var dfd = $q.defer();
        OrderCloud.Me.ListProducts(searchTerm)
            .then(function(data) {
                dfd.resolve(data);
            });
        return dfd.promise;
    }
}
