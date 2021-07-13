
# Port webapp login

Login widget creates connection to Port app (using QR code, magnet link or simple copy-paste function). 

## Installation

Port is simple html widget (ligthweight) - no additional packages needed.


## How to run (2 options)

- All-in-one (no CORS alerts)
```
Run [index](index.html) from base folder
```

- Separated .js files (run on server)

```
Run [loginSeparatedFile/index.html](loginSeparatedFile/index.html) file 
```

## Implementation on website
Include JavaScript files to the project:
```
<script src="js/login.js"></script>
```

Create div section; where widget will be presented:
```
<div class="divqr">
   <section id="zeropass-port-qr"></section>
</div>
```

Call the render script:
```
<script>
 function renderPortQR(settings, containerName) {
   ZeroPassPortWidget.render(settings, containerName);
 }

 renderPortQR({ 
                userID: "<user_id>",
                requestType: "<request_type>", //only ATTESTATION_REQUEST, PERSONAL_INFORMATION_REQUEST, FAKE_PERSONAL_INFORMATION_REQUEST, LOGIN allowed
                url: "<url>"
              },
              document.querySelector('#zeropass-port-qr'));
</script>
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
