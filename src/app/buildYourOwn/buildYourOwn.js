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
                SelectionCategories: function ($q, OrderCloud, Catalog) {
                    var dfd = $q.defer();
                    var types = [];
                    angular.forEach(Catalog.Items, function (value, key) {
                        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: value.ID}, 1)
                            .then(function (data) {
                                var selectionType = {};
                                selectionType.Options = data.Items;
                                selectionType.ParentID = value.ID;
                                types.push(selectionType);
                                dfd.resolve(types);
                            });
                    });
                    return dfd.promise;
                },
                OptionalEmbellishments: function ($q, OrderCloud) {
                    var dfd = $q.defer();
                    var optionalEmbellishments = {};
                    optionalEmbellishments.types = [];

                    OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: "OpEmb"}, 1)
                        .then(function (data) {
                            angular.forEach(data.Items, function (value, key) {
                                var selectionTypes = {};
                                selectionTypes.ID = value.ID;
                                selectionTypes.Name = value.Name;
                                optionalEmbellishments.types.push(selectionTypes);
                                //list products associate with this specific value(category)
                                OrderCloud.Me.ListProducts(null, null, null, null, null, null, value.ID)
                                    .then(function (data) {
                                        selectionTypes.Products = data.Items;
                                        dfd.resolve(optionalEmbellishments);
                                    });
                            });
                            console.log("OE", data);

                        });
                    return dfd.promise;
                },
                OptionalFloralAccessories: function ($q, OrderCloud) {
                    var dfd = $q.defer();
                    var optionalFloralAccessories = {};
                    optionalFloralAccessories.types = [];
                    OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: "OpFloralAcc"}, 1)
                        .then(function (data) {
                            angular.forEach(data.Items, function (value, key) {
                                var selectionTypes = {};
                                selectionTypes.ID = value.ID;
                                selectionTypes.Name = value.Name;
                                optionalFloralAccessories.types.push(selectionTypes);
                                //list products associate with this specific value(category) and check it they have products, if so add the array  to products key
                                OrderCloud.Me.ListProducts(null, null, null, null, null, null, value.ID)
                                    .then(function (data) {
                                        if (data.Items.length > 0) {
                                            selectionTypes.Products = data.Items;

                                        } else {
                                            console.log("this", value.Name, " has sub categories, which has products");
                                            OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: value.ID}, 1)
                                                .then(function (data) {
                                                    // console.log("this array being ran though after 2nd categoreis call", data.Items);
                                                    selectionTypes.SubCategories = [];

                                                    angular.forEach(data.Items, function (categoryvalue1, key1) {
                                                        var subCategoryType = {};
                                                        subCategoryType.ID = categoryvalue1.ID;
                                                        subCategoryType.Name = categoryvalue1.Name;
                                                        selectionTypes.SubCategories.push(subCategoryType);
                                                        OrderCloud.Me.ListProducts(null, null, null, null, null, null, categoryvalue1.ID)
                                                            .then(function (data) {
                                                                subCategoryType.Products = data.Items;
                                                                dfd.resolve(optionalFloralAccessories);
                                                            })
                                                    });
                                                });
                                        };
                                        console.log(optionalFloralAccessories);
                                    });
                            });
                        });
                    return dfd.promise;
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

function BuildYourOwnController(OrderCloud, Catalog, SelectionCategories, OptionalEmbellishments, OptionalFloralAccessories) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options

    var vm = this;
    vm.categories = Catalog;
    vm.requirementsMetForMVP = false;
    vm.typeChoices = SelectionCategories;
    console.log("Oe Resolve", OptionalEmbellishments);
    console.log("OF Resolve", OptionalFloralAccessories);
    vm.optionalEmbellishments = OptionalEmbellishments;
    vm.optionalFloralAcc = OptionalFloralAccessories;

    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    //categories under type
    // vm.typeCategories;
    //Price Array to hold the cost of all options selected
    vm.itemCreated.price = [];
    //store selections that were made by user
    vm.itemCreated.selectionsMade = [];
    //store all the possible options
    // vm.selectionOptions = {};

    // keeping intial producttype selection trigger seperate from rest because I reset all of the triggers except this one
    vm.productTypeSelected;
    //store all the selected Options triggers ( triggers in this context identify whether the selected option has been clicked/selected or not)
    vm.selectedOptionsTriggers = {};
    vm.selectedOptionsTriggers.flowerSelected;
    vm.selectedOptionsTriggers.ribbonSelected;
    vm.selectedOptionsTriggers.fastenerSelected;
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

        //match category id with category id of type choices

        vm.typeChosen = _.findWhere(vm.typeChoices, {ParentID: category.ID});
    };

    vm.baseFlowerSelected = function (flower) {
        //when a new flower is added or replaced . it needs to get replaced in the array

        vm.itemCreated.baseFlower = flower.Name;
        OrderCloud.Me.ListProducts(null, null, null, null, null, null, flower.ID)
            .then(function (data) {

                vm.selectionOptions.flowerColorChoice = data.Items;
                checkRequirementsofType(vm.itemCreated);
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
                checkRequirementsofType(vm.itemCreated);
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
                checkRequirementsofType(vm.itemCreated);
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
        checkRequirementsofType(vm.itemCreated);
    };

    // adds product chosen to cart
    vm.addSelection = function ( selection, categoryID ){
        console.log("this is selection,",selection, "this is category Name",categoryID);
        var chosen = {};
            chosen.Type = categoryID;
            chosen.ID = selection.ID;
            chosen.Name = selection.Name;
            chosen.Price = selection.StandardPriceSchedule.PriceBreaks[0].Price;

        var checkIfChosenExists =  _.findIndex(vm.itemCreated.selectionsMade, function(objectType) { return objectType.Type == categoryID });
        console.log("checkifChosenExist",checkIfChosenExists );
        //look through array of selections made, if there is a object with a key Type that match the categoryId it will return true
       if( checkIfChosenExists > -1){
           console.log("this type has been selected", categoryID);
            _.extend(vm.itemCreated.selectionsMade[checkIfChosenExists],chosen);
           vm.itemCreated.totalPrice = totalPriceSum();
       }else{

           vm.itemCreated.selectionsMade.push(chosen);
           vm.itemCreated.totalPrice = totalPriceSum();
       }

        //check to see if selection has been made
      //      if so, then clear previous choice and set new one then set initialize variable to true
      //      else set choice and set initialize variable to true
      //
    };

    /* ------------------------------------------*/

    // Sets up the categories associated with selected product type
    function setCategories(category) {
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: category.ID}, 1)
        //if they change type clear the previously selected data
            .then(function (data) {
                vm.productTypeSelected = true;
                vm.itemCreated.type = category.Name;
                vm.typeCategories = data.Items;
                vm.showRibbonColor = ['Pin-On Corsage', 'Wristlet Corsage'].indexOf(category.Name) > -1;
                console.log("here are your categories", vm.typeCategories);

                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: data.Items[0].ID}, 1)
                    .then(function (data) {

                        vm.selectionOptions.flowerOptions = data.Items;
                        $('#collapseOne').collapse();

                    });

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
        //find index of item in the array so that it can be replace by the new model/option/product selected
        var existingItemIndex = _.findIndex(vm.itemCreated.price, function (product) {
            return product.category == model.category
        });
        vm.itemCreated.price[existingItemIndex] = model;
        vm.itemCreated.totalPrice = totalPriceSum();

    };

    // resets Final Create Your Own Product
    function resetFinalBuild(typeSelected) {
        console.log("Im reseting this built object");
        vm.itemCreated = {
            type: typeSelected.Name,
            price: []
        };
        vm.selectionOptions = {};
        // go throught the selected Options triggers and set them all to false
        setTriggersToFalse(vm.selectedOptionsTriggers);
        setCategories(typeSelected);
        vm.requirementsMetForMVP = false;
    }

    /*Switch case to check a specific Type and verify all requirements are met for MVP (minimal viable product) to be added to cart
     it should be invoked when a required option is selected*/
    function checkRequirementsofType(finalObject) {
        switch (finalObject.type) {
            case "Wristlet Corsage":
                // check if specific requirements exist
                //  add once updated functionality is merged
                if (finalObject.baseFlower && finalObject.flowerColor && finalObject.ribbonColor && finalObject.fastenerChoice) {
                    vm.requirementsMetForMVP = true;
                } else {
                    vm.requirementsMetForMVP = false;
                }
                ;
                break;
            case "Pin-On Corsage" :
                if (finalObject.baseFlower && finalObject.flowerColor && finalObject.ribbonColor) {
                    vm.requirementsMetForMVP = true;
                } else {
                    vm.requirementsMetForMVP = false;
                }
                ;
                break;
            case "Boutonierre":
                if (finalObject.baseFlower && finalObject.flowerColor) {
                    vm.requirementsMetForMVP = true;
                } else {
                    vm.requirementsMetForMVP = false;
                }
                ;

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
        var corsageTotal = vm.itemCreated.selectionsMade.map(function (product) {
            return product.Price;
        });
        return corsageTotal.reduce(function (a, b) {
            return a + b
        });

    }

    // takes an object that only has boolean values and sets them all to false
    function setTriggersToFalse(selectedOptionsTriggers) {
        for (var key in selectedOptionsTriggers) {
            selectedOptionsTriggers[key] = false;
        }
    }

}

