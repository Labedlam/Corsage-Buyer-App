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
                Catalog: function ($q, OrderCloud) {
                    return OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: 3}, null);
                },
                Order: function ($q, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function (order) {
                            dfd.resolve(order);
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                }
            }
        });
}

function BuildYourOwnController(OrderCloud, Catalog, Underscore) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options
    //TODO: Create reset functionality


    var vm = this;
    vm.categories = Catalog;
    vm.requirementsMetForMVP = false;



    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    //categories under type
    vm.typeCategories;
    //Price Array to hold the cost of all options selected
    vm.itemCreated.price = [];

    //type of Corsagage/boutonniere Selected
    vm.producttypeSelected = false;
    // Varaibles to indicated whether a specific option has been selected or not
    vm.flowerSelected;
    vm.ribbonSelected;
    //Initialize ribbon color to show , it will be hidden depending on which product type is selected.
    vm.showRibbonColor = true;


    // pass in the id of category to get  product type.
    //set product to selected array, so that it can be displayed

/*-----------Variable__Selected--------------------------------------------
     Functions for each specific Choice Made available to the User----------
     These functions are triggered when User Clicks/Selects and Option
 --------------------------------------------------------------------*/
    vm.typeSelected = function (category) {

        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: category.ID}, 1)
        //if they change type clear the previously selected data
            .then(function (data) {
                vm.producttypeSelected = true;
                vm.itemCreated.type = category.Name;
                vm.typeCategories = data.Items;
                vm.showRibbonColor = ['Pin-On Corsage', 'Wristlet Corsage'].indexOf(category.Name) > -1;
                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[0].ID}, 1)
                    .then(function (data) {

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

    vm.baseFlowerSelected = function (flower) {
        //when a new flower is added or replaced . it needs to get replaced in the array

        vm.itemCreated.baseFlower = flower.Name;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, flower.ID)
            .then(function (data) {

                vm.flowerColorChoice = data.Items;
                // $('#collapseTwo').collapse();
                $('#collapseThree').collapse();

            })
    };

    vm.flowerColorSelected = function (flowerColor) {
        var model = {
            price: flowerColor.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "flowerColor"
        };

        vm.flowerSelected == undefined || vm.flowerSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.flowerSelected = true;
        vm.itemCreated.flowerColor = flowerColor.Name;
        vm.itemCreated.flowerPrice = flowerColor.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, vm.typeCategories[1].ID)
            .then(function (data) {
                console.log(data);
                vm.ribbonChoice = data.Items;
            });

    };

    vm.ribbonColorSelected = function (ribbon) {
        var model = {
            price: ribbon.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "ribbon"
        };

        vm.ribbonSelected == undefined || vm.ribbonSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.ribbonSelected = true;
        vm.itemCreated.ribbonColor = ribbon.Name;
        vm.itemCreated.ribbonPrice = ribbon.StandardPriceSchedule.PriceBreaks[0].Price;


    };


    /* ------------------------------------------*/
    // triggers whenever a Variable_ Selected Option is Clicked for the first time
    function addPriceToTotal(modelOfProduct) {
        var array = vm.itemCreated.price;
        array.push(modelOfProduct);
        vm.itemCreated.totalPrice = totalPriceSum();

    }

    //this is to be used when Variable_Selected has already been triggered/selected
    function replacePrice(model) {
        //find index of item in the array so that it can be replace by the new model/option/product selected
        var existingItemIndex = _.findIndex(vm.itemCreated.price, function (product) {
            return product.category == model.category
        });
        vm.itemCreated.price[existingItemIndex] = model;
        vm.itemCreated.totalPrice = totalPriceSum();

    };

/*-----------Helper Functions--------------------------------------------
     Function  that abstract work for other functions----------
----------------------------------------------------------------------*/

    // Takes an array of objects and sums up 1 key property on all the objects in the array
    // in this case it is price
    function totalPriceSum() {
        var corsageTotal = vm.itemCreated.price.map(function (product) {
            return product.price;
        });
        return corsageTotal.reduce(function (a, b) {
            return a + b
        });

    }

}

