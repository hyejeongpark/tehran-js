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

3) Show the OTP form

```
var otp_url = response.link;

// show the otp form
getotp.showOtpForm(otp_url);
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

// show the otp form
getotp.showOtpForm(otp_url);
```

## RELOADING OTP FORM

1) If the user reload their page and you want to show again the OTP form

```
getotp.reloadOtpForm();
```

## CUSTOMIZE OPTIONS

1) Before calling `getotp.showOtpForm(otp_url)`, developer can use init to customize the settings

```

var custom_settings = {
    'iframe_container_id': 'custom_iframe_parent',
    'iframe_container_class': 'custom_iframe_parent_class',
    'iframe_id': 'custom_iframe',
    'iframe_class': 'custom_iframe_class',
    'success_callback_function': 'customOtpSuccess',
    'failed_callback_function': 'customOtpFailed',
    'url_storage_key': 'custom_form_url',
};

getotp.init(custom_settings);

// show the otp form
getotp.showOtpForm(otp_url);
```