describe('Component: Catalog', function() {
    var scope,
        q,
        oc,
        currentOrder,
        fakeProduct,
        fakeSpecList,
        uibModalInstance,
        addToOrder
        ;

    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud, AddToOrder, CurrentOrder) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        currentOrder =CurrentOrder;
        addToOrder = AddToOrder;
        fakeProduct = {
            ID: "18"
        };
        fakeSpecList =  [{}];
    }));


    describe('Controller: ProductQuickViewController', function() {
        var quickViewCtrl;
        beforeEach(inject(function($controller) {
            quickViewCtrl = $controller('QuickViewCtrl', {
                $scope: scope
            });
            var defer = q.defer();
            defer.resolve();
            scope.$digest();
            spyOn(oc.Me, 'GetProduct').and.returnValue(defer.promise);
            spyOn(oc.Specs, 'ListProductAssignments').and.returnValue(defer.promise);
            quickViewCtrl.open(fakeProduct);
        }));
        it('Should reslove SelectedProduct and SpecList', function() {
            expect(oc.Me.GetProduct).toHaveBeenCalledWith(fakeProduct.ID);
            expect(oc.Specs.ListProductAssignments).toHaveBeenCalledWith(null,fakeProduct.ID);
        });

    });

    describe('Controller: ProductQuickViewModalController', function() {
        var quickViewModalCtrl;
        beforeEach(inject(function($controller) {
            quickViewModalCtrl = $controller('QuickViewModalCtrl', {
                $scope: scope,
                $uibModalInstance: uibModalInstance,
                SelectedProduct: fakeProduct,
                SpecList: fakeSpecList
            });
        }));

        describe('addToCart', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(fakeProduct);
                spyOn(addToOrder, 'Add').and.returnValue(defer.promise);
                quickViewModalCtrl.selectedProduct = fakeProduct;
                quickViewModalCtrl.addToCart(fakeProduct);
            });
            it('Should call Add method and pass product object', function() {
                expect(addToOrder.Add).toHaveBeenCalledWith(fakeProduct);
            });
        });
    });
});

