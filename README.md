Login widget creates connection to Port app (using QR code, magnet link or simple copy-paste function).
[View demo.](https://htmlpreview.github.io/?https://github.com/ZeroPass/browser-link-for-port-apps/blob/main/index.html)


## Installation

Browser link for Port apps is a simple HTML widget (lightweight) - no additional packages needed. It runs in browser.

## Prerequirements

Create [dynamic link ](https://firebase.google.com/docs/dynamic-links/create-links) with one of four options on the Firebase platform. You don't need to create an entire dynamic link, only a dynamic_link URL is required. Other parameters are created by script in this repository.


## How to run

1. Copy two files 'js/browser-link-for-port-apps.js' and 'css/browser-link-for-port-apps.css' to your project.

1. Include .js file into your header:

```
<script src="<path>/browser-link-for-port-apps.js"></script>
```
3. Include .css file into your header:

## Prerequirements

Create [dynamic link ](https://firebase.google.com/docs/dynamic-links/create-links) with one of four options on Firebase platform. You dont need to create entire dynamic link, only dynamic_link url is required. Other parametes is created by script in this repository.


## Implementation on website

Include JavaScript files to the project:

```html
<script src="js/login.js"></script>
```

Create div section; where widget will be presented:

```html

<div class="divqr">
   <section id="zeropass-port-qr"></section>
</div>
```

Call the render script:

```html
<script>

 ZeroPassPortWidget.render(callbackFunction
                           { 
                              userID: "<user_id>",
                              version: 0.2,
                              requestType: "<request_type in int>", //only ATTESTATION_REQUEST = 1, PERSONAL_INFORMATION_REQUEST = 2, FAKE_PERSONAL_INFORMATION_REQUEST = 3, LOGIN = 4 allowed
                              url: "<url without https://, if start with dot it adds .port.link>"
                           },
                           document.querySelector('#zeropass-port-qr'));

</script>
```

Check example in index.html file

## Acknowledgment 
QR window design inspired by [Anchor Link](https://github.com/greymass/anchor-link)

## License

[MIT](https://choosealicense.com/licenses/mit/)
