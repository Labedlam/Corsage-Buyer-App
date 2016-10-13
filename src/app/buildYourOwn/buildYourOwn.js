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
                    var queue =[]
                    //go through each type (Wrislet Corsage, Pin on, BOut) and
                    angular.forEach(Catalog.Items, function (value) {

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
                OptionsAvailableForAllTypes: function (SelectionCategories) {
                    //take optional categories available to all types and set them as options for each type
                    //find optionalEmbellishments  and Optional floral Accessories
                    var optionsArray = SelectionCategories.types;
                    var removed = [];
                    var optEmbAndAccessories = ["OpEmb", "OpFloralAcc"];

                    //take those object out of the selection array
                    angular.forEach(optEmbAndAccessories, function (value) {

                        var index = _.findIndex(optionsArray, function (option) {
                            return option.ParentID == value
                        });
                        removed.push((optionsArray.splice(index, 1))[0]);
                    });

                    //set name on optional categories
                    removed[0].Name = "Optional Embellishments";
                    removed[1].Name = "Optional Floral Accessories";

                    //store copies of them in type options array
                    angular.forEach(optionsArray, function (value) {
                        value.Options = value.Options.concat(removed);

                    });
                    return optionsArray;
                },
                Specs: function ($q, OrderCloud) {
                    //free base ribbon products
                    // hard coding one ribbon product in product assignment call because the same spec is assigned to all the products
                    var specQueue = [];
                    var dfd = $q.defer();

                    OrderCloud.Specs.ListProductAssignments(null, "HunterRibbon")
                        .then(function (data) {
                            angular.forEach(data.Items, function (assignment) {
                                specQueue.push(OrderCloud.Specs.Get(assignment.SpecID));
                            });
                            $q.all(specQueue)
                                .then(function (result) {
                                    var specOptionsQueue = [];
                                    angular.forEach(result, function (spec) {
                                        spec.Value = spec.DefaultValue;
                                        spec.OptionID = spec.DefaultOptionID;
                                        spec.Options = [];
                                        if (spec.OptionCount) {
                                            specOptionsQueue.push((function () {
                                                var d = $q.defer();
                                                OrderCloud.Specs.ListOptions(spec.ID, null, 1, spec.OptionCount)
                                                    .then(function (optionData) {
                                                        spec.Options = optionData.Items;
                                                        d.resolve();
                                                    });
                                                return d.promise;
                                            })());
                                        }
                                    });
                                    $q.all(specOptionsQueue).then(function () {
                                        dfd.resolve(result);
                                    });
                                });
                        })
                        .catch(function (response) {

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

function BuildYourOwnController($q, $state, OrderCloud, OptionsAvailableForAllTypes, CurrentOrder, Order, Specs) {
    // select type
    // based off selection show the required options
    // every time you select an option populate the next required or available options
    var vm = this;
    //Gets spec for base ribbon which should be free
    var baseRibbonSpec = Specs[0];
    //NOTE: for uib Collapse if it is true it hides the content (Sets first panel Open when page loads)
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
    //custom corsage queue display
    vm.customQueueDisplay = false;

    // set initial collapse
    vm.setCollapse = function (type) {
        if (!vm[type.ID]) {
            vm[type.ID] = {};
            vm[type.ID].isNavCollapsed = true;
        } else {
            vm[type.ID].isNavCollapsed = !vm[type.ID].isNavCollapsed;
        }
    };
    // first type chosen, resets type if already chosen
    vm.typeSelected = function (type) {
        //reset Corsage Queue
        if (vm.typeChosen) {
            vm.itemCreated.selectionsMade = [];
            vm.itemCreated.totalPrice = null;
            vm.itemCreated.Type = type.Name;
            hideOptions();
        }
        //set type chosen
        vm.typeChosen = _.findWhere(vm.categories, {ParentID: type.ParentID});
        vm.typeChosen.Name = type.Name;

        //collapses type header
        vm.showType = true;

        //open custom corsage queue
        vm.customQueueDisplay = true;
        //sets 1st choice(Base Flower Choices)body to open
        vm[type.Options[0].ID] = {};
        vm[type.Options[0].ID].isNavCollapsed = true;

        vm.itemCreated.Type = type.Name;
        setRequirements(vm.itemCreated);

    };


    // adds product chosen to Corsage Queue
    vm.addSelection = function (selection, category, parentArray, outerIndex) {
        // console.log("this is object being passed through function", selection, "this is category passed in function", category);
        // console.log("parentArray", parentArray);
        // console.log("outerIndex", outerIndex);

        if (selection.Products && category.Name == "Base Flower Choices") {

            vm.baseFlowerChosen = {};
            vm.baseFlowerChosen.Products = selection.Products;
            vm.baseFlowerChosen.Name = "Colors";
            vm.baseFlowerChosen.ID = category.ID + "Color";

            checkAndSetObjectBaseFlower(vm.typeChosen.Options,vm.baseFlowerChosen, parentArray, outerIndex)

        }
        else if(selection.Products){
            angular.noop();
        }
        else {

            var chosen = {};
            chosen.Type = category.ID;
            chosen.ID = selection.ID;
            chosen.Name = selection.Name;
            chosen.Price = selection.StandardPriceSchedule.PriceBreaks[0].Price;
            chosen.Quantity = 1;
            chosen.Show = false;

            // if required ribbon - price is free
            if (chosen.Type == "W-Ribbon" || chosen.Type == "P-Ribbon") {
                chosen.Price = 0;
            }
            
            checkAndSetProduct(vm.itemCreated.selectionsMade, chosen, parentArray, outerIndex);
            vm.itemCreated.totalPrice = totalPriceSum();
            checkRequirementsOfType(vm.itemCreated);

        }
    };

    vm.removeSelection = function (selection) {
        // find selection in array
        var selectionIndex = _.findIndex(vm.itemCreated.selectionsMade, function (product) {
            return product.ID == selection.ID
        });
        // remove it
        vm.itemCreated.selectionsMade.splice(selectionIndex, 1);

        // check that minimum requirements are met
        checkRequirementsOfType(vm.itemCreated);

        // update total price
        vm.itemCreated.totalPrice = totalPriceSum();
    };

    vm.addToCart = function () {
        var selections = vm.itemCreated.selectionsMade;
        var genID = idGenerate();
        //check if there is an order


        if (Order) {
            createLineItemXpCorsage(selections, genID, Order, vm.itemCreated.Type);
        } else {
            //create an order
            OrderCloud.Orders.Create({})
                .then(function (order) {
                    CurrentOrder.Set(order.ID)
                        .then(function (data) {
                            createLineItemXpCorsage(selections, genID, order, vm.itemCreated.Type);
                        })
                });
        }
    };

    /*-----------Helper Functions--------------------------------------------
     Function  that abstract work for other functions----------
     ----------------------------------------------------------------------*/

    //For BaseFlower : checks to see if object exist with in specified array, otherwise places that object into the specified array
    // if selected category has flower color choices , set object into options array
    //categoryArray & categoryIndex are  used to help determine which option to uncollapse in Category choices
    function checkAndSetObjectBaseFlower (array, object, categoryArray, categoryIndex){
        var checkIfChosenExists = _.findIndex(array, function (objectType) {
            return objectType.Name == object.Name;
        });
        if (checkIfChosenExists > -1) {
            _.extend(array[checkIfChosenExists], object);
            openNextHeader(categoryArray, categoryIndex);
        } else {
            array.splice(1, 0, object);
            openNextHeader(categoryArray, categoryIndex);
        }
    };

    //checks to see if object exist with in specified array, otherwise places that object into the specified array
    function checkAndSetProduct(array, object, categoryArray, categoryIndex){

        var checkIfChosenExists = _.findIndex(array, function (objectType) {
            return objectType.Type == object.Type
        });
        //look through array of selections made, if there is a object with a key Type that match the categoryId it will return true
        if (checkIfChosenExists > -1) {
            _.extend(array[checkIfChosenExists], object);
            categoryArray && categoryIndex ? openNextHeader(categoryArray, categoryIndex) : angular.noop();
        } else {
            vm.itemCreated.selectionsMade.push(object);
            categoryArray && categoryIndex ? openNextHeader(categoryArray, categoryIndex) : angular.noop();

        }

    }

    // go though itemCreated.selectionsMade array, create a new line item for each object in that array
    // Also add the xp.CustomCorsage with the same unique ID for all
    function createLineItemXpCorsage(productArray, genID, order, type) {
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(productArray, function (product) {
            var li = {
                ProductID: product.ID,
                Quantity: product.Quantity,
                xp: {customCorsage: genID, type: type}
            };

            if (product.Type == "W-Ribbon" || product.Type == "P-Ribbon") {
                li.Specs = [
                    {
                        SpecID: baseRibbonSpec.ID,
                        OptionID: baseRibbonSpec.Options[0].ID, // Assuming that the spec option with -100 percent Markdown is 1st in array
                        Value: "Base Ribbon"
                    }
                ];
            }
            queue.push(OrderCloud.LineItems.Create(order.ID, li));
        });
        $q.all(queue).then(function (data) {
            dfd.resolve();

            $state.go('checkout');
        });
        return dfd.promise

    }

    //randomly generate string id
    function idGenerate() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    // open next header in array
    // accounts for multiple scenarios
    function openNextHeader(array, index) {

        if (!vm[array[index + 1].ID]) {
            vm[array[index + 1].ID] = {};
            vm[array[index + 1].ID].isNavCollapsed = true;
            vm[array[index].ID].isNavCollapsed = !vm[array[index].ID].isNavCollapsed;
        }
        else if((vm[array[index].ID].isNavCollapsed == true) && (vm[array[index + 1].ID].isNavCollapsed == false)){
            vm[array[index].ID].isNavCollapsed = !vm[array[index].ID].isNavCollapsed;
            vm[array[index + 1].ID].isNavCollapsed = !vm[array[index].ID].isNavCollapsed;
        }
        else if(vm[array[index].ID].isNavCollapsed == true){
            vm[array[index].ID].isNavCollapsed = !vm[array[index].ID].isNavCollapsed;
        }
        else {
            vm[array[index].ID].isNavCollapsed = !vm[array[index].ID].isNavCollapsed;
            vm[array[index + 1].ID].isNavCollapsed = !vm[array[index + 1].ID].isNavCollapsed;
        }

    };

    // Takes an array of objects and sums up 1 key property on all the objects in the array
    // in this case it is price
    function totalPriceSum() {
        if (vm.itemCreated.selectionsMade.length > 0) {

            var corsageTotal = vm.itemCreated.selectionsMade.map(function (product) {
                return product.Price;
            });
            return corsageTotal.reduce(function (a, b) {
                return a + b
            });
        } else {
            return null;
        }


    }


    function hideOptions() {
        vm.requirementsMetForMVP = false;

    }

    function showOptionalAccessories() {
        vm.requirementsMetForMVP = true;
     }
    
    //Sets up the requirements
    function setRequirements(finalObject) {
        switch (finalObject.Type) {
            case "Wristlet Corsage":
                // an array of the category ID's
                finalObject.Requirements = ["BF-WristletColor", "W-Ribbon", "W-Fastener"];
                break;
            case "Pin-On Corsage" :
                finalObject.Requirements = ["BF-PinOnColor", "P-Ribbon"];
                break;
            case "Boutonierre":
                finalObject.Requirements = ["BF-BoutColor"];

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
        var matchingRequirements = _.intersection(finalObject.Requirements, selected);

        vm.itemCreated.Requirements.length == matchingRequirements.length ? showOptionalAccessories() : vm.requirementsMetForMVP = false;
    }


}

