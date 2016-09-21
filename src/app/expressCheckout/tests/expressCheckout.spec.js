//TODO: Fix this test to work with localforage.js
describe('Component: ExpressCheckout', function() {
    var scope,
        q,
        oc,
        user,
        payments,
        CCs,
        patchObj,
        addresses,
        order;
    beforeEach(module('orderCloud', function($provide) {
        $provide.value('CurrentUser', user);
    }));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        oc = OrderCloud;
        scope = $rootScope.$new();
        order = {
            ID: "TestOrder123456789",
            Type: "Standard",
            FromUserID: "TestUser123456789",
            Comments: null,
            ShippingCost: null,
            TaxCost: null,
            xp: {
                favorite: true
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
        payments = {
            Meta: {},
            Items: []
        };
        CCs = {
            Meta: {},
            Items: [{ID: 'creditCard'}]
        };
        patchObj = {
            BillingAddressID: "TestAddress123456789",
            ShippingAddressID: "TestAddress123456789"
        };
        addresses = {
            Meta: {},
            Items: [{ID: "TestAddress123456789", Shipping: true, Billing: true}]
        }
    }));

    describe('State: expressCheckout', function() {
        var state;
        beforeEach(inject(function($state, CurrentOrder) {
            state = $state.get('expressCheckout');

            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Me, 'Get').and.returnValue(defer.promise);
            spyOn(oc.Payments, 'Create').and.returnValue(defer.promise);
            spyOn(oc.Orders, 'Patch').and.returnValue(defer.promise);
            spyOn(oc.SpendingAccounts, 'List').and.returnValue(null);

            var orderdfd = q.defer();
            orderdfd.resolve(order);
            spyOn(CurrentOrder, 'Get').and.returnValue(orderdfd.promise);
            spyOn(oc.Orders, 'Get').and.returnValue(orderdfd.promise);


            var paymentsdfd = q.defer();
            paymentsdfd.resolve(payments);
            spyOn(oc.Payments, 'List').and.returnValue(paymentsdfd.promise);

            var CCdfd = q.defer();
            CCdfd.resolve(CCs);
            spyOn(oc.Me, 'ListCreditCards').and.returnValue(CCdfd.promise);

            var addressdfd = q.defer();
            addressdfd.resolve(addresses);
            spyOn(oc.Me, 'ListAddresses').and.returnValue(addressdfd.promise);


        }));
        it('should resolve CurrentUser', inject(function($injector) {
            $injector.invoke(state.resolve.CurrentUser);
            expect(oc.Me.Get).toHaveBeenCalled();
        }));
        it('should resolve Order', inject(function($injector, CurrentOrder) {
            $injector.invoke(state.resolve.Order);
            expect(CurrentOrder.Get).toHaveBeenCalled();
            scope.$digest();
            expect(oc.Me.ListAddresses).toHaveBeenCalled();
            expect(oc.Me.ListAddresses.calls.count()).toEqual(2);
            expect(oc.Orders.Patch).toHaveBeenCalledWith(order.ID, patchObj);
            expect(oc.Orders.Get).toHaveBeenCalledWith(order.ID);
        }));
        it('should resolve OrderPayments', inject(function($injector, CurrentOrder) {
            $injector.invoke(state.resolve.OrderPayments);
            expect(CurrentOrder.Get).toHaveBeenCalled();
            scope.$digest();
            expect(oc.Payments.List).toHaveBeenCalledWith(order.ID);
            expect(oc.Me.ListCreditCards).toHaveBeenCalled();
            expect(oc.Payments.Create).toHaveBeenCalledWith(order.ID, {Type: "CreditCard", CreditCardID: "creditCard"});
            expect(oc.Payments.List).toHaveBeenCalledWith(order.ID);
        }));
        it('should resolve SpendingAccounts', inject(function($injector) {
            $injector.invoke(state.resolve.SpendingAccounts);
            expect(oc.SpendingAccounts.List).toHaveBeenCalledWith(null, null, null, null, null, {'RedemptionCode': '!*'});
        }));
        it('should resolve CreditCards', inject(function($injector) {
            $injector.invoke(state.resolve.CreditCards);
            expect(oc.Me.ListCreditCards).toHaveBeenCalled();
        }));
        it('should resolve ShippingAddresses', inject(function($injector) {
            $injector.invoke(state.resolve.ShippingAddresses);
            expect(oc.Me.ListAddresses).toHaveBeenCalled();
        }));
        it('should resolve BillingAddresses', inject(function($injector) {
            $injector.invoke(state.resolve.ShippingAddresses);
            expect(oc.Me.ListAddresses).toHaveBeenCalled();
        }));
    });

    describe('State: expressOrderReview', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('expressOrderReview');
            var defer = q.defer();
            defer.resolve(order);
            spyOn(oc.Orders, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SubmittedOrder', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SubmittedOrder);
            expect(oc.Orders.Get).toHaveBeenCalledWith($stateParams.orderid);
        }));
    });

    describe('Controller: ExpressCheckoutController', function() {
        var expressCheckoutOrdeCtrl;
        beforeEach(inject(function($state, $controller) {
            var defer = q.defer();
            defer.resolve({
                Meta: {},
                Items: []
            });
            spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
            var dfd = q.defer();
            dfd.resolve();
            spyOn(oc.CreditCards, 'Get').and.returnValue(dfd.promise);
            spyOn(oc.SpendingAccounts, 'Get').and.returnValue(dfd.promise);
            spyOn($state, 'go').and.returnValue(true);
            expressCheckoutOrdeCtrl = $controller('ExpressCheckoutCtrl', {
                $scope: scope,
                Order: order,
                OrderPayments: {
                    Meta:[],
                    Items: [{Type: "CreditCard", CreditCardID: "creditCard"}]
                },
                CreditCards: CCs,
                SpendingAccounts: {},
                ShippingAddresses: addresses,
                BillingAddresses: addresses
            });
        }));
        describe('saveBillAddress', function() {
           beforeEach(inject(function($state) {
               expressCheckoutOrdeCtrl.currentOrder = order;
               expressCheckoutOrdeCtrl.currentOrder.BillingAddressID = "TestAddress123456789";
               var dfd = q.defer();
               dfd.resolve();
               spyOn(oc.Orders, 'Patch').and.returnValue(dfd.promise);
               spyOn($state, 'reload').and.returnValue(true);
               expressCheckoutOrdeCtrl.saveBillAddress();
               scope.$digest();
           }));
            it('should call the Orders Patch method', function() {
                expect(oc.Orders.Patch).toHaveBeenCalledWith(order.ID, {BillingAddressID: expressCheckoutOrdeCtrl.currentOrder.BillingAddressID});
            })
            it('should call the $state reload method', inject(function($state) {
                expect($state.reload).toHaveBeenCalled();
            }));
        });
        describe('saveShipAddress', function() {
            beforeEach(inject(function($state) {
                expressCheckoutOrdeCtrl.currentOrder = order;
                expressCheckoutOrdeCtrl.currentOrder.ShippingAddressID = "TestAddress123456789";
                var dfd = q.defer();
                dfd.resolve();
                spyOn(oc.Orders, 'Patch').and.returnValue(dfd.promise);
                spyOn($state, 'reload').and.returnValue(true);
                expressCheckoutOrdeCtrl.saveShipAddress();
                scope.$digest();
            }));
            it('should call the Orders Patch method', function() {
                expect(oc.Orders.Patch).toHaveBeenCalledWith(order.ID, {ShippingAddressID: expressCheckoutOrdeCtrl.currentOrder.ShippingAddressID});
            })
            it('should call the $state reload method', inject(function($state) {
                expect($state.reload).toHaveBeenCalled();
            }));
        });
        describe('setPaymentMethod', function() {
            beforeEach(inject(function($state) {
                expressCheckoutOrdeCtrl.orderPayments = [{ID: "payment", Type: "CreditCard", CreditCardID: "creditCard" }];
                var dfd = q.defer();
                dfd.resolve();
                spyOn(oc.Payments, 'Delete').and.returnValue(dfd.promise);
                spyOn(oc.Payments, 'Create').and.returnValue(dfd.promise);
                spyOn($state, 'reload').and.returnValue(true);
                expressCheckoutOrdeCtrl.setPaymentMethod(order);
                scope.$digest();
            }));
            it('should call the Payments Delete method', function() {
                expect(oc.Payments.Delete).toHaveBeenCalledWith(order.ID,  expressCheckoutOrdeCtrl.orderPayments[0].ID);
            });
            it('should call the Payments Create method', function() {
                expect(oc.Payments.Create).toHaveBeenCalledWith(order.ID,  {Type: expressCheckoutOrdeCtrl.orderPayments[0].Type});
            });
            it('should call the $state reload method', inject(function($state) {
                expect($state.reload).toHaveBeenCalled();
            }));
        });
        describe('setCreditCard', function() {
            beforeEach(inject(function($state) {
                expressCheckoutOrdeCtrl.orderPayments = [{ID: "payment", Type: "CreditCard", CreditCardID: "creditCard" }];
                var dfd = q.defer();
                dfd.resolve();
                spyOn(oc.Payments, 'Patch').and.returnValue(dfd.promise);
                spyOn($state, 'reload').and.returnValue(true);
                expressCheckoutOrdeCtrl.setCreditCard(order);
                scope.$digest();
            }));
            it('should call the Payments Patch method', function() {
                expect(oc.Payments.Patch).toHaveBeenCalledWith(order.ID, expressCheckoutOrdeCtrl.orderPayments[0].ID,  {CreditCardID: expressCheckoutOrdeCtrl.orderPayments[0].CreditCardID});
            });
            it('should call the $state reload method', inject(function($state) {
                expect($state.reload).toHaveBeenCalled();
            }));
        });
        describe('setSpendingAccount', function() {
            beforeEach(inject(function($state) {
                expressCheckoutOrdeCtrl.orderPayments = [{ID: "payment", Type: "SpendingAccount", SpendingAccountID: "spendingAccount" }];
                var dfd = q.defer();
                dfd.resolve();
                spyOn(oc.Payments, 'Patch').and.returnValue(dfd.promise);
                spyOn($state, 'reload').and.returnValue(true);
                expressCheckoutOrdeCtrl.setSpendingAccount(order);
                scope.$digest();
            }));
            it('should call the Payments Patch method', function() {
                expect(oc.Payments.Patch).toHaveBeenCalledWith(order.ID, expressCheckoutOrdeCtrl.orderPayments[0].ID,  {SpendingAccountID: expressCheckoutOrdeCtrl.orderPayments[0].SpendingAccountID});
            });
            it('should call the $state reload method', inject(function($state) {
                expect($state.reload).toHaveBeenCalled();
            }));
        });
        describe('submitOrder', function() {
            beforeEach(inject(function(CurrentOrder) {
                var defer = q.defer();
                defer.resolve(order);
                spyOn(oc.Orders, 'Submit').and.returnValue(defer.promise);
                spyOn(CurrentOrder, 'Remove').and.returnValue(defer.promise);
                expressCheckoutOrdeCtrl.submitOrder();
                scope.$digest();
            }));
            it('should call the Submit Order method', function() {
                expect(oc.Orders.Submit).toHaveBeenCalledWith(order.ID);
            });
            it('should call the CurrentOrder Remove method', inject(function(CurrentOrder) {
                expect(CurrentOrder.Remove).toHaveBeenCalled();
            }));
            it('should enter the orderReview state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('expressOrderReview', {orderid: order.ID});
            }));
        });
    });

    describe('Controller: ExpressOrderReviewController', function() {
        var expressOrderReviewController;
        beforeEach(inject(function($state, $controller) {
            expressOrderReviewController = $controller('ExpressOrderReviewCtrl', {
                $scope: scope,
                SubmittedOrder: order
            });
        }));

        describe('addToFavorites', function() {
            beforeEach(inject(function() {
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Orders, 'Patch').and.returnValue(defer.promise);
                expressOrderReviewController.addToFavorites();
            }));
            it('should call the Orders Patch method', function() {
                expect(oc.Orders.Patch).toHaveBeenCalledWith(order.ID, {xp: order.xp.favorite});
            })
        });

        describe('removeFromavorites', function() {
            beforeEach(inject(function() {
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Orders, 'Patch').and.returnValue(defer.promise);
                expressOrderReviewController.removeFromFavorites();
            }));
            it('should call the Orders Patch method', function() {
                expect(oc.Orders.Patch).toHaveBeenCalledWith(order.ID, {xp: order.xp});
            })
        });

        describe('print', function() {
            beforeEach(inject(function() {
                spyOn(window, 'print').and.returnValue(null);
                expressOrderReviewController.print();
            }));
            it('should call the window.print method', inject(function() {
                expect(window.print).toHaveBeenCalled();
            }));
        });
    });
});

