
# Port webapp login

Login widget creates connection to Port app (using QR code, magnet link or simple copy-paste function).  
[View demo.](https://htmlpreview.github.io/?https://github.com/ZeroPass/port-web-login/blob/main/index.html)

## Installation

Port is simple html widget (ligthweight) - no additional packages needed.


## How to run (2 options)

- All-in-one (no CORS alerts)
```
Run [index.html](index) from base folder
```

- Separated .js files (run on server)

```
Run [loginSeparatedFile/index.html](loginSeparatedFile/index.html) file 
```

## Prerequirements

Create [dynamic link ](https://firebase.google.com/docs/dynamic-links/create-links) with one of four options on Firebase platform. You dont need to create entire dynamic link, only dynamic_link url is required. Other parametes is created by script in this repository.


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
 
 var androidData = {"apn":"<apn>",
                    "afl":"<link_to_play_store>",
                "version":'<min_sdk_version>'};

 var iosData = {"ibi":"<apple_store_id>",
                "isi":"<link_to_app_store>",
                "imv":<min_ios_version_integer>}

 var shortLinkURL = "<short_link>";
 var deepLinkURL = "<deep_link>";

 renderPortQR(shortLinkURL,
              deepLinkURL,
              androidData,
              iosData,
               { 
                userID: "<user_id>",
                requestType: "<request_type>", //only ATTESTATION_REQUEST, PERSONAL_INFORMATION_REQUEST, FAKE_PERSONAL_INFORMATION_REQUEST, LOGIN allowed
                url: "<url>"
              },
              document.querySelector('#zeropass-port-qr'));
</script>
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
