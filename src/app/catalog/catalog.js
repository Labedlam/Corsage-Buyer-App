angular.module('orderCloud')
    .config(CatalogConfig)
    .factory('AddToOrder', AddToOrder)
    .controller('CatalogCtrl', CatalogController)
    .directive('ordercloudCategoryList', CategoryListDirective)
    .directive('ordercloudProductList', ProductListDirective)
    .factory('CatalogTreeService', CatalogTreeService)
    .directive('catalogNode', CatalogNode)
    .directive('catalogTree', CatalogTree)
    .directive('ordercloudCatalogFacets', CatalogFacetsDirective)
    .factory('CatalogFacetsService', CatalogFacetsService)
;

function CatalogConfig($stateProvider) {
    $stateProvider
        .state('catalog', {
            parent: 'base',
            url: '/catalog',
            data: {componentName: 'Catalog'},
            templateUrl: 'catalog/templates/catalog.tpl.html',
            controller: 'CatalogCtrl',
            controllerAs: 'catalog',
            resolve: {
                Catalog: function($q, OrderCloud) {
                    return OrderCloud.Me.ListCategories(null, 1);
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

function AddToOrder($q, $rootScope, Underscore, OrderCloud, CurrentOrder, LineItemHelpers) {
    var service = {
        Add: _add
    };

    function _add(product) {
        var deferred = $q.defer();

        CurrentOrder.Get()
            .then(function(order) {
                CurrentOrder.GetLineItems(order.ID)
                    .then(function(lineItems) {
                        order.LineItems = lineItems;
                        AddLineItem(order, product);
                    });
            })
            .catch(function() {
                OrderCloud.Orders.Create({})
                    .then(function(order) {
                        CurrentOrder.Set(order.ID);
                        AddLineItem(order, product);
                    });
            });

        function AddLineItem(order, p) {
            var li = {
                ProductID: p.ID,
                Quantity: p.Quantity,
                Specs: LineItemHelpers.SpecConvert(p.Specs)
            };
            li.ShippingAddressID = isSingleShipping(order) ? getSingleShippingAddressID(order) : null;
            OrderCloud.LineItems.Create(order.ID, li).then(function(lineItem) {
                $rootScope.$broadcast('LineItemAddedToCart', order.ID, lineItem);
                deferred.resolve();
            });
        }

        function isSingleShipping(order) {
            return Underscore.pluck(order.LineItems, 'ShippingAddressID').length == 1;
        }

        function getSingleShippingAddressID(order) {
            return order.LineItems[0].ShippingAddressID;
        }

        return deferred.promise;
    }

    return service;
}



function CatalogController(Catalog, Order) {
    var vm = this;
    vm.showTree = true;
    vm.currentOrder = Order;
    vm.categories = Catalog;

    vm.toggleTree = function() {
        vm.showTree = !vm.showTree;
    };
}

function CategoryListDirective() {
    return {
        restrict: 'E',
        templateUrl: 'catalog/templates/category.list.tpl.html',
        scope: {
            categorylist: '='
        }
    };
}

function ProductListDirective() {
    return {
        restrict: 'E',
        templateUrl: 'catalog/templates/product.list.tpl.html',
        scope: {
            productlist: '='
        }
    };
}

function CatalogTreeService($q, Underscore, OrderCloud) {
    return {
        GetCatalogTree: _tree
    };

    function _tree() {
        var tree = [];
        var dfd = $q.defer();
        OrderCloud.Me.ListCategories(null, 1, 100, null, null, null, 'all')
            .then(function(list) {
                angular.forEach(Underscore.where(list.Items, {ParentID: null}), function(node) {
                    tree.push(getNode(node, list));
                });
                dfd.resolve(tree);
            });
        return dfd.promise;
    }

    function getNode(node, list) {
        var children = Underscore.where(list.Items, {ParentID: node.ID});
        if (children.length > 0) {
            node.children = children;
            angular.forEach(children, function(child) {
                return getNode(child, list);
            });
        }
        else {
            node.children = [];
        }
        return node;
    }
}

function CatalogTree($q, CatalogTreeService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            tree: '=?'
        },
        link: function(scope) {
            var d = $q.defer();
            if (scope.tree == undefined) {
                CatalogTreeService.GetCatalogTree().then(function(tree) {
                    scope.tree = tree;
                    d.resolve();
                });
            } else {
                d.resolve();
            }
            return d.promise;
        },
        template: "<ul class='nav nav-pills nav-stacked'><catalog-node ng-repeat='node in tree' node='node'></catalog-node></ul>"
    };
}

function CatalogNode($compile) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            node: '='
        },
        template: '<li ui-sref-active="active"><a ui-sref="catalog.category({categoryid:node.ID})" ng-bind-html="node.Name"></a></li>',
        link: function(scope, element) {
            if (angular.isArray(scope.node.children) && scope.node.children.length) {
                element.append("<catalog-tree tree='node.children' />");
                $compile(element.contents())(scope);
            }
        }
    };
}

function CatalogFacetsDirective($rootScope, $q, $stateParams, $state, Underscore, OrderCloud, CatalogFacetsService) {
    return {
        restrict: 'E',
        templateUrl: 'catalog/templates/catalogFacets.tpl.html',
        replace: true,
        link: function(scope) {
            function initFacets() {
                var dfd = $q.defer();
                if ($state.is('catalog.category') && $stateParams.categoryid) {
                    CatalogFacetsService.GetCategoryFacets($stateParams.categoryid)
                        .then(function(data) {
                            scope.facetList = data;
                            dfd.resolve();
                        });
                } else {
                    scope.facetList = null;
                    dfd.resolve();
                }
                return dfd.promise;
            }
            initFacets()
                .then(function() {
                    scope.$watch('facetList', function(n, o) {
                        if (!n || n === o) return;
                        var filterObj = {};
                        angular.forEach(n, function(facet, facetName) {
                            var filterKey = 'xp.OC_Facets.' + $stateParams.categoryid + '.' + facetName;
                            var filterValue = Underscore.keys(Underscore.pick(facet, function(value, key, object) {
                                return value;
                            })).join('|');

                            if (filterValue.length) {
                                filterObj[filterKey] = filterValue;
                            }
                        });
                        if (Underscore.keys(filterObj).length) {
                            OrderCloud.Products.List(null, 1, 100, null,null, filterObj)
                                .then(function(data) {
                                    $rootScope.$broadcast('OC:FacetsUpdated', data);
                                });
                        } else {
                            $rootScope.$broadcast('OC:FacetsUpdated', null);
                        }
                    }, true)
                });

            scope.$watch(function() {
                return $stateParams.categoryid;
            }, function(n, o) {
                initFacets();
            });
        }
    };
}

function CatalogFacetsService($q, OrderCloud) {
    return {
        GetCategoryFacets: _getCategoryFacets
    };

    function _getCategoryFacets(catID) {
        var dfd = $q.defer();
        OrderCloud.Categories.Get(catID)
            .then(function(category) {
                if (category.xp && category.xp.OC_Facets) {
                    var result = {};
                    angular.forEach(category.xp.OC_Facets, function(val, key) {
                        var facetValues = {};
                        angular.forEach(val.Values, function(value) {
                            facetValues[value] = false;
                        });
                        result[key] = facetValues;
                    });
                    dfd.resolve(result);
                }
                else {
                    dfd.resolve(null);
                }
            });
        return dfd.promise;
    }
}
