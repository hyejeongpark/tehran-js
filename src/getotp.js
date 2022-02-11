(function (window) {
    // You can enable the strict mode commenting the following line  
    // 'use strict';

    // This function will contain all our code
    function getotp() {

        // initial object

        var getotp_object = {
            'settings': {
                'iframe_container_id': 'getotp_iframe_parent',
                'iframe_container_class': '',
                'iframe_id': 'getotp_iframe',
                'iframe_class': '',
                'success_callback_function': 'otpSuccess',
                'failed_callback_function': 'otpFailed',
                'url_storage_key': 'getotp_form_url',
                'trusted_origins': [
                    'https://otp.dev',
                ],
            }
        };

        var css_rules = 'div#' + getotp_object.iframe_container_id + ' { position: fixed; bottom: 0; width: 100%; background-color: white; } div#' + getotp_object.iframe_container_id + ' iframe { border: 0; }';

        getotp_object['settings']['css_rules'] = css_rules;

        // end initial object

        // use init to custom config

        getotp_object.init = function (options) {
            console.log('options', options);

            for (key in options) {
                if (this.settings.hasOwnProperty(key)) {
                    this.settings[key] = options[key];
                }
            }

            console.log('this', this);
        }

        // end use init to custom config

        /* event listener */

        getotp_object.getotpServerMessage = function (event) {
            console.log("event", event);

            // Check sender origin to be trusted

            // debugger;

            var client_origin = window.location.origin;

            if (event.origin != client_origin) {
                if (!getotp_object['settings']['trusted_origins'].includes(event.origin)) {
                    console.error('Server callback failed because event origin ' + event.origin + ' is not define inside trusted_origins');
                    return;
                }
            }

            var data = event.data;

            if (typeof (getotp_object[data.func]) == "function") {
                getotp_object[data.func].call(null, data.message);
            }
        }

        /* end event listener */

        /* server callback */

        // callback from message listener, doesnt have access to this because under window scope
        getotp_object.iframeHeightCallback = function (message) {
            var embed_height = message.embed_height;

            getotp_object.updateIframeHeight(embed_height);
        }

        getotp_object.otpClientCallback = function (message) {

            var otp_id = message.otp_id;
            var status = message.status;
            var redirect_url = message.redirect_url;

            var payload = {
                'otp_id': otp_id,
                'status': status,
                'redirect_url': redirect_url,
            };

            if (status === 'success') {

                if (typeof (window[getotp_object['settings'].success_callback_function]) == "function") {
                    window[getotp_object['settings'].success_callback_function].call(null, payload);
                }
                else {
                    console.error('To handle OTP success callback, please define function ' + getotp_object['settings'].success_callback_function + '(payload)');
                }
            }
            else if (status === 'fail') {

                if (typeof (window[getotp_object['settings'].failed_callback_function]) == "function") {
                    window[getotp_object['settings'].failed_callback_function].call(null, payload);
                }
                else {
                    console.error('To handle OTP error callback, please define function ' + getotp_object['settings'].failed_callback_function + '(payload)');
                }

            }
        }

        /* end server callback */

        getotp_object.embedOtpForm = function (otp_url) {
            var iframe_container = document.createElement('div');

            iframe_container.setAttribute("id", this.settings.iframe_container_id);
            iframe_container.setAttribute("class", this.settings.iframe_container_class);

            var iframe = document.createElement('iframe');

            iframe.setAttribute("id", this.settings.iframe_id);
            iframe.setAttribute("class", this.settings.iframe_class);

            iframe_container.appendChild(iframe);
            document.body.appendChild(iframe_container);

            // TODO: show loading before fetch the url

            iframe.src = otp_url;
            iframe.width = '100%';
            // iframe.height = '600';

            // create inline style for iframe position

            var style_element = document.createElement('style');

            style_element.appendChild(document.createTextNode(this.settings.css_rules));

            /* attach to the document head */

            document.getElementsByTagName('head')[0].appendChild(style_element);
        }

        getotp_object.showOtpForm = function (otp_url) {

            console.log('this', this);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, otp_url);

            this.embedOtpForm(otp_url);

            return true;
        }

        getotp_object.updateIframeHeight = function (embed_height) {
            console.log('update iframe height', embed_height);

            this.embed_height = embed_height;

            var iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';
        }

        getotp_object.reloadOtpForm = function () {
            var otp_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!otp_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.embedOtpForm(otp_url);
        }

        // for development purpose

        getotp_object.addOrigin = function (origin) {
            this.settings.trusted_origins.push(origin);
            return this.settings.trusted_origins;
        }

        getotp_object.clearSession = function () {
            sessionStorage.removeItem(this.settings.url_storage_key);
        }

        return getotp_object;
    }

    // We need that our library is globally accesible, then we save in the window
    if (typeof (window.getotp) === 'undefined') {
        window.getotp = getotp();
    }

    if (window.addEventListener) {
        window.addEventListener("message", window.getotp.getotpServerMessage, false);
    }
    else if (window.attachEvent) {
        window.attachEvent("onmessage", window.getotp.getotpServerMessage, false);
    }
})(window); 