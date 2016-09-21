describe('Component: Catalog Category', function() {
    var scope,
        oc
    ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, OrderCloud) {
        scope = $rootScope.$new();
        oc = OrderCloud;
    }));
    describe('State: catalog.category', function() {
        var state,
           injector,
           stateParams
        ;
        beforeEach(inject(function($state, $injector, $stateParams) {
            state = $state.get('catalog.category', {}, {reload: true});
            injector = $injector;
            stateParams = $stateParams;
            spyOn(oc.Me, 'ListCategories');
            spyOn(oc.Me, 'ListProducts');

        }));
        it('should resolve CategoryList', function() {
            injector.invoke(state.resolve.CategoryList);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null, null, null, null, null, {ParentID: stateParams.categoryid}, 'all');
        });
        it('should resolve ProductList', function() {
            injector.invoke(state.resolve.ProductList);
            expect(oc.Me.ListProducts).toHaveBeenCalledWith(null, null, null, null, null, null,stateParams.categoryid);
        })
    });
    describe('Controller: CategoryCtrl', function() {
        var categoryCtrl,
            productslist,
            categorylist
        ;
        beforeEach(inject(function($state,$controller, $rootScope) {
            productslist = "mockProductList";
            categorylist = "mockCategoryList";
            rootscope = $rootScope;
            categoryCtrl = $controller('CategoryCtrl', {$scope:scope, ProductList: productslist, CategoryList:categorylist})
            categoryCtrl.products = productslist;
        }));
        describe('$rootScope.$on: OC:FacetsUpdated', function() {
            it('should change value of ProductList when broadcasted', function() {
                expect(categoryCtrl.products).toBe(productslist);
                rootscope.$broadcast('OC:FacetsUpdated', 'newValue');
                expect(categoryCtrl.products).toBe('newValue');
            })
        })
    })
});