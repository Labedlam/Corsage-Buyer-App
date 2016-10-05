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
                    var selections = {};
                    selections.types = [];
                    //go through each type (Wrislet Corsage, Pin on, BOut) and
                    angular.forEach(Catalog.Items, function (value, key) {

                        OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: value.ID}, 1)
                            .then(function (data) {
                                var selectionType = {};
                                selectionType.Options = [];
                                selectionType.ParentID = value.ID;
                                selections.types.push(selectionType);
                                //get the list of categories
                                angular.forEach(data.Items, function (v, k) {
                                    var Option = {};
                                    Option.ID = v.ID;
                                    Option.Name = v.Name;
                                    selectionType.Options.push(Option);

                                    OrderCloud.Me.ListProducts(null, null, null, null, null, null, v.ID)
                                        .then(function (data) {
                                            if (data.Items.length > 0) {
                                                Option.Products = data.Items;

                                            } else {
                                                OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: v.ID}, 1)
                                                    .then(function (data) {
                                                        Option.SubCategories = [];

                                                        angular.forEach(data.Items, function (categoryvalue1, key1) {
                                                            var subCategoryType = {};
                                                            subCategoryType.ID = categoryvalue1.ID;
                                                            subCategoryType.Name = categoryvalue1.Name;
                                                            Option.SubCategories.push(subCategoryType);
                                                            OrderCloud.Me.ListProducts(null, null, null, null, null, null, categoryvalue1.ID)
                                                                .then(function (data) {
                                                                    subCategoryType.Products = data.Items;
                                                                    dfd.resolve(selections);
                                                                });
                                                        });
                                                    });
                                            }
                                            ;
                                        });

                                });

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
                                            OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: value.ID}, 1)
                                                .then(function (data) {
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
                                        }
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

function BuildYourOwnController($q, OrderCloud, Catalog, SelectionCategories, OptionalEmbellishments, OptionalFloralAccessories) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options

    var vm = this;
    vm.categories = Catalog;
    vm.requirementsMetForMVP = false;
    vm.typeChoices = SelectionCategories;
    vm.optionalEmbellishments = OptionalEmbellishments;
    vm.optionalFloralAcc = OptionalFloralAccessories;

    vm.optionalFloralAcc.show = false;
    vm.optionalEmbellishments.show = false;
    vm.productOptions = {};
    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    //store selections that were made by user
    vm.itemCreated.selectionsMade = [];
    //store all the possible options
    vm.selectionOptions = {};


    vm.typeSelected = function (type) {
        if(vm.typeChosen){
            vm.itemCreated.selectionsMade=[];
            vm.itemCreated.totalPrice = null;
            vm.itemCreated.Type = type.Name;
            //this relates to opening/closing accordion
            vm.newIndex = null;
            hideOptions();
        }
        vm.typeChosen = _.findWhere(vm.typeChoices.types, {ParentID: type.ID});
        vm.typeChosen.Name = type.Name;
        vm.typeChosen.Options[0].show =  true;
        vm.itemCreated.Type = type.Name;
        setRequirements(vm.itemCreated);

    };

    // adds product chosen to cart
    vm.addSelection = function (selection, category, $index, productArray) {
        if (selection.Products) {
            vm.productOptions[category.ID] = selection.Products;
        } else{
            var chosen = {};
            chosen.Type = category.ID;
            chosen.ID = selection.ID;
            chosen.Name = selection.Name;
            chosen.Price = selection.StandardPriceSchedule.PriceBreaks[0].Price;
            var link = '#' + category.ID;
            // chosen.selected=

            var checkIfChosenExists = _.findIndex(vm.itemCreated.selectionsMade, function (objectType) {
                return objectType.Type == category.ID
            });
            //look through array of selections made, if there is a object with a key Type that match the categoryId it will return true
            if (checkIfChosenExists > -1) {
                $(link).collapse();
                _.extend(vm.itemCreated.selectionsMade[checkIfChosenExists], chosen);
                vm.itemCreated.totalPrice = totalPriceSum();
                checkRequirementsOfType(vm.itemCreated);


            } else {

                vm.itemCreated.selectionsMade.push(chosen);
                vm.itemCreated.totalPrice = totalPriceSum();
                $(link).collapse();

                // openNextAccordian($index);
                checkRequirementsOfType(vm.itemCreated);
            }

        }




    };


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

    function hideOptions(){
        vm.requirementsMetForMVP = false;
        vm.optionalFloralAcc.show = false;
        vm.optionalEmbellishments.show = false;
    }

    function showOptionalAccessories(){
        vm.requirementsMetForMVP = true;
        vm.optionalFloralAcc.show = true;
        vm.optionalEmbellishments.show = true;
    }

    // opens next option once choice is made
    function openNextAccordian($index){
        var maxIndex = vm.typeChosen.Options.length - 1;
        if(vm.newIndex && vm.newIndex < maxIndex){
            vm.newIndex ++;
            vm.typeChosen.Options[vm.newIndex].show = true;
        }

        else if (vm.newIndex >= maxIndex){
            angular.noop()
        }
        else{
            vm.newIndex = $index + 1;
            vm.typeChosen.Options[vm.newIndex].show = true;


        }

    }

    //Sets up the requirements
    function setRequirements(finalObject){
        switch (finalObject.Type) {
            case "Wristlet Corsage":
                // an array of the category ID's
                finalObject.Requirements = ["BF-Wristlet", "W-Ribbon","W-Fastener"];
                break;
            case "Pin-On Corsage" :
                finalObject.Requirements = ["BF-PinOn", "P-Ribbon"];
                break;
            case "Boutonierre":
                finalObject.Requirements = ["BF-Bout"];

                break;
            default:
                vm.requirementsMetForMVP = false;
        }

    };

    /*Switch case to check a specific Type and verify all requirements are met for MVP (minimal viable product) to be added to cart
     it should be invoked when a required option is selected*/
    function checkRequirementsOfType(finalObject) {

        var selected = vm.itemCreated.selectionsMade.map(function (product) {
            return product.Type;
        });
        var matchingRequirements =_.intersection(finalObject.Requirements,  selected);
        vm.itemCreated.Requirements.length == matchingRequirements.length ? showOptionalAccessories() : vm.requirementsMetForMVP = false;
    }



}

