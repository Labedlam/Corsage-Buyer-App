describe('Component: Build Your Own', function(){
    var scope,
        q,
        oc,
        catalog;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(module(function($provide){
        $provide.value('Catalog', {Items: []});
    }));
    beforeEach(inject(function($q, $rootScope, OrderCloud){
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        catalog = {
            Items: []
        };
    }));

    describe('State: buildYourOwn', function(){
        var state,
            value,
            v;
        beforeEach(inject(function($state){
            state = $state.get('buildYourOwn');
            var defer = q.defer();
            defer.resolve();
            value = 'id';
            v = {
                ID: 'ID'
            };
            //spyOn(oc.Me, 'ListCategories').and.returnValue(null);
            spyOn(oc.Me, 'ListCategories').and.returnValue(defer.promise);
            spyOn(oc.Me, 'ListProducts').and.returnValue(defer.promise);
        }));
        it('should resolve Catalog', inject(function($injector){
            $injector.invoke(state.resolve.Catalog);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null, null, null, null, null, {ParentID: 3}, null);
        }));
        it('should resolve SelectionCategories', inject(function($injector){
            $injector.invoke(state.resolve.SelectionCategories);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null, null, null, null, null, {ParentID: value.ID}, 1);
            expect(oc.Me.ListProducts).toHaveBeenCalledWith(null, null, null, null, null, null, v.ID);
        }));
    })
});