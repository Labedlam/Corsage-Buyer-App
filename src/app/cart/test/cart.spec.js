describe('Component: Cart', function() {
    var scope,
        q,
        oc,
        currentOrder,
        lineItemHelpers,
        lineItemsList,
        fakeOrder,
        user
        ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud, CurrentOrder, LineItemHelpers) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        currentOrder = CurrentOrder;
        lineItemHelpers = LineItemHelpers;
        fakeOrder = {
            ID: "TestOrder123456789",
            Type: "Standard",
            FromUserID: "TestUser123456789",
            BillingAddressID: "TestAddress123456789",
            ShippingAddressID: "TestAddress123456789",
            SpendingAccountID: null,
            Comments: null,
            PaymentMethod: null,
            CreditCardID: null,
            ShippingCost: null,
            TaxCost: null
        };
         lineItemsList = {
            "Items" : [{}, {}],
            "Meta" : {
                "Page": 1,
                "PageSize": 20,
                "TotalCount":29,
                "TotalPages": 3,
                "ItemRange" : [1,2]
             }
        };
        user = {
            ID: "TestUser132456789",
            xp: {
                defaultShippingAddressID: "TestAddress123456789",
                defaultBillingAddressID: "TestAddress123456789",
                defaultCreditCardID: "creditCard"
            }

        };
    }));

    describe('State: cart', function() {
        var state;
        var noOrder;
        var lineItemData={Items:[{}, {}]};
        beforeEach(inject(function($state) {
            state = $state.get('cart');
            var defer = q.defer();
            defer.resolve(lineItemData);
            spyOn(currentOrder, 'Get').and.returnValue(defer.promise);
            spyOn($state, 'go');
            spyOn(oc.LineItems,'List').and.returnValue(defer.promise);
            spyOn(lineItemHelpers,'GetProductInfo').and.returnValue(defer.promise);

        }));
        it('should resolve Order', inject(function($injector) {
            $injector.invoke(state.resolve.Order, scope, {CurrentOrder: currentOrder});
            expect(currentOrder.Get).toHaveBeenCalled();
        }));
        it('should resolve CurrentOrderResolve when Order is not defined', inject(function($injector, $state) {
            $injector.invoke(state.resolve.CurrentOrderResolve,scope, {Order:noOrder});
            expect($state.go).toHaveBeenCalled();
        }));
        it('should resolve LineItemList when line Items are available', inject(function($injector) {
            $injector.invoke(state.resolve.LineItemsList, scope, {Order: fakeOrder});
            expect(oc.LineItems.List).toHaveBeenCalledWith(fakeOrder.ID);
            scope.$digest();
            expect(lineItemHelpers.GetProductInfo).toHaveBeenCalledWith(lineItemData.Items);
        }));
    });

    describe('Controller : CartController',function() {
        var cartController;
        beforeEach(inject(function($state, $controller) {
            cartController = $controller('CartCtrl', {
                $scope: scope,
                Order: fakeOrder,
                LineItemsList: lineItemsList,
                LineItemHelpers: lineItemHelpers
            });
            var defer = q.defer();
            defer.resolve(lineItemsList);
            spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
            spyOn(lineItemHelpers,'GetProductInfo').and.returnValue(defer.promise);
            spyOn(oc.Orders,'Get').and.returnValue(defer.promise);
        }));

        describe('PagingFunction',function() {
         it('should call LineItems List Method', function() {
             cartController.pagingfunction();
             expect(oc.LineItems.List).toHaveBeenCalledWith(fakeOrder.ID,lineItemsList.Meta.Page + 1,lineItemsList.Meta.PageSize);
             scope.$digest();
             expect(lineItemHelpers.GetProductInfo).toHaveBeenCalledWith(lineItemsList.Items);
         });
        });
        describe('OC:UpdateOrder',function() {
            it('should call Orders Get Method', inject(function($rootScope) {
                $rootScope.$broadcast('OC:UpdateOrder' ,fakeOrder.ID);
                scope.$digest();
                expect(oc.Orders.Get).toHaveBeenCalledWith(fakeOrder.ID);
            }))
        });
    });

    describe('Controller: MiniCartController',function() {
        var miniCartController;
        beforeEach(inject(function($state, $controller) {
            miniCartController = $controller('MiniCartCtrl', {
                $scope: scope,
                CurrentOrder: currentOrder,
                LineItemHelpers: lineItemHelpers
            });
            var defer = q.defer();
            defer.resolve(lineItemsList);
            spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
            spyOn(lineItemHelpers, 'GetProductInfo').and.returnValue(defer.promise);

            var orderdfd = q.defer();
            orderdfd.resolve(fakeOrder);
            spyOn(currentOrder, 'Get').and.returnValue(orderdfd.promise);
        }));

        it('should call Get Method on Current Order and lineItemCall', function() {
            spyOn(miniCartController, 'lineItemCall').and.callThrough();
            miniCartController.getLI();
            expect(currentOrder.Get).toHaveBeenCalled();
            scope.$digest();
            expect(miniCartController.lineItemCall).toHaveBeenCalledWith(fakeOrder);
        });

        describe('should resolve lineItemCall', function() {
            beforeEach(function() {
                miniCartController.lineItemCall('mockOrder');
                scope.$digest();

            });
            it('should call lineItems list method', function() {
                expect(oc.LineItems.List).toHaveBeenCalled();
                scope.$digest();
                expect(miniCartController.LineItems).toBe(lineItemsList);
            });
            it('should call method list according to length of pages ', function() {
                expect(oc.LineItems.List.calls.count()).toEqual(3);
            });
            it('should call method GetProductInfo ', function() {
                expect(lineItemHelpers.GetProductInfo).toHaveBeenCalled();
            });
        });
        describe('LineItemAddedToCart',function() {
            it('should call Orders Get Method ', inject(function($rootScope) {
                spyOn(miniCartController, 'lineItemCall').and.callThrough();
                $rootScope.$broadcast('LineItemAddedToCart' ,fakeOrder);
                scope.$digest();
                expect(miniCartController.lineItemCall).toHaveBeenCalledWith(fakeOrder);
                expect(miniCartController.showLineItems).toEqual(true);
            }))
        });
        describe('OC:RemoveOrder',function() {
            it('should set Order to Null and LineItems to empty object', inject(function($rootScope) {
                $rootScope.$broadcast('OC:RemoveOrder');
                scope.$digest();
                expect(miniCartController.Order).toEqual(null);
                expect(miniCartController.LineItems).toBeTruthy();
            }))
        });
    });

});