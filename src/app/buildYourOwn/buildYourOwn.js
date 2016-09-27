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


    var vm = this;
    vm.categories = Catalog;
    vm.requirementsMetForMVP = false;

    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    //categories under type
    vm.typeCategories;
    //Price Array to hold the cost of all options selected
    vm.itemCreated.price = [];

    //store all the possible options
    vm.selectionOptions ={};

    // keeping intial producttype selection trigger seperate from rest because I reset all of the triggers except this one
    vm.productTypeSelected;
    //store all the selected Options triggers ( triggers in this context identify whether the selected option has been clicked/selected or not)
    vm.selectedOptionsTriggers = {};
    vm.selectedOptionsTriggers.flowerSelected;
    vm.selectedOptionsTriggers.ribbonSelected;
    vm.selectedOptionsTriggers.fastenerSelected;
    vm.selectedOptionsTriggers.floralAccentSelected;
    vm.selectedOptionsTriggers.optionalRibbon;
    vm.selectedOptionsTriggers.gemOptionSelected;
    //Initialize ribbon color to show , it will be hidden depending on which product type is selected.
    vm.showRibbonColor = true;


    // pass in the id of category to get  product type.
    //set product to selected array, so that it can be displayed

/*-----------Variable__Selected--------------------------------------------
     Functions for each specific Choice Made available to the User----------
     These functions are triggered when User Clicks/Selects and Option
 --------------------------------------------------------------------*/



    vm.typeSelected = function (category) {
        //check to see whether productTypeSelected has been selected or not, if it changes category reset the itemCreatedObject
        if (vm.productTypeSelected) {
            //check if if product type has been set to true
            console.log("hello the product type has been selected and set");
            vm.itemCreated.type == category.Name ? vm.productTypeSelected = true : resetFinalBuild(category);

        }
        else {
           setCategories(category)
        }
    };


    vm.baseFlowerSelected = function (flower) {
        //when a new flower is added or replaced . it needs to get replaced in the array

        vm.itemCreated.baseFlower = flower.Name;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, flower.ID)
            .then(function (data) {

                vm.selectionOptions.flowerColorChoice = data.Items;
                checkRequirementsofType( vm.itemCreated);
                // $('#collapseTwo').collapse();
                $('#collapseThree').collapse();


            })
    };

    vm.flowerColorSelected = function (flowerColor) {
        var model = {
            price: flowerColor.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "flowerColor"
        };

        vm.selectedOptionsTriggers.flowerSelected == undefined || vm.selectedOptionsTriggers.flowerSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.selectedOptionsTriggers.flowerSelected = true;
        vm.itemCreated.flowerColor = flowerColor.Name;
        vm.itemCreated.flowerPrice = flowerColor.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, vm.typeCategories[1].ID)
            .then(function (data) {
                console.log(data);
                vm.selectionOptions.ribbonChoice = data.Items;
                checkRequirementsofType( vm.itemCreated);
            });

    };

    vm.ribbonColorSelected = function (ribbon) {
        var model = {
            price: ribbon.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "ribbon"
        };

        vm.selectedOptionsTriggers.ribbonSelected == undefined || vm.selectedOptionsTriggers.ribbonSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.selectedOptionsTriggers.ribbonSelected = true;
        vm.itemCreated.ribbonColor = ribbon.Name;
        vm.itemCreated.ribbonPrice = ribbon.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, vm.typeCategories[2].ID)
            .then(function (data) {
                console.log(data);
                vm.selectionOptions.fastenerOption = data.Items;
                checkRequirementsofType( vm.itemCreated);
            });
    };

    vm.fastenerOptionSelected = function (fastener) {
        var model = {
            price: fastener.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "fasteners"
        };

        vm.selectedOptionsTriggers.fastenerSelected == undefined || vm.selectedOptionsTriggers.fastenerSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.selectedOptionsTriggers.fastenerSelected = true;
        vm.itemCreated.fastenerChoice = fastener.Name;
        vm.itemCreated.fastenerPrice = fastener.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: vm.typeCategories[3].ID}, 1)
            .then(function (data) {
                OrderCloud.Me.ListProducts(null, null, null, null, null, null, data.Items[0].ID)
                    .then(function(data){
                        vm.selectionOptions.optionalRibbonSelected = data.Items;
                        checkRequirementsofType( vm.itemCreated);
                    })
            });
    };

    vm.addOnRibbonSelected = function (addOnRibbon){
        var model = {
            price: addOnRibbon.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "addOnRibbons"
        };

        vm.optionalRibbon == undefined || vm.optionalRibbon == false ? addPriceToTotal(model) : replacePrice(model);
        vm.optionalRibbon = true;
        vm.itemCreated.optionalRibbonChoice = addOnRibbon.Name;
        vm.itemCreated.optionalRibbonPrice = addOnRibbon.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: vm.typeCategories[3].ID}, 1)
            .then(function (data) {
                OrderCloud.Me.ListProducts(null, null, null, null, null, null, data.Items[1].ID)
                    .then(function(data){
                        vm.selectionOptions.floralAccentOption = data.Items;
                        checkRequirementsofType( vm.itemCreated);
                    })
            });
    };

    vm.addOnFloralAccentSelected = function (floralAccent) {
        var model = {
            price: floralAccent.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "floralAccents"
        };

        vm.floralAccentSelected == undefined || vm.floralAccentSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.floralAccentSelected = true;
        vm.itemCreated.floralAccentChoice = floralAccent.Name;
        vm.itemCreated.floralAccentPrice = floralAccent.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: 3}, 1)
            .then(function (data) {
                console.log("here are your OTHER cats",{ParentID: data.Items[3].ID});
                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[3].ID}, 1)
                    .then(function(data){
                        OrderCloud.Me.ListProducts(null, null, null, null, null, null, data.Items[1].ID)
                            .then(function(data){
                                vm.selectionOptions.gemsOptions = data.Items;
                                checkRequirementsofType( vm.itemCreated);
                        })
                    })
            });
    };

    vm.gemsSelected = function (gems) {
        var model = {
            price: gems.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "gems"
        };

        vm.gemOptionSelected == undefined || vm.gemOptionSelected == false ? addPriceToTotal(model) : replacePrice(model);
        vm.gemOptionSelected = true;
        vm.itemCreated.gemOptionChoice = gems.Name;
        vm.itemCreated.gemOptionPrice = gems.StandardPriceSchedule.PriceBreaks[0].Price;
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: 3}, 1)
            .then(function (data) {
                console.log("here are your OTHER cats",{ParentID: data.Items[3].ID});
                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[3].ID}, 1)
                    .then(function(data){
                        OrderCloud.Me.ListProducts(null, null, null, null, null, null, data.Items[0].ID)
                            .then(function(data){
                                vm.selectionOptions.feathersOptions = data.Items;
                                checkRequirementsofType( vm.itemCreated);
                            })
                    })
            });
    };

    vm.feathersSelected = function(feathers) {
        var model = {
            price: feathers.StandardPriceSchedule.PriceBreaks[0].Price,
            category: "feathers"
        };

        vm.featherOptionSelected == undefined || vm.featherOptionSelected == flase ? addPriceToTotal(model) : replacePrice(model);
        vm.featherOptionSelected = true;
        vm.itemCreated.featherOptionChoice = feathers.Name;
        vm.itemCreated.featherOptionPrice = feathers.StandardPriceSchedule.PriceBreaks[0].Price;
    };


/* ------------------------------------------*/

    // Sets up the categories associated with selected product type
    function setCategories(category){
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: category.ID}, 1)
        //if they change type clear the previously selected data
            .then(function (data) {
                vm.productTypeSelected = true;
                vm.itemCreated.type = category.Name;
                vm.typeCategories = data.Items;
                vm.showRibbonColor = ['Pin-On Corsage', 'Wristlet Corsage'].indexOf(category.Name) > -1;
                console.log("here are your categories",vm.typeCategories);

                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[0].ID}, 1)
                    .then(function (data) {

                        vm.selectionOptions.flowerOptions = data.Items;
                        $('#collapseOne').collapse();
                        $('#collapseTwo').collapse();
                        $('#collapseThree').collapse();
                        $('#collapseFour').collapse();
                        $('#collapseFive').collapse();
                    });
                // $('#headingOne').collapse();
                //what happens when there is no returned items? setup so there should be.... possible room for improvement
            })
            .catch(function () {

            });
    }

    // triggers whenever a Variable_ Selected Option is Clicked for the first time
    function addPriceToTotal(modelOfProduct) {
        var array = vm.itemCreated.price;
        array.push(modelOfProduct);
        vm.itemCreated.totalPrice = totalPriceSum();

    }

    //this is to be used when Variable_Selected has already been triggered/selected
    function replacePrice(model) {
        console.log("I should be getting hit in replace")
        //find index of item in the array so that it can be replace by the new model/option/product selected
        var existingItemIndex = _.findIndex(vm.itemCreated.price, function (product) {
            return product.category == model.category
        });
        vm.itemCreated.price[existingItemIndex] = model;
        vm.itemCreated.totalPrice = totalPriceSum();

    }

    // resets Final Create Your Own Product
    function resetFinalBuild(typeSelected){
        console.log("Im reseting this built object");
        vm.itemCreated = {
            type: typeSelected.Name,
            price : []
        };
        vm.selectionOptions ={};
        // go throught the selected Options triggers and set them all to false
        setTriggersToFalse(vm.selectedOptionsTriggers);
        setCategories(typeSelected);
        vm.requirementsMetForMVP = false;
    }

    /*Switch case to check a specific Type and verify all requirements are met for MVP (minimal viable product) to be added to cart
    it should be invoked when a required option is selected*/
    function checkRequirementsofType(finalObject){
        switch (finalObject.type){
            case "Wristlet Corsage":
                // check if specific requirements exist
                //  add once updated functionality is merged
                if( finalObject.baseFlower && finalObject.flowerColor && finalObject.ribbonColor && finalObject.fastenerChoice){
                    vm.requirementsMetForMVP = true;
                }else {
                    vm.requirementsMetForMVP = false;
                };
                break;
            case "Pin-On Corsage" :
                if( finalObject.baseFlower && finalObject.flowerColor && finalObject.ribbonColor){
                    vm.requirementsMetForMVP = true;
                }else {
                    vm.requirementsMetForMVP = false;
                };
                break;
            case "Boutonierre":
                if( finalObject.baseFlower && finalObject.flowerColor){
                    vm.requirementsMetForMVP = true;
                }else {
                    vm.requirementsMetForMVP = false;
                };

                break;
            default:
                vm.requirementsMetForMVP = false;
        }
    }


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

    // takes an object that only has boolean values and sets them all to false
    function setTriggersToFalse(selectedOptionsTriggers){
        for( var key in selectedOptionsTriggers ) {
            selectedOptionsTriggers[key] = false;
        }
    }

}

