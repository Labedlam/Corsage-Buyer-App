angular.module('orderCloud')
    .directive('ordercloudProductQuickView', ordercloudProductQuickViewDirective)
    .controller('ProductQuickViewCtrl', ProductQuickViewController)
    .controller ('ProductQuickViewModalCtrl', ProductQuickViewModalController)
;

function ordercloudProductQuickViewDirective() {
    return {
        scope:{
            product: '='
        },
        restrict: 'E',
        templateUrl: 'catalog/productQuickView/templates/catalogSearch.quickview.tpl.html',
        controller: 'ProductQuickViewCtrl',
        controllerAs: 'productQuickView'
    }
}

function ProductQuickViewController($uibModal) {
    var vm = this;
    vm.open = function(product) {
        $uibModal.open({
            animation: true,
            size: 'lg',
            templateUrl: 'catalog/productQuickView/templates/catalogSearch.quickviewModal.tpl.html',
            controller: 'ProductQuickViewModalCtrl',
            controllerAs: 'productQuickViewModal',

            resolve: {
                SelectedProduct: function(OrderCloud) {
                    return OrderCloud.Me.GetProduct(product.ID);
                },
                SpecList: function($q, OrderCloud) {
                    var queue = [];
                    var dfd = $q.defer();
                    OrderCloud.Specs.ListProductAssignments(null, product.ID)
                        .then(function(data) {
                            angular.forEach(data.Items, function(assignment) {
                                queue.push(OrderCloud.Specs.Get(assignment.SpecID));
                            });
                            $q.all(queue)
                                .then(function(result) {
                                    var specOptionsQueue = [];
                                    angular.forEach(result, function(spec) {
                                        spec.Value = spec.DefaultValue;
                                        spec.OptionID = spec.DefaultOptionID;
                                        spec.Options = [];
                                        if (spec.OptionCount) {
                                            specOptionsQueue.push((function() {
                                                var d = $q.defer();
                                                OrderCloud.Specs.ListOptions(spec.ID, null, 1, spec.OptionCount)
                                                    .then(function(optionData) {
                                                        spec.Options = optionData.Items;
                                                        d.resolve();
                                                    });
                                                return d.promise;
                                            })());
                                        }
                                    });
                                    $q.all(specOptionsQueue).then(function() {
                                        dfd.resolve(result);
                                    });
                                });
                        })
                        .catch(function(response) {

                        });
                    return dfd.promise;
                }
            }
        });
    };
}

function ProductQuickViewModalController($uibModalInstance, SelectedProduct, SpecList, AddToOrder) {
    var vm = this;
    vm.selectedProduct = SelectedProduct;
    vm.selectedProduct.item = {Specs: SpecList};

    vm.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

    vm.addToCart = function(product) {
        product.Quantity = product.item.Quantity;
        product.Specs = product.item.Specs;
        AddToOrder.Add(product).then(function() {
            $uibModalInstance.close()
        });
    };
}