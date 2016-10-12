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
                                selectionType.Name = value.Name;
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
                OptionsAvailableForAllTypes: function(SelectionCategories){
                    //take optional categories available to all types and set them as options for each type
                    //find optionalEmbellishments  and Optional floral Accessories
                    var optionsArray = SelectionCategories.types;
                    console.log("Here is SelectionCategories",SelectionCategories.types);
                    var removed = [];
                    var optEmbAndAccessories = ["OpEmb", "OpFloralAcc"];

                    //take those object out of the selection array
                    angular.forEach(optEmbAndAccessories, function(value){

                        var index = _.findIndex(optionsArray, function(option){return option.ParentID == value});
                        removed.push((optionsArray.splice(index,1))[0]);
                    });

                    //set name on optional categories
                    removed[0].Name = "Optional Embellishments";
                    removed[1].Name = "Optional Floral Accessories";

                    //store copies of them in type options array
                    console.log("this is options array", optionsArray);
                    angular.forEach(optionsArray,function(value){
                        value.Options = value.Options.concat(removed);

                    });
                    console.log("this is optionArray",optionsArray);
                    return optionsArray;
                },

                // OptionalEmbellishments: function ($q, OrderCloud) {
                //     var dfd = $q.defer();
                //     var optionalEmbellishments = {};
                //     optionalEmbellishments.ID = "OpEmb";
                //     optionalEmbellishments.types = [];
                //
                //     OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: "OpEmb"}, 1)
                //         .then(function (data) {
                //             angular.forEach(data.Items, function (value, key) {
                //                 var selectionTypes = {};
                //                 selectionTypes.ID = value.ID;
                //                 selectionTypes.Name = value.Name;
                //                 optionalEmbellishments.types.push(selectionTypes);
                //                 //list products associate with this specific value(category)
                //                 OrderCloud.Me.ListProducts(null, null, null, null, null, null, value.ID)
                //                     .then(function (data) {
                //                         selectionTypes.Products = data.Items;
                //                         dfd.resolve(optionalEmbellishments);
                //                     });
                //             });
                //
                //         });
                //     return dfd.promise;
                // },
                // OptionalFloralAccessories: function ($q, OrderCloud) {
                //     var dfd = $q.defer();
                //     var optionalFloralAccessories = {};
                //     optionalFloralAccessories.types = [];
                //     OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: "OpFloralAcc"}, 1)
                //         .then(function (data) {
                //             angular.forEach(data.Items, function (value, key) {
                //                 var selectionTypes = {};
                //                 selectionTypes.ID = value.ID;
                //                 selectionTypes.Name = value.Name;
                //                 optionalFloralAccessories.types.push(selectionTypes);
                //                 //list products associate with this specific value(category) and check it they have products, if so add the array  to products key
                //                 OrderCloud.Me.ListProducts(null, null, null, null, null, null, value.ID)
                //                     .then(function (data) {
                //                         if (data.Items.length > 0) {
                //                             selectionTypes.Products = data.Items;
                //
                //                         } else {
                //                             OrderCloud.Me.ListCategories(null, null, null, null, null, {ParentID: value.ID}, 1)
                //                                 .then(function (data) {
                //                                     selectionTypes.SubCategories = [];
                //
                //                                     angular.forEach(data.Items, function (categoryvalue1, key1) {
                //                                         var subCategoryType = {};
                //                                         subCategoryType.ID = categoryvalue1.ID;
                //                                         subCategoryType.Name = categoryvalue1.Name;
                //                                         selectionTypes.SubCategories.push(subCategoryType);
                //                                         OrderCloud.Me.ListProducts(null, null, null, null, null, null, categoryvalue1.ID)
                //                                             .then(function (data) {
                //                                                 subCategoryType.Products = data.Items;
                //                                                 dfd.resolve(optionalFloralAccessories);
                //                                             })
                //                                     });
                //                                 });
                //                         }
                //                     });
                //             });
                //         });
                //     return dfd.promise;
                // },
                Specs: function($q, OrderCloud) {
                    //free base ribbon products
                    // hard coding one ribbon product in product assignment call because the same spec is assigned to all the products
                    var specQueue = [];
                    var dfd = $q.defer();

                    OrderCloud.Specs.ListProductAssignments(null, "HunterRibbon")
                        .then(function(data) {
                            angular.forEach(data.Items, function(assignment) {
                                specQueue.push(OrderCloud.Specs.Get(assignment.SpecID));
                            });
                            $q.all(specQueue)
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

function BuildYourOwnController($q, $state, OrderCloud, LineItemHelpers, Catalog, SelectionCategories , OptionsAvailableForAllTypes, CurrentOrder, Order, Specs) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options

    var vm = this;
    //Gets spec for base ribbon which should be free
    var baseRibbonSpec = Specs[0];
    // for uib Collapse if it is true it hides the content
    vm.showType = false;

    vm.categories = OptionsAvailableForAllTypes;
    vm.requirementsMetForMVP = false;
    // vm.typeChoices = SelectionCategories;

    vm.productOptions = {};
    //TODO: change name itemCreated to FinalBuildObject(something more clear about what the object is)
    vm.itemCreated = {};
    //store selections that were made by user
    vm.itemCreated.selectionsMade = [];
    //store all the possible options
    vm.selectionOptions = {};


    vm.setCollapse = function(type){
        console.log("hi im changing nav collapse");
        if(!vm[type.ID]){
            vm[type.ID] = {};
            vm[type.ID].isNavCollapsed = false;
        }else{
            vm[type.ID].isNavCollapsed = ! vm[type.ID].isNavCollapsed;
        }


    };





    vm.typeSelected = function (type) {
        if(vm.typeChosen){
            vm.itemCreated.selectionsMade=[];
            vm.itemCreated.totalPrice = null;
            vm.itemCreated.Type = type.Name;
            //this relates to opening/closing accordion
            vm.newIndex = null;
            hideOptions();
        }
        vm.typeChosen = _.findWhere(vm.categories, {ParentID: type.ParentID});
        vm.typeChosen.Name = type.Name;
        vm.typeChosen.Options[0].show =  true;
        vm.showType = true;
        vm.itemCreated.Type = type.Name;
        setRequirements(vm.itemCreated);

    };

    // adds product chosen to cart
    vm.addSelection = function (selection, category, depth) {
        console.log("this is object being passed through function",selection, "this is category passed in function", category);

        if(selection && selection.Products && (depth == 1) ){
            vm.productOptions[category.ID] =  {
                Products : selection.Products
            }
        }

        else if( selection && selection.Products && (depth >1) ){
            console.log("depth 2");
            if (vm.productOptions[category.ID] && vm.productOptions[category.ID][selection.ID]) {
                        delete vm.productOptions[category.ID][selection.ID];
                    }
                    else {
                        if (!vm.productOptions[category.ID]) {
                            vm.productOptions[category.ID] = {};
                            vm.productOptions[category.ID][selection.ID] = selection;
                        } else{
                            vm.productOptions[category.ID][selection.ID] = selection;
                        }

                    }

        }
        else if(selection.Products){
            console.log("hey I'm an option")

            vm.baseFlowerChosen = {};
            vm.baseFlowerChosen.Products = selection.Products;
            vm.baseFlowerChosen.Name = "Colors";
            vm.baseFlowerChosen.ID = category.ID;

            var checkIfChosenExists = _.findIndex(vm.typeChosen.Options, function (objectType) {
                return objectType.Name == vm.baseFlowerChosen.Name;
            });

            if(checkIfChosenExists > -1){
                _.extend(vm.typeChosen.Options[checkIfChosenExists], vm.baseFlowerChosen);

            }else{
                vm.typeChosen.Options.splice(1,0,vm.baseFlowerChosen)
            }

        }

        else{
            console.log("hellaoooo ", category.ID);
            var chosen = {};
            chosen.Type = category.ID;
            chosen.ID = selection.ID;
            chosen.Name = selection.Name;
            chosen.Price = selection.StandardPriceSchedule.PriceBreaks[0].Price;
            chosen.Quantity = 1;
            chosen.Show = false;

            // if required ribbon - price is free
            if( chosen.Type ==  "W-Ribbon"|| chosen.Type == "P-Ribbon"){
                chosen.Price = 0;
            }

            var checkIfChosenExists = _.findIndex(vm.itemCreated.selectionsMade, function (objectType) {
                return objectType.Type == category.ID
            });
            //look through array of selections made, if there is a object with a key Type that match the categoryId it will return true
            if (checkIfChosenExists > -1) {
                _.extend(vm.itemCreated.selectionsMade[checkIfChosenExists], chosen);
                vm.itemCreated.totalPrice = totalPriceSum();
                checkRequirementsOfType(vm.itemCreated);
            } else {
                vm.itemCreated.selectionsMade.push(chosen);
                vm.itemCreated.totalPrice = totalPriceSum();
                checkRequirementsOfType(vm.itemCreated);

                console.log("here is cc queue", vm.itemCreated.selectionsMade);
            }

        }
    };

    vm.removeSelection = function (selection){
    // find selection in array
        var selectionIndex = _.findIndex(vm.itemCreated.selectionsMade, function(product){return product.ID == selection.ID});
        console.log("index of selection", selectionIndex);
    // remove it
        vm.itemCreated.selectionsMade.splice(selectionIndex,1);

    // check that minimum requirements are met
        checkRequirementsOfType(vm.itemCreated);

    // update total price
        vm.itemCreated.totalPrice = totalPriceSum();
    };


    vm.addToCart = function () {
        var selections= vm.itemCreated.selectionsMade;
        var genID = idGenerate();
        //check if there is an order


        if (Order) {
            createLineItemXpCorsage(selections, genID, Order);
        } else {
            //create an order
            OrderCloud.Orders.Create({})
                .then(function (order) {
                    console.log("here is orderid",order.ID);
                    CurrentOrder.Set(order.ID)
                        .then(function(data){
                            createLineItemXpCorsage(selections, genID, order);
                    })
                });
        }
    };

    // go though itemCreated.selectionsMade array, create a new line item for each object in that array
    // Also add the xp.CustomCorsage with the same unique ID for all
    function createLineItemXpCorsage(productArray, genID, order){
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(productArray, function (product) {
            var li = {
                ProductID: product.ID,
                Quantity: product.Quantity,
                xp: {customCorsage: genID}
            };

            if( product.Type ==  "W-Ribbon"|| product.Type == "P-Ribbon"){
             li.Specs = [
                 {
                     SpecID: baseRibbonSpec.ID,
                     OptionID:baseRibbonSpec.Options[0].ID, // Assuming that the spec option with -100 percent Markdown is 1st in array
                     Value:"Base Ribbon"
                 }
             ];
                console.log("here is thing", Specs);
            }
            queue.push(OrderCloud.LineItems.Create(order.ID, li) );
        });
        $q.all(queue).then(function(data){
            dfd.resolve();
            console.log(data);

            $state.go('checkout');
        });
        return dfd.promise

    }

    //randomly generate string id
    function idGenerate() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }





        /*-----------Helper Functions--------------------------------------------
         Function  that abstract work for other functions----------
         ----------------------------------------------------------------------*/

    // Takes an array of objects and sums up 1 key property on all the objects in the array
    // in this case it is price
    function totalPriceSum() {
        if(vm.itemCreated.selectionsMade.length > 0){

            var corsageTotal = vm.itemCreated.selectionsMade.map(function (product) {
                return product.Price;
            });
            return corsageTotal.reduce(function (a, b) {
                return a + b
            });
        }else {
            return null;
        }


    }

    function hideOptions(){
        vm.requirementsMetForMVP = false;

    }

    function showOptionalAccessories(){
        vm.requirementsMetForMVP = true;
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
        console.log("Im working");

        var selected = vm.itemCreated.selectionsMade.map(function (product) {
            return product.Type;
        });
        var matchingRequirements =_.intersection(finalObject.Requirements,  selected);

        vm.itemCreated.Requirements.length == matchingRequirements.length ? showOptionalAccessories() : vm.requirementsMetForMVP = false;
    }


}

