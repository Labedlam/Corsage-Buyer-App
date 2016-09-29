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
                // Get list of categories , check to see if any products returned
                getCorsageType: function(OrderCloud){
                   return OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: 3}, 1)
                },

                WristletCorsage: function ($q, OrderCloud,getCorsageType) {
                    var choices={};
                    var dfd=$q.defer();

                        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID:getCorsageType.Items[0].ID}, 1)
                            .then(function (data) {

                                angular.forEach(data.Items, function (value, key) {

                                    var name = value.Name.replace(/ /g, '');
                                    choices[name] = {};
                                    choices[name].ID = value.ID;

                                    OrderCloud.Me.ListProducts( null, null, null, null, null, null, value.ID)
                                        .then(function(data){
                                            if (data.Items.length > 0){
                                                var name = value.Name.replace(/ /g, '');
                                                choices[name].Options = data.Items;

                                            } else{

                                                OrderCloud.Me.ListCategories( null, null, null, null, null, {ParentID: value.ID}, null)
                                                    .then(function(data){
                                                        var name=value.Name.replace(/ /g, '');
                                                        choices[name].Options = [];

                                                        angular.forEach(data.Items, function(value1,key1){
                                                            var name1 = value1.Name.replace(/ /g, '');
                                                            var availableOptions = {};

                                                            availableOptions.Name = name1;
                                                            availableOptions.ID = value1.ID;
                                                            choices[name].Options.push(availableOptions);

                                                            OrderCloud.Me.ListProducts(null, null, null, null, null, null, value1.ID)
                                                                .then(function(data){
                                                                    if(data.Items.length > 0){
                                                                        var name2 = value1.Name.replace(/ /g, '');

                                                                        choices[name].Options[key1]["Options"] = data.Items;
                                                                                dfd.resolve(choices);

                                                                    }else{

                                                                    }

                                                                });
                                                        });

                                                    });

                                            }


                                        })
                                });
                                choices.Type = getCorsageType.Items[0].Name;
                                choices.ID = getCorsageType.Items[0].ID;

                            });

                    return dfd.promise;

                },
                formatWCorsage: function($q, WristletCorsage){
                    var wristCorsage=WristletCorsage;
                    wristCorsage.Options ={};
                    wristCorsage.Options.Required =[];
                    wristCorsage.Options.OptAddOn =[];
                    var dfd = $q.defer();

                    angular.forEach(wristCorsage.OptionalAddOns.Options, function(v,k){

                        wristCorsage.Options.OptAddOn.push(wristCorsage.OptionalAddOns.Options[k]);


                            dfd.resolve();
                    });
                    if (wristCorsage.Options.OptAddOn[0].Ribbon ){

                        wristCorsage.Options.OptAddOn[0].Options = wristCorsage.Options.OptAddOn[0].Ribbon;

                    }
                    dfd.promise;



                    wristCorsage.Options.OptAddOn.push(wristCorsage.Fastener);
                    wristCorsage.Options.OptAddOn.push(wristCorsage.Ribbon);
                    console.log("theformatted object",wristCorsage);

                    // delete wristCorsage.OptionalAddOns, delete wristCorsage.Fastener, delete wristCorsage.Ribbon;
                    // delete wristCorsage.OptionalAddOns


                },
                PinOnCorsage: function($q, OrderCloud, getCorsageType){
                    var choices={};
                    var dfd = $q.defer();
                    OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID:getCorsageType.Items[1].ID}, 1)
                        .then(function (data) {

                            angular.forEach(data.Items, function (value, key) {

                                var name = value.Name.replace(/ /g, '');
                                choices[name] = {};
                                choices[name].ID = value.ID;

                                OrderCloud.Me.ListProducts( null, null, null, null, null, null, value.ID)
                                    .then(function(data){
                                        if (data.Items.length > 0){
                                            var name = value.Name.replace(/ /g, '');
                                            choices[name].Options = data.Items;

                                        } else{

                                            OrderCloud.Me.ListCategories( null, null, null, null, null, {ParentID: value.ID}, null)
                                                .then(function(data){
                                                    var name=value.Name.replace(/ /g, '');
                                                    choices[name].Options = [];

                                                    angular.forEach(data.Items, function(value1,key1){
                                                        var name1 = value1.Name.replace(/ /g, '');
                                                        var availableOptions = {};

                                                        availableOptions.Name = name1;
                                                        availableOptions.ID = value1.ID;
                                                        choices[name].Options.push(availableOptions);

                                                        OrderCloud.Me.ListProducts(null, null, null, null, null, null, value1.ID)
                                                            .then(function(data){

                                                                if(data.Items.length > 0){
                                                                    var name2 = "Options";
                                                                    //value1.Name.replace(/ /g, '');

                                                                    choices[name].Options[key1][name2] = data.Items;

                                                                    console.log("This is name",choices[name], name);
                                                                    dfd.resolve(choices);
                                                                }else{
                                                                }

                                                            });
                                                    });

                                                });

                                        }


                                    })
                            });
                            choices.Type = getCorsageType.Items[1].Name;
                            choices.ID = getCorsageType.Items[1].ID;

                        });
                    choices.Choices ={};
                    return dfd.promise;
                },
                Boutonierre: function($q, OrderCloud, getCorsageType){
                    var choices={};
                    var dfd = $q.defer();
                    OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID:getCorsageType.Items[2].ID}, 1)
                        .then(function (data) {

                            angular.forEach(data.Items, function (value, key) {

                                var name = value.Name.replace(/ /g, '');
                                choices[name] = {};
                                choices[name].ID = value.ID;

                                OrderCloud.Me.ListProducts( null, null, null, null, null, null, value.ID)
                                    .then(function(data){
                                        if (data.Items.length > 0){
                                            var name = value.Name.replace(/ /g, '');
                                            choices[name].Options = data.Items;

                                        } else{

                                            OrderCloud.Me.ListCategories( null, null, null, null, null, {ParentID: value.ID}, null)
                                                .then(function(data){
                                                    var name=value.Name.replace(/ /g, '');
                                                    choices[name].Options = [];

                                                    angular.forEach(data.Items, function(value1,key1){
                                                        var name1 = value1.Name.replace(/ /g, '');
                                                        var availableOptions = {};

                                                        availableOptions.Name = name1;
                                                        availableOptions.ID = value1.ID;
                                                        choices[name].Options.push(availableOptions);

                                                        OrderCloud.Me.ListProducts(null, null, null, null, null, null, value1.ID)
                                                            .then(function(data){

                                                                if(data.Items.length > 0){
                                                                    var name2 = value1.Name.replace(/ /g, '');

                                                                    choices[name].Options[key1][name2] = data.Items;
                                                                    dfd.resolve(choices);

                                                                }else{

                                                                }

                                                            });
                                                    });

                                                });

                                        }


                                    })
                            });
                            choices.Type = getCorsageType.Items[2].Name;
                            choices.ID = getCorsageType.Items[2].ID;


                        });
                    return dfd.promise;
                },
                Selection: function(WristletCorsage,PinOnCorsage, Boutonierre){

                  var selection = [];
                    selection. push(WristletCorsage);
                    selection. push(PinOnCorsage);
                    selection. push(Boutonierre);

                    return selection

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

function BuildYourOwnController(OrderCloud, Selection, Underscore) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options


    var vm = this;
     vm.categories = Selection;
    vm.requirementsMetForMVP = false;

    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    vm.typeChosen;
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
    //Initialize ribbon color to show , it will be hidden depending on which product type is selected.
    vm.showRibbonColor = true;


    // pass in the id of category to get  product type.
    //set product to selected array, so that it can be displayed

/*-----------Variable__Selected--------------------------------------------
     Functions for each specific Choice Made available to the User----------
     These functions are triggered when User Clicks/Selects and Option
 --------------------------------------------------------------------*/


    vm.typeSelected = function (category) {
        vm.typeChosen = category;
        vm.flowerbase = category.BaseFlowerChoices.Options;
        //check to see whether productTypeSelected has been selected or not, if it changes category reset the itemCreatedObject
        // if (vm.productTypeSelected) {
            //check if if product type has been set to true
        //     //vm.itemCreated.type == category.ID ? vm.productTypeSelected = true : resetFinalBuild(category);
        //
        // }
        // else {
        //    setCategories(category)
        // };

    };


    vm.baseFlowerSelected = function (flower) {
        //when a new flower is added or replaced . it needs to get replaced in the array
        console.log("hello", flower);
        vm.itemCreated.baseFlower = flower.Name;

        vm.selectionOptions.flowerColorChoice = flower.Options;
        // OrderCloud.Me.ListProducts(null, null, null, null, null, null, flower.ID)
        //     .then(function (data) {
        //
        //         vm.selectionOptions.flowerColorChoice = data.Items;
        //         checkRequirementsofType( vm.itemCreated);
        //         // $('#collapseTwo').collapse();
        //         $('#collapseThree').collapse();
        //
        //
        //     })
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
        checkRequirementsofType( vm.itemCreated);
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
                setOptionalAddOn();

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
        //find index of item in the array so that it can be replace by the new model/option/product selected
        var existingItemIndex = _.findIndex(vm.itemCreated.price, function (product) {
            return product.category == model.category
        });
        vm.itemCreated.price[existingItemIndex] = model;
        vm.itemCreated.totalPrice = totalPriceSum();

    };

    // resets Final Create Your Own Product
    function resetFinalBuild(typeSelected){
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

    // this function will check which product type is selected and set respective options
    function setOptionalAddOn(){
        //go through array find name with optional Add ON's , take id ,and pass get data

        var addOn =_.findWhere(vm.typeCategories,{ Name: "Optional Add Ons"});
        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: addOn.ID}, 1)
            .then(function (data) {
                angular.forEach(data.Items, function(value, key){
                     OrderCloud.Me.ListProducts(null, null, null, null, null, null , value.ID )

                         .then(function(data){
                             var name=value["ID"].replace(/\-/g, '');
                             vm.selectionOptions["opAddOn" + name] =data.Items;
                         });

                })


            });

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

