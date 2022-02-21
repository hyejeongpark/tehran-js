# TEHRAN-JS

Under development, do not use for production

## HOW TO USE

1) Add script before closing of HTML body tag

```
<body>
...
<script src="js/getotp.min.js"></script>
</body>
```

2) Get the `otp_id` and `link` property from the Tehran API response and return to the Front End

3) Show the OTP modal

```
var otp_url = response.link;

// show the otp modal
getotp.showModal(otp_url);
```

4) Manually hide the modal

```
getotp.hideModal();
```

## HANDLING OTP SUCCESS and OTP FAILED CALLBACK

1) Once the OTP process has been completed, client will receive a callback

2) To handle OTP success, developer need to define inside the script `otpSuccess(payload)`

```
function otpSuccess(payload) {

    let callback_otp_id = payload.otp_id;
    let redirect_url = payload.redirect_url;

    // do something
}

window.otpSuccess = otpSuccess;
```

3) To handle OTP failed, developer need to define inside the script `otpFailed(payload)`

```
function otpFailed(payload) {

    let callback_otp_id = payload.otp_id;
    let redirect_url = payload.redirect_url;

    // do something
}

window.otpFailed = otpFailed;
```

4) To customize the callback function name, refer the CUSTOMIZE OPTIONS section below

## ADD TRUSTED ORIGIN

1) If you are developing on staging or local Tehran server, you must add your server url as trusted origin before showing the OTP form

```
// add local Tehran server as trusted origin
getotp.addOrigin('http://localhost:8080');

// show the otp modal
getotp.showModal(otp_url);
```

## MANUALLY EMBED OTP

Developer can manually embed the OTP form without using provided modal

```
// specify dom element to embed
var dom_element = document.getElementById('embed_div');

// embed the otp modal
getotp.showEmbed(otp_url, dom_element);
```

## RELOADING OTP FORM

1) If the user reload their page and you want to show again the OTP form

```
// if using modal
getotp.reloadModal();

// if using embed
getotp.reloadEmbed();
```

## CUSTOMIZE OPTIONS

1) Before calling `getotp.showModal(otp_url)`, developer can use init to customize the settings

```

var custom_settings = {
    'iframe_container_id': 'getotp_iframe_parent',
    'iframe_container_class': '',
    'iframe_id': 'getotp_iframe',
    'iframe_class': '',
    'success_callback_function': 'otpSuccess',
    'failed_callback_function': 'otpFailed',
    'url_storage_key': 'getotp_form_url',
};

getotp.init(custom_settings);

// show the otp modal
getotp.showModal(otp_url);
```

## USAGE WITH AJAX EXAMPLES

1) With jQuery Ajax

```
function submitVerify() {
    
    var payload = { 
        amount: 200,
        trans_id: 'asd4i4sd123'
    };

    var api_url = 'https://yoursite.test/transfers/verify/';
    
    return $.ajax({
            method: "POST",
            url: api_url,
            data: payload
        })
        .done(function( response ) {
            var otp_id = response.otp_id;
            var otp_url = response.link;

            // show the OTP modal
            getotp.showModal(otp_url);
        });
}

// trigger
submitVerify();
```

2) With Axios

```
function submitVerify() {

    var payload = { 
        amount: 200,
        trans_id: 'asd4i4sd123'
    };

    var api_url = 'https://yoursite.test/transfers/verify/';

    return axios
        .post(api_url, payload)
        .then(response => {
            var otp_id = response.otp_id;
            var otp_url = response.link;

            // show the OTP modal
            getotp.showModal(otp_url);
        })
}

// trigger
submitVerify();
```

3) With Fetch

```

function submitVerify() {

    let payload = { 
        amount: 200,
        trans_id: 'asd4i4sd123'
    };

    let api_url = 'https://yoursite.test/transfers/verify/';

    fetch(api_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {

        let otp_id = data.otp_id;
        let otp_url = data.link;

        // show the OTP modal
        getotp.showModal(otp_url);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// trigger
submitVerify();
```