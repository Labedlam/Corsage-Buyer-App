#### Product Quick View Directive

This component  includes a quickview button directive, when this button is clicked a modal will appear and display the product. It will also allow you to choose or set spec values if applicable as well as set the desired order quantity to add to order. Upon clicking the "Add to Cart" button, once all the required fields are filled out. The modal will add the desired product into your order and close out.

```html
<ordercloud-product-quick-view product=""></ordercloud-product-quick-view>
```

It is designed to be interpolated or inserted into the ng-repeat .Where the array that is being repeated through should be a list of products.
The product attribute is required. Here is where you pass the product object into the modal which then allows you to add that specific product into your shopping cart.See example below.

```html
<div class="col-md-3 " ng-repeat="aproduct in results.products.list.Items">
    <h3 class="item-name">{{aproduct.Name || aproduct.ID}}</h3>
    <ordercloud-product-quick-view product="aproduct"></ordercloud-product-quick-view>.
</div>
```