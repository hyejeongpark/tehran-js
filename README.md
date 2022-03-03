# TEHRAN-JS

Under development, do not use for production

## HOW TO USE

1) Add script before closing of HTML body tag

```
<body>
...
<script src="js/getotp.min.js"></script>
<!-- or you can load the script hosted at Tehran -->
</body>
```

2) Once document ready, initialize the script. All dependencies will be automatically loaded.

```
<script>
    // once document ready, init
    getotp.init();
</script>
```

3) Get the `otp_id` and `link` property from the Tehran API response and return to the Front End

4) Show the OTP modal

```
var otp_url = response.link;

// show the otp modal
getotp.showModal(otp_url);
```

5) Manually close the modal

```
getotp.closeModal();
```

## HANDLING OTP SUCCESS & OTP FAILED CALLBACK

1) Once the OTP process has been completed, client will receive a callback

2) To handle OTP success, developer need to listen to the `onSuccess` event

```
getotp.onSuccess(function (payload) {

    var callback_otp_id = payload.otp_id;
    var redirect_url = payload.redirect_url;

    // do something

    // getotp.closeModal();
});
```

3) To handle OTP failed, developer need to listen to the `onFailed` event

```
getotp.onFailed(function (payload) {

    var callback_otp_id = payload.otp_id;
    var redirect_url = payload.redirect_url;

    // do something

    // getotp.closeModal();
});
```

## ADD TRUSTED ORIGIN

1) If you are developing on staging or local Tehran server, you must add your server url as trusted origin before showing the OTP form

```
// add local Tehran server as trusted origin
getotp.addOrigin('http://localhost:8080');

// show the otp modal
getotp.showModal(otp_url);
```

## AVAILABLE UI MODE

1) The script support 2 UI mode with value 'modal' or 'embed'. Default is 'modal' mode

2) To use embed mode, just set the `ui_mode` on script init

```
getotp.init({ 'ui_mode': 'embed' });
```

## MANUALLY EMBED OTP

With `ui_mode` with value `embed`, developer can manually embed the OTP form without using provided modal

```

getotp.init({ 'ui_mode': 'embed' });

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

1) Developer can use init to customize the settings

```

var custom_settings = {
    'ui_mode': 'modal',
    'url_storage_key': 'getotp_form_url',
    'dev_mode': false
};

getotp.init(custom_settings);
```