describe('Component: Catalog Products', function() {
    var scope,
        q,
        oc
        ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
    }));
    describe('Controller: ProductListCtrl', function() {
        var productListCtrl,
            mockSearchTerm,
            mockProduct
            ;
        beforeEach(inject(function($state, $controller) {
            productListCtrl = $controller('ProductListCtrl', {
                $q:q,
                OrderCloud:oc
            });
            mockSearchTerm = 'productSearch';
            mockProduct = {
                "Meta": {},
                "Items": [{
                    "ID": "TestProduct123456789",
                    "Name": "TestProduct Name"
                }]
            };
            var defer = q.defer();
            defer.resolve(mockProduct);
            spyOn(oc.Me, 'ListProducts').and.returnValue(defer.promise);
            productListCtrl.searchfunction(mockSearchTerm);
        }));
        describe('searchfunction', function() {
            it('should call the Me ListProducts method', function() {
                expect(oc.Me.ListProducts).toHaveBeenCalledWith(mockSearchTerm);
            })
        });
    });
});
