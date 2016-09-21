describe('Component: Catalog Product', function() {
    var scope,
        q,
        oc,
        localForage,
        mockOrderID,
        mockProductID,
        mockProduct,
        productResolve,
        specListResolve
        ;
    beforeEach(module(function($provide) {
        $provide.value('Order', {ID: mockOrderID})
    }));
    beforeEach(module(function($provide) {
        $provide.value('LineItem', {ProductID:mockProductID})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud, $localForage) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        localForage = $localForage;
        mockOrderID = 'MockOrderID123';
        mockProductID = 'MockProductID123';
        mockProduct = {
            "ID": mockProductID,
            "Name": "MockProductName",
            "Description": "mockDescription"
        };
        productResolve = {product1: 'fakeProduct1'};
        specListResolve = 'fakeSpeclist';
    }));
    describe('Configuration: ProductConfig', function() {
        var state,
            stateParams,
            mockSpecProductAssignment,
            mockSpecsGet
            ;
        describe('State: catalog.product', function() {
            beforeEach(inject(function($stateParams, $state) {
                state = $state.get('catalog.product', {}, {reload: true});
                stateParams = $stateParams;
                stateParams.productid= mockProductID;
                mockSpecProductAssignment = {
                    "Meta": {},
                    "Items": [{"SpecID":"SpecAssignmentID123"}]
                };
                mockSpecsGet = {
                    "Meta": {},
                    "Items":[{
                        "ID": "SpecsID12345",
                        "Name": "SpecName1234",
                        "DefaultValue": "mockDefaultValue",
                        "DefaultOptionID": "mockDefaultOptionID",
                        "OptionID": "mockOptionID",
                        "Value":"mockValue"
                    }]
                };
                var productAssignmentDefer = q.defer();
                productAssignmentDefer.resolve(mockSpecProductAssignment);
                var specDefer = q.defer();
                specDefer.resolve(mockSpecsGet);

                spyOn(oc.Me,'GetProduct');
                spyOn(oc.Specs,'ListProductAssignments').and.returnValue(productAssignmentDefer.promise);
                spyOn(oc.Specs, 'Get').and.returnValue(specDefer.promise)
            }));
            it('should resolve Product', inject(function($injector) {
                $injector.invoke(state.resolve.Product);
                expect(oc.Me.GetProduct).toHaveBeenCalledWith(mockProductID);
            }));
            it('should resolve SpecList', inject(function($injector) {
                $injector.invoke(state.resolve.SpecList);
                expect(oc.Specs.ListProductAssignments).toHaveBeenCalledWith(null, mockProductID);
                scope.$digest();
                expect(oc.Specs.Get).toHaveBeenCalledWith("SpecAssignmentID123");
            }));
        });
        describe('State: catalog.lineitem', function() {
            var state,
                stateParams
                ;
            beforeEach(inject(function($stateParams, $state) {
                state = $state.get('catalog.lineitem');
                stateParams = $stateParams;
                stateParams.lineitemid = 'mockLineItemID';

                var productAssignmentDefer = q.defer();
                productAssignmentDefer.resolve(mockSpecProductAssignment);
                var specDefer = q.defer();
                specDefer.resolve(mockSpecsGet);

                spyOn(oc.LineItems, 'Get');
                spyOn(oc.Me, 'GetProduct');
                spyOn(oc.Specs, 'ListProductAssignments').and.returnValue(productAssignmentDefer.promise);
                spyOn(oc.Specs, 'Get').and.returnValue(specDefer.promise);
            }));
            it('should resolve LineItem', inject(function($injector) {
                $injector.invoke(state.resolve.LineItem);
                expect(oc.LineItems.Get).toHaveBeenCalledWith(mockOrderID, 'mockLineItemID');
            }));
            it('should resolve LI_Product', inject(function($injector) {
                $injector.invoke(state.resolve.LI_Product);
                expect(oc.Me.GetProduct).toHaveBeenCalledWith('MockProductID123');
            }));
            it('should resolve LI_SpecList', inject(function($injector) {
                $injector.invoke(state.resolve.LI_SpecList);
                expect(oc.Specs.ListProductAssignments).toHaveBeenCalledWith(null, 'MockProductID123');
                scope.$digest();
                expect(oc.Specs.Get).toHaveBeenCalledWith('SpecAssignmentID123');
            }))
        })
    });
    describe('Directive: OCSpecForm', function() {
        var element;
        beforeEach(inject(function($compile) {
            scope.mockProd = mockProduct;
            element = $compile('<oc-spec-form product="mockProd"></oc-spec-form>')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().product).toEqual(mockProduct);
        });
    });
    describe('Directive: SpecSelection', function() {
        var element
            ;
        beforeEach(inject(function($compile) {
            scope.mockSpecs = {"ID": "SpecsID12345", "OptionID": "mockOptionID"};
            element = $compile('<spec-select-field spec="mockSpecs"></spec-select-field>')(scope);
            scope.$digest();
            var defer = q.defer();
            defer.resolve({isOpenText:true});
            spyOn(oc.Specs,'GetOption').and.returnValue(defer.promise);
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().spec).toEqual({"ID": "SpecsID12345", "OptionID": "mockOptionID"});
        });
        it('should call Specs GetOption method if Spec OptionID changes', function() {
            scope.mockSpecs = {"ID": "SpecsID12345", "OptionID": 1};
            scope.$digest();
            expect(oc.Specs.GetOption).toHaveBeenCalledWith('SpecsID12345', 'mockOptionID');
            expect(oc.Specs.GetOption).toHaveBeenCalledWith('SpecsID12345', 1);
            expect(oc.Specs.GetOption.calls.count()).toEqual(2);
        });
    });
    describe('Directive: OCAddToOrder', function() {
        var element
            ;
        beforeEach(inject(function($compile) {
            scope.fakeProduct = mockProduct;
            element = $compile('<oc-add-to-order product="fakeProduct" formname="mockName"></oc-add-to-order>')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().product).toEqual(mockProduct);
            expect(element.isolateScope().formname).toBe("mockName");
        });
    });
    describe('Controller: ProductCtrl', function() {
        var productCtrl,
            addToOrder
            ;
        beforeEach(inject(function(AddToOrder, $controller, Order) {
            addToOrder = AddToOrder;
            order = Order;
            productCtrl = $controller('ProductCtrl', {
                Product:productResolve,
                SpecList:specListResolve,
                AddToOrder:addToOrder,
                Order:order
            });
            spyOn(AddToOrder,'Add');
        }));
        describe('addToCart', function() {
            it('should call AddToOrder Add method', function() {
                productCtrl.addToCart(mockProduct);
                expect(addToOrder.Add).toHaveBeenCalledWith(mockProduct);
            })
        })
    });
    describe('Controller: LineItemEditCtrl', function() {
        var lineItemEditCtrl,
            state,
            underscore,
            LIHelpers,
            LineItemResolve,
            LI_ProductResolve,
            LI_SpecListResolve
            ;
        beforeEach(inject(function(Underscore, LineItemHelpers, $controller, $state) {
            LI_SpecListResolve = [
                {
                    "ID": "SpecID1",
                    "Name": "SpecNameOriginal",
                    "Value": 2,
                    "OptionID": 3
                },
                {
                    "ID": "SpecID2",
                    "Name": "SpecNameChanged",
                    "Value": 4,
                    "OptionID": 5
                }
            ];
            LineItemResolve = {
                "Quantity":1,
                "ID": 'fakeLineItemID',
                "Specs": [{
                    "SpecID": "SpecID1",
                    "Name": "SpecNameChanged",
                    "Value": 18,
                    "OptionID": 20
                }]
            };
            LI_ProductResolve = {
                Product: 'FakeProduct',
                Quantity: 3
            };
            state = $state;
            underscore = Underscore;
            LIHelpers = LineItemHelpers;
            lineItemEditCtrl = $controller('LineItemEditCtrl', {
                $state:state,
                Underscore:underscore,
                LineItem:LineItemResolve,
                OrderCloud:oc,
                LineItemHelpers:LIHelpers,
                LI_Product:LI_ProductResolve,
                LI_SpecList: LI_SpecListResolve
            });
            var defer = q.defer();
            defer.resolve();
            spyOn(LIHelpers, 'SpecConvert');
            spyOn(oc.LineItems,'Patch').and.returnValue(defer.promise);
            spyOn(state, 'go');
            lineItemEditCtrl.UpdateLineItem();
        }));
        describe('UpdateLineItem', function() {
            it('should call LineItemHelpers SpecConvert method', function() {
                expect(LIHelpers.SpecConvert).toHaveBeenCalled();
            });
            it('should call LineItems Patch method', function() {
                expect(oc.LineItems.Patch).toHaveBeenCalled();
            });
            it('should take user to cart once line items have been updated', function() {
                expect(oc.LineItems.Patch).toHaveBeenCalled();
                scope.$digest();
                expect(state.go).toHaveBeenCalledWith('cart');
            })
        })
    })
});