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

function BuildYourOwnController (OrderCloud, Catalog) {

    // select type
// based off selection show the required options
// everytime you select an option populate the selected view

    var vm = this;
    vm.categories = Catalog;
    console.log(vm.categories);

    //type of Corsagage/boutonniere Selected
    vm.producttypeSelected = false;
    //object for products selected
    vm.itemCreated = {};
    //categories under type
    vm.typeCategories;
    //Could I make the type selection them button's instead of categories making unnecessary calls?
    // pass in the id of category to get  product type.
    //set product to selected array, so that it can be displayed
    vm.typeSelected = function (category) {

        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: category.ID}, 1)
            .then(function (data) {
                console.log("product", data);
                vm.producttypeSelected = true;
                vm.itemCreated.type = category.Name;
                vm.typeCategories = data.Items;
                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[0].ID}, 1)
                    .then(function (data) {
                        console.log("second call", data.Items);
                        vm.flowerOptions = data.Items;
                        $('#collapseOne').collapse();
                        $('#collapseTwo').collapse();
                    });
                // $('#headingOne').collapse();

                //what happens when there is no returned items? setup so there should be.... possible room for improvement

            })
            .catch(function () {

            });
    };

    vm.baseFlowerSelect = function(category){
    }

}

