## Express Checkout Component Overview

This component bypasses the traditional checkout flow, and routes the user to a confirmation page where buyer users with an open order to submit their order with shipping, billing, and payment information.

Express Checkout is unique in that if the buyer user has predetermined xp data, their shipping address, billing address, and/or credit card information is pre populated upon routing to the expressCheckout state.

You can allow buyer users to set their default shipping address, billing address, and credit card by including the following directive in the Account component:
```html
<ordercloud-user-defaults></ordercloud-user-defaults>
```

The Checkout component and Express Checkout component function completely independant from one another, but can also be used in the same application if desired.

It uses the Me, Orders, and LineItems resources to build up the data.

Express Checkout is a buyer perspective component, and can only be accessed when logged in as a buyer user, or when impersonating a buyer user.
