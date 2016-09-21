describe('Component: Catalog ordercloud-order-input', function() {
    var scope,
        q,
        oc,
        state,
        appName,
        localForage,
        LIHelpers,
        underscore,
        currentorder
      ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud, $state, appname, $localForage, LineItemHelpers, Underscore, CurrentOrder) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        state = $state;
        appName = appname;
        localForage = $localForage;
        LIHelpers = LineItemHelpers;
        underscore = Underscore;
        currentorder = CurrentOrder;
    }));
    describe('Directive: ordercloud', function() {
        var element;
        beforeEach(inject(function($compile) {
            scope.productname = {name: 'fakeProductName'};
            scope.fakeform = 'fakeFormName';
            element = $compile('<ordercloud-order-input product="productname" validationform="fakeform"></ordercloud-order-input>')(scope);
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().product).toEqual({name: 'fakeProductName'});
            expect(element.isolateScope().validationform).toEqual('fakeFormName');
        })

    });
    describe('Controller: OrderInputCtrl', function() {
        var orderInputCtrl,
            mockOrderID,
            mockLineItems
            ;
        beforeEach(inject(function($controller) {
            mockOrderID = 'mockOrderID123';
            mockLineItems = {"Meta":{},
                "Items":[{
                    "ID": "fakeLineItem1",
                    "ProductID": "123",
                    "Quantity": 3
                }]
            };
            mockOrder = {
                "ID": mockOrderID
            };

            orderInputCtrl = $controller('OrderInputCtrl', {
                $state:state,
                appname:appName,
                $scope:scope,
                $localForage:localForage,
                LineItemHelpers:LIHelpers,
                Underscore:underscore,
                CurrentOrder:currentorder
            });
            scope.product ={
                StandardPriceSchedule:{
                    PriceBreaks:{
                        priceBreak1:{
                            Quantity:4,
                            Price:2
                        }
                    }
                },
                ID:12,
                Specs:"fakeSpec1"
            };

            var mockOrderDefer = q.defer();
            mockOrderDefer.resolve(mockOrder);

            var mockLineItemDefer = q.defer();
            mockLineItemDefer.resolve(mockLineItems);

            orderInputCtrl.Quantity = 5;
            orderInputCtrl.price = null;
            orderInputCtrl.currentState = 'initialState';
            spyOn(currentorder, 'GetLineItems').and.returnValue(mockLineItemDefer.promise);
            spyOn(oc.Orders, 'Create').and.returnValue(mockOrderDefer.promise);
            spyOn(currentorder, 'Set');
            spyOn(LIHelpers, 'SpecConvert').and.returnValue('convertedSpec');
            spyOn(oc.LineItems, 'Create').and.returnValue(mockLineItemDefer.promise);
        }));
        describe('$stateChangeSuccess listener', function() {
            it('should change value current state when broadcasted', inject(function($rootScope) {
                expect(orderInputCtrl.currentState).toBe('initialState');
                $rootScope.$broadcast('$stateChangeSuccess', {name: 'newState'});
                expect(orderInputCtrl.currentState).toBe('newState');
            }))
        });
        describe('$watch expression on quantity entered',  function() {
            it('should update price if quantity entered is greater than quantity on restricted price schedule', function() {
                expect(orderInputCtrl.price).toBe(null);
                orderInputCtrl.Quantity = 2;
                scope.$digest();
                orderInputCtrl.Quantity = 5;
                scope.$digest();
                expect(orderInputCtrl.price).toBe(10);
            });
            it('should not update price if entered quantity does not change', function() {
                expect(orderInputCtrl.price).toBe(null);
                orderInputCtrl.Quantity = 2;
                scope.$digest();
                orderInputCtrl.Quantity = 2;
                scope.$digest();
                expect(orderInputCtrl.price).toBe(null);
            });
            it('should not update price if quantity entered changes but is less than that on restricted price schedule', function() {
                expect(orderInputCtrl.price).toBe(null);
                orderInputCtrl.Quantity = 2;
                scope.$digest();
                orderInputCtrl.Quantity = 3;
                scope.$digest();
                expect(orderInputCtrl.price).toBe(null);
            })
        });
        describe('addToCart', function() {
            describe('with a current order available', function() {
                beforeEach(function() {
                    var mockOrderDefer = q.defer();
                    mockOrderDefer.resolve(mockOrder);
                    spyOn(currentorder, 'Get').and.returnValue(mockOrderDefer.promise);
                    orderInputCtrl.addToCart();
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
                    expect(oc.LineItems.Create).toHaveBeenCalledWith(mockOrderID, {ProductID: 12, Quantity:5, Specs: 'convertedSpec', ShippingAddressID: null})
                })
            });
            describe('without current order available', function() {
                beforeEach(function() {
                    var mockOrderDefer = q.defer();
                    mockOrderDefer.reject();
                    spyOn(currentorder, 'Get').and.returnValue(mockOrderDefer.promise);
                    orderInputCtrl.addToCart();
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
                    expect(oc.LineItems.Create).toHaveBeenCalledWith(mockOrderID, {ProductID: 12, Quantity: 5, Specs: 'convertedSpec', ShippingAddressID: null})
                })
            })

        })
    });

});