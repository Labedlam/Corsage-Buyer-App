describe('Component: Catalog', function() {
    var scope,
        q,
        oc,
        underscore,
        addToOrderFactory,
        currentorder,
        LIHelpers,
        mockCatalogTreeService,
        mockOrder,
        mockOrderID,
        mockLineItems,
        mockProduct,
        mockCategoryList,
        mockCategoryItems
        ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud, Underscore, CurrentOrder, AddToOrder, LineItemHelpers, CatalogTreeService) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
        underscore = Underscore;
        currentorder = CurrentOrder;
        addToOrderFactory = AddToOrder;
        LIHelpers = LineItemHelpers;
        mockCatalogTreeService = CatalogTreeService;
        mockOrderID = "TestOrder123456789";
        mockOrder = {
                "ID": mockOrderID,
                "Name": "TestOrder Name",
                "ProductID":"123",
                "Quantity": 3
            };
        mockLineItems = {
            "Meta": {},
            "Items": [{
                "ID": "TestLineItem123456789",
                "Name": "TestLineItem Name"
            }]
        };
        mockProduct ={
            StandardPriceSchedule:{
                PriceBreaks:{
                    priceBreak1:{
                        Quantity:4,
                        Price:2
                    }
                }
            },
            ID:12,
            Specs:"fakeSpec1",
            Quantity:5
        };
        mockCategoryItems = [
            {
                "ID": "TestCategory123",
                "Name": "Category1",
                "ParentID": null
            },
            {  "ID": "TestCategory456",
                "Name": "Category2",
                "ParentID":"TestCategory123"
            }];
        mockCategoryList = {
            "Meta": {},
            "Items": mockCategoryItems
        };

    }));
    describe('State: catalog', function() {
        var state;
        beforeEach(inject(function($state) {
            var defer = q.defer();
            defer.resolve();
            state = $state.get('catalog', {}, {reload: true});
            spyOn(oc.Me, 'ListCategories');
            spyOn(currentorder, 'Get').and.returnValue(defer.promise)
        }));
        it('should resolve Catalog', inject(function($injector) {
            $injector.invoke(state.resolve.Catalog);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null,1);
        }));
        it('should resolve Order', inject(function($injector) {
            $injector.invoke(state.resolve.Order);
            expect(currentorder.Get).toHaveBeenCalled();
        }))
    });
    describe('Factory: AddToOrder', function() {
        beforeEach(function() {
            var orderDefer = q.defer();
            orderDefer.resolve(mockOrder);

            var LIDefer = q.defer();
            LIDefer.resolve(mockLineItems);

            spyOn(currentorder, 'GetLineItems').and.returnValue(LIDefer.promise);
            spyOn(oc.Orders, 'Create').and.returnValue(orderDefer.promise);
            spyOn(currentorder, 'Set');
            spyOn(LIHelpers, 'SpecConvert').and.returnValue('convertedSpec');
            spyOn(oc.LineItems, 'Create').and.returnValue(LIDefer.promise);
        });
        describe('Add', function() {
            describe('with a current order available', function() {
                beforeEach(function() {
                    var mockOrderDefer = q.defer();
                    mockOrderDefer.resolve(mockOrder);
                    spyOn(currentorder, 'Get').and.returnValue(mockOrderDefer.promise);
                    addToOrderFactory.Add(mockProduct);
                    scope.$digest();
                });
                it('should call CurrentOrder Get method', function() {
                    expect(currentorder.Get).toHaveBeenCalled();
                });
                it('should call CurrentOrder GetLineItems method', function() {
                    expect(currentorder.GetLineItems).toHaveBeenCalledWith(mockOrderID);
                });
                it('should call the LineItemHelpers SpecConvert method', function() {
                    expect(LIHelpers.SpecConvert).toHaveBeenCalledWith('fakeSpec1');
                });
                it('should call the LineItems Create method', function() {
                    expect(oc.LineItems.Create).toHaveBeenCalledWith(mockOrderID, {ProductID:12, Quantity:5,Specs: 'convertedSpec', ShippingAddressID:null})
                })
            });
            describe('without current order available', function() {
                beforeEach(function() {
                    var mockOrderDefer = q.defer();
                    mockOrderDefer.reject();
                    spyOn(currentorder, 'Get').and.returnValue(mockOrderDefer.promise);
                    addToOrderFactory.Add(mockProduct);
                    scope.$digest();
                });
                it('should call CurrentOrder Get method', function() {
                    expect(currentorder.Get).toHaveBeenCalled();
                });
                it('should call Orders Create method', function() {
                    expect(oc.Orders.Create).toHaveBeenCalled();
                });
                it('should call CurrentOrder Set method', function() {
                    expect(currentorder.Set).toHaveBeenCalledWith(mockOrderID);
                });
                it('should call the LineItemHelpers SpecConvert method', function() {
                    expect(LIHelpers.SpecConvert).toHaveBeenCalledWith('fakeSpec1');
                });
                it('should call the LineItems Create method', function() {
                    expect(oc.LineItems.Create).toHaveBeenCalledWith(mockOrderID, {ProductID:12, Quantity:5,Specs: 'convertedSpec', ShippingAddressID:null})
                })
            })

        })
    });
    describe('Controller: CatalogCtrl', function() {
        var catalogCtrl,
            CatalogResolve,
            OrderResolve
            ;
        beforeEach(inject(function($state, $controller) {
            catalogCtrl = $controller('CatalogCtrl', {
                Catalog:CatalogResolve,
                Order: OrderResolve
            });
        }));
        describe('toggleTree', function() {
            it('should set showTree to true if initially false', function() {
                catalogCtrl.showTree = false;
                catalogCtrl.toggleTree();
                expect(catalogCtrl.showTree).toBe(true);
            });
            it('should set showTree to false if initially true', function() {
                catalogCtrl.showTree = true;
                catalogCtrl.toggleTree();
                expect(catalogCtrl.showTree).toBe(false);
            })
        })
    });
    describe('Directive: ordercloudCategoryList ', function() {
        var element,
            mockCategoryList
            ;
        beforeEach(inject(function($compile) {
            mockCategoryList = {"Name": 'fakeCategoryName', "ID":"category123"};
            element = $compile('<ordercloud-category-list categorylist ="mockCategoryList"></ordercloud-category-list>')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().categorylist).toBe({"Name": 'fakeCategoryName', "ID":"category123"});
        });
    });
    describe('Directive: ordercloudProductList ', function() {
        var element,
            mockProductList
        ;
        beforeEach(inject(function($compile) {
            mockProductList = {"Name": 'fakeProductName', "ID":"product123"};
            element = $compile('<ordercloud-product-list productlist ="mockProductList"></ordercloud-product-list>')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().productlist).toBe({"Name": 'fakeProductName', "ID":"product123"});
        });
    });
    describe('Controller: CatalogTreeService', function() {
        beforeEach(function() {
            var categoryListDefer = q.defer();
            categoryListDefer.resolve(mockCategoryList);

            var defer = q.defer();
            defer.resolve();

            spyOn(oc.Me, 'ListCategories').and.returnValue(categoryListDefer.promise);
            spyOn(underscore, 'where').and.callThrough();
            mockCatalogTreeService.GetCatalogTree();
            scope.$digest();
        });
        it('should call Me ListCategories', function() {
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null, 1, 100, null, null, null, 'all');
        });
        it('should call generate a tree by recursively calling getNode method', function() {
            expect(underscore.where).toHaveBeenCalledWith(mockCategoryItems, {ParentID: null});
            expect(underscore.where).toHaveBeenCalledWith(mockCategoryItems, {ParentID: 'TestCategory123'});
            expect(underscore.where).toHaveBeenCalledWith(mockCategoryItems, {ParentID: 'TestCategory456'});
            expect(underscore.where.calls.count()).toEqual(3);
        });

    });
    describe('Directive: CatalogTree ', function() {
        var element;
        describe('scope.tree is not defined', function() {
            beforeEach(inject(function($compile) {
                element = $compile('<catalog-tree ?="tree"></catalog-tree>')(scope);
                scope.$digest();
                spyOn(mockCatalogTreeService, 'GetCatalogTree');
            }));
            it('should initialize the isolate scope to undefined', function() {
                expect(element.isolateScope().tree).toBe(undefined);
            });
            it('should call GetCatalogTree method', function() {
                expect(mockCatalogTreeService.GetCatalogTree).toHaveBeenCalled();
            })
        });
        describe('scope.tree is defined', function() {
            beforeEach(inject(function($compile) {
                scope.mockTree = {"generatedTree":"a mock tree object"};
                element = $compile('<catalog-tree ?="mockTree"></catalog-tree>')(scope);
                scope.$digest();
                spyOn(mockCatalogTreeService, 'GetCatalogTree');
            }));
            it('should initialize the isolate scope to undefined', function() {
                expect(element.isolateScope().tree).toBe({"generatedTree":"a mock tree object"});
            });
            it('should call GetCatalogTree method', function() {
                expect(mockCatalogTreeService.GetCatalogTree).not.toHaveBeenCalled();
            })
        })
    });
    describe('Directive: catalogNode ', function() {
        var element
        ;
        beforeEach(inject(function($compile) {
            scope.mockNode = {
                "children":[1,2,3]
            };
            element = $compile('<catalog-node node="mockNode"> </catalog-node node="mockNode">')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().node).toBe({"children":[1,2,3]});
        });
    });
    describe('Directive: CatalogFacets ', function() {
        var element;
        beforeEach(inject(function($compile) {
            element = $compile('<ordercloud-catalog-facets></ordercloud-catalog-facets>')(scope);
            scope.$digest();
        }));
    });
    describe('Controller: CatalogFacetsService', function() {
        var mockCatalogFacetsService
            ;
        beforeEach(inject(function(CatalogFacetsService) {
            var defer = q.defer();
            defer.resolve();
            mockCatalogFacetsService = CatalogFacetsService;
            spyOn(oc.Categories, 'Get').and.returnValue(defer.promise);

        }));
        describe('GetCategoryFacets', function() {
            it('should call Categories Get method', function() {
                mockCatalogFacetsService.GetCategoryFacets('catID123');
                expect(oc.Categories.Get).toHaveBeenCalledWith('catID123');
            });
        })
    });
});


