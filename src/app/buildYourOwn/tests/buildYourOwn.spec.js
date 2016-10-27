describe('Component: Build Your Own', function(){
    var scope,
        q,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud){
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
    }));

    describe('State: buildYourOwn', function(){
        var state;
        beforeEach(inject(function($state){
            state = $state.get('buildYourOwn');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Me, 'ListCategories').and.returnValue(null);
        }));
        it('should resolve Catalog', inject(function($injector){
            $injector.invoke(state.resolve.Catalog);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null, null, null, null, null, {ParentID: 3}, null);
        }))
    })
});