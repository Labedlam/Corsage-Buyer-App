angular.module('orderCloud')
    .config(CartConfig)
    .controller('CartCtrl', CartController)
    .controller('MiniCartCtrl', MiniCartController)
    .directive('ordercloudMinicart', OrderCloudMiniCartDirective)
    .controller('MinicartModalController', MinicartModalController)
;

function CartConfig($stateProvider) {
    $stateProvider
        .state('cart', {
            parent: 'base',
            data: {componentName: 'Cart'},
            url: '/cart',
            templateUrl: 'cart/templates/cart.tpl.html',
            controller: 'CartCtrl',
            controllerAs: 'cart',
            resolve: {
                Order: function($rootScope, $q, $state, toastr, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function(order) {
                            dfd.resolve(order)
                        })
                        .catch(function() {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
                CurrentOrderResolve: function($state, Order) {
                    if (!Order) {
                        $state.go('home');
                    }
                },
                LineItemsList: function($q, $state, toastr, Underscore, OrderCloud, LineItemHelpers, Order) {
                    var dfd = $q.defer();
                    OrderCloud.LineItems.List(Order.ID)
                        .then(function(data) {
                            if (!data.Items.length) {
                                toastr.error('Your order does not contain any line items.', 'Error');
                                if ($state.current.name === 'cart') {
                                    $state.go('home');
                                }
                                dfd.reject();
                            }
                            else {
                                LineItemHelpers.GetProductInfo(data.Items)
                                    .then(function() {
                                        dfd.resolve(data);
                                    });
                            }
                        })
                        .catch(function() {
                            toastr.error('Your order does not contain any line items.', 'Error');
                            dfd.reject();
                        });
                    return dfd.promise;
                },
                PromotionsList: function(OrderCloud, Order) {
                    return OrderCloud.Orders.ListPromotions(Order.ID);
                }
            }
        });
}

function CartController($q, $rootScope, $timeout, OrderCloud, LineItemHelpers, Order, LineItemsList, PromotionsList) {
    var vm = this;
    vm.order = Order;
    vm.lineItems = LineItemsList;
    vm.promotions = PromotionsList;
    vm.removeItem = LineItemHelpers.RemoveItem;
    vm.pagingfunction = PagingFunction;

    vm.updateQuantity = function(cartOrder,lineItem) {
        $timeout.cancel();
        $timeout(function() {
            LineItemHelpers.UpdateQuantity(cartOrder,lineItem);
        },800);
    };

    function PagingFunction() {
        var dfd = $q.defer();
        if (vm.lineItems.Meta.Page < vm.lineItems.Meta.TotalPages) {
            OrderCloud.LineItems.List(vm.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.lineItems.Meta = data.Meta;
                    vm.lineItems.Items = [].concat(vm.lineItems.Items, data.Items);
                    LineItemHelpers.GetProductInfo(vm.lineItems.Items)
                        .then(function() {
                            dfd.resolve(vm.lineItems);
                        });
                });
        }
        else dfd.reject();
        return dfd.promise;
    }

    $rootScope.$on('OC:UpdateOrder', function(event, OrderID) {
        OrderCloud.Orders.Get(OrderID)
            .then(function(data) {
                vm.order = data;
            });
    });

    $rootScope.$on('OC:UpdateLineItem', function(event,Order) {
            OrderCloud.LineItems.List(Order.ID)
                .then(function(data) {
                    LineItemHelpers.GetProductInfo(data.Items)
                        .then(function() {
                            vm.lineItems = data;
                        });
                });
    });
}

function MiniCartController($q, $state, $rootScope,$uibModal, $ocMedia, OrderCloud, LineItemHelpers, CurrentOrder) {
    var vm = this;
    vm.LineItems = {};
    vm.Order = null;
    vm.showLineItems = false;
    vm.$ocMedia = $ocMedia;

    vm.getLI = function() {
        CurrentOrder.Get()
        .then(function(data) {
            vm.Order = data;
            if (data) vm.lineItemCall(data);
        });
    };

    vm.getLI();

    vm.checkForExpress = function() {
        var expressCheckout = false;
        angular.forEach($state.get(), function(state) {
            if (state.url && state.url == '/expressCheckout') {
                expressCheckout = true;
                return expressCheckout;
            }
        });
        return expressCheckout;
    };

    vm.checkForCheckout = function() {
        var checkout = false;
        angular.forEach($state.get(), function(state) {
            if (state.url && state.url == '/checkout') {
                checkout = true;
                return checkout;
            }
        });
        return checkout;
    };

    vm.goToCart = function() {
        $state.go('cart', {}, {reload: true});
    };

    vm.lineItemCall = function /*getLineItems*/(order) {
        var dfd = $q.defer();
        var queue = [];
        OrderCloud.LineItems.List(order.ID)
            .then(function(li) {
                vm.LineItems = li;
                if (li.Meta.TotalPages > li.Meta.Page) {
                        queue.push(OrderCloud.LineItems.List(order.ID, null ,li.Meta.Page + 1));
                }
                $q.all(queue)
                    .then(function(results) {
                        angular.forEach(results, function(result) {
                            vm.LineItems.Items = [].concat(vm.LineItems.Items, result.Items);
                            vm.LineItems.Meta = result.Meta;
                        });
                        dfd.resolve(LineItemHelpers.GetProductInfo(vm.LineItems.Items.reverse()));
                    });
            });
        return dfd.promise;
    };

    $rootScope.$on('LineItemAddedToCart', function() {
        CurrentOrder.Get()
            .then(function(order) {
                if (vm.$ocMedia('max-width:767px')) {
                    vm.openModal(order);
                } else {
                    vm.lineItemCall(order);
                    vm.showLineItems = true;
                }
            });
    });

    $rootScope.$on('OC:RemoveOrder', function() {//broadcast is in build > src > app > common > line items
        vm.Order = null;
        vm.LineItems = {};
    });

    vm.toggleDropdown = function($event) {
        // $event.preventDefault();
        // $event.stopPropagation();
        // $scope.status.isopen = !$scope.status.isopen;
        vm.showLineItems = true;
        if (vm.$ocMedia('max-width:767px')) {
            vm.goToCart();
        }
    };

    vm.openModal = function(order) {
        $uibModal.open({
            animation: true,
            size: 'lg',
            templateUrl: 'cart/templates/modalMinicart.tpl.html',
            controller: 'MinicartModalController',
            controllerAs: 'minicartModal',
            resolve: {
                LineItems: vm.lineItemCall(order)
            }
        });
    };
}

function OrderCloudMiniCartDirective() {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'cart/templates/minicart.tpl.html',
        controller: 'MiniCartCtrl',
        controllerAs: 'minicart'
    };
}

function MinicartModalController($state, $uibModalInstance, LineItems) {
    var vm = this;
    vm.lineItems = LineItems;
    vm.lineItemsLength = vm.lineItems.length;

    vm.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

    vm.goToCart = function() {
        $state.go('cart');
        $uibModalInstance.close();
    };

    vm.goToExpressCheckout = function() {
        $state.go('expressCheckout');
        $uibModalInstance.close();
    };

    vm.goToCheckout = function() {
        $state.go('checkout');
        $uibModalInstance.close();
    };
}

