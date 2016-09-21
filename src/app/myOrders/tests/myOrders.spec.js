describe('Component: MyOrders', function() {
    var scope,
        q,
        order,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        order = {
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
        oc = OrderCloud;
    }));

    describe('State: myOrders', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('myOrders');
            spyOn(oc.Orders, 'List').and.returnValue(null);
        }));
        it('should resolve OrderList', inject(function($injector) {
            $injector.invoke(state.resolve.OrderList);
            expect(oc.Orders.List).toHaveBeenCalledWith('incoming');
        }));
    });

    describe('State: myOrders.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('myOrders.edit');
            spyOn(oc.Orders, 'Get').and.returnValue(null);
            spyOn(oc.LineItems, 'List').and.returnValue(null);
        }));
        it('should resolve SelectedOrder', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedOrder);
            expect(oc.Orders.Get).toHaveBeenCalledWith($stateParams.orderid);
        }));
        it('should resolve LineItemList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.LineItemList);
            expect(oc.LineItems.List).toHaveBeenCalledWith($stateParams.orderid);
        }));
    });
    

    describe('Controller: MyOrderEditCtrl', function() {
        var orderEditCtrl, lineItem;
        beforeEach(inject(function($state, $controller) {
            orderEditCtrl = $controller('MyOrderEditCtrl', {
                $scope: scope,
                SelectedOrder: order,
                LineItemList: []
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('deleteLineItem', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(null);
                spyOn(oc.LineItems, 'Delete').and.returnValue(defer.promise);
                lineItem = {
                    ID: 'potato'
                };
                orderEditCtrl.deleteLineItem(lineItem);
                scope.$digest();
            });
            it ('should call the LineItems Delete method', function() {
                expect(oc.LineItems.Delete).toHaveBeenCalledWith(orderEditCtrl.orderID, lineItem.ID);
            });
        });

        describe('Submit', function() {
            beforeEach(function() {
                orderEditCtrl.order = order;
                orderEditCtrl.orderID = "TestOrder123456789";
                var defer = q.defer();
                defer.resolve(order);
                spyOn(oc.Orders, 'Update').and.returnValue(defer.promise);
                orderEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Orders Update method', function() {
                expect(oc.Orders.Update).toHaveBeenCalledWith(orderEditCtrl.orderID, orderEditCtrl.order);
            });
            it ('should enter the orders state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('myOrders', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(order);
                spyOn(oc.Orders, 'Delete').and.returnValue(defer.promise);
                orderEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Orders Delete method', function() {
                expect(oc.Orders.Delete).toHaveBeenCalledWith(order.ID);
            });
            it ('should enter the orders state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('myOrders', {}, {reload: true});
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(null);
                spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
                scope.$digest();
                orderEditCtrl.order = order;
                orderEditCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                orderEditCtrl.pagingfunction();
            });
            it ('should call the LineItems List method', function() {
                expect(oc.LineItems.List).toHaveBeenCalledWith(orderEditCtrl.order.ID, orderEditCtrl.list.Meta.Page +1, orderEditCtrl.list.Meta.PageSize);
            });
        });
    });

    describe('Factory: MyOrdersTypeAheadSearchFactory', function() {
        var ordersService, term;
        beforeEach(inject(function(MyOrdersTypeAheadSearchFactory) {
            ordersService = MyOrdersTypeAheadSearchFactory;
            var defer = q.defer();
            defer.resolve(null);
            spyOn(oc.SpendingAccounts, 'List').and.returnValue(defer.promise);
            spyOn(oc.Addresses, 'List').and.returnValue(defer.promise);
            spyOn(oc.Addresses, 'ListAssignments').and.returnValue(defer.promise);
        }));

        describe('SpendingAccountList', function() {
            beforeEach(function() {
                term = "test";
                ordersService.SpendingAccountList(term);
            });

            it ('should call SpendingAccounts List method', function() {
                expect(oc.SpendingAccounts.List).toHaveBeenCalledWith(term);
            });
        });
        describe('ShippingAddressList', function() {
            beforeEach(function() {
                term = "test";
                ordersService.ShippingAddressList(term);
            });

            it ('should call Addresses List method and Addresses ListAssignments method', function() {
                expect(oc.Addresses.List).toHaveBeenCalledWith(term);
                expect(oc.Addresses.ListAssignments).toHaveBeenCalledWith(null, null, null, null, true);
            });
        });
        describe('BillingAddressList', function() {
            beforeEach(function() {
                term = "test";
                ordersService.BillingAddressList(term);
            });

            it ('should call Addresses List method Addresses ListAssignments method', function() {
                expect(oc.Addresses.List).toHaveBeenCalledWith(term);
                expect(oc.Addresses.ListAssignments).toHaveBeenCalledWith(null, null, null, null, null, true);
            });
        });
    });
});

