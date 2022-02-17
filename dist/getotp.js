'use strict';

(function (window) {
    // You can enable the strict mode commenting the following line  
    // 'use strict';

    // This function will contain all our code
    function getotp() {

        // initial object

        var settings = {
            'iframe_container_id': 'getotp_iframe_parent',
            'iframe_container_class': '',
            'iframe_id': 'getotp_iframe',
            'iframe_class': '',
            'success_callback_function': 'otpSuccess',
            'failed_callback_function': 'otpFailed',
            'url_storage_key': 'getotp_form_url'
        };

        var getotp_object = {
            'settings': settings,
            'trusted_origins': ['https://otp.dev'],
            'active_modal': null
        };

        // end initial object

        // use init to custom config

        getotp_object.init = function (options) {
            console.log('options', options);

            for (key in options) {
                if (this.settings.hasOwnProperty(key)) {
                    this.settings[key] = options[key];

                    if (key === 'iframe_container_id') {
                        setDefaultStyle();
                    }
                }
            }

            console.log('this', this);
        };

        // end use init to custom config

        // helper

        function prepareStyle(embed_mode) {

            if (embed_mode === 'compact') {
                return 'div#' + getotp_object.settings.iframe_container_id + ' iframe { border: 0; }';
            } else {
                return 'div#' + getotp_object.settings.iframe_container_id + ' { position: fixed; bottom: 0; width: 100%; background-color: white; } div#' + getotp_object.settings.iframe_container_id + ' iframe { border: 0; }';
            }
        }

        function setDefaultStyle() {
            var embed_mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'compact';


            // create inline style for iframe position

            var style_element = document.createElement('style');

            var css_rules = prepareStyle(embed_mode);

            style_element.appendChild(document.createTextNode(css_rules));

            /* attach to the document head */

            document.getElementsByTagName('head')[0].appendChild(style_element);
        }

        function prepareEmbedUrl(url) {
            var embed_mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'compact';

            return url + 'pin/?embed_mode=' + embed_mode;
        }

        // end helper

        /* event listener */

        getotp_object.getotpServerMessage = function (event) {
            console.log("event", event);

            // Check sender origin to be trusted

            // debugger;

            var client_origin = window.location.origin;

            if (event.origin != client_origin) {
                if (!getotp_object['trusted_origins'].includes(event.origin)) {
                    console.error('Server callback failed because event origin ' + event.origin + ' is not define inside trusted_origins');
                    return;
                }
            }

            var data = event.data;

            if (typeof getotp_object[data.func] == "function") {
                getotp_object[data.func].call(null, data.message);
            }
        };

        /* end event listener */

        /* server callback */

        // callback from message listener, doesnt have access to this because under window scope
        getotp_object.iframeHeightCallback = function (message) {
            var embed_height = message.embed_height;

            getotp_object.updateIframeHeight(embed_height);
        };

        getotp_object.otpClientCallback = function (message) {

            var otp_id = message.otp_id;
            var status = message.status;
            var redirect_url = message.redirect_url;

            var payload = {
                'otp_id': otp_id,
                'status': status,
                'redirect_url': redirect_url
            };

            if (status === 'success') {

                if (typeof window[getotp_object['settings'].success_callback_function] == "function") {
                    window[getotp_object['settings'].success_callback_function].call(null, payload);
                } else {
                    console.error('To handle OTP success callback, please define function ' + getotp_object['settings'].success_callback_function + '(payload)');
                }
            } else if (status === 'fail') {

                if (typeof window[getotp_object['settings'].failed_callback_function] == "function") {
                    window[getotp_object['settings'].failed_callback_function].call(null, payload);
                } else {
                    console.error('To handle OTP error callback, please define function ' + getotp_object['settings'].failed_callback_function + '(payload)');
                }
            }
        };

        /* end server callback */

        getotp_object.embedOtpForm = function (otp_url, embed_container) {
            var iframe_container = document.createElement('div');

            iframe_container.setAttribute("id", this.settings.iframe_container_id);
            iframe_container.setAttribute("class", this.settings.iframe_container_class);

            var iframe = document.createElement('iframe');

            iframe.setAttribute("id", this.settings.iframe_id);
            iframe.setAttribute("class", this.settings.iframe_class);

            iframe_container.appendChild(iframe);

            // TODO: show loading before fetch the url
            console.log('iframe.src', otp_url);

            iframe.src = otp_url;
            iframe.width = '100%';

            console.log('embed_container', embed_container);

            embed_container.appendChild(iframe_container);
        };

        // manual position form

        getotp_object.initOtpForm = function (embed_url, embed_container) {

            var embed_mode = 'compact';

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        };

        getotp_object.showOtpForm = function (otp_url, embed_container) {

            var embed_mode = 'compact';

            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initOtpForm(embed_url, embed_container);

            return true;
        };

        getotp_object.reloadOtpForm = function (embed_container) {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initOtpForm(embed_url, embed_container);
        };

        // end manual position form

        // modal form

        getotp_object.initModalForm = function (embed_url) {

            var embed_mode = 'compact';

            if (this.active_modal) {
                this.active_modal.open();
            } else {
                var modal = new tingle.modal({
                    footer: false,
                    closeMethods: ['overlay', 'button', 'escape'],
                    closeLabel: "Close",
                    onOpen: function onOpen() {
                        console.log('modal open');
                    },
                    onClose: function onClose() {
                        console.log('modal closed');
                    },
                    beforeClose: function beforeClose() {
                        return true;
                    }
                });

                modal.setContent('<div id="getotp_modal_embed_body"></div>');

                this.active_modal = modal;

                // embed otp iframe

                var embed_container = document.getElementById('getotp_modal_embed_body');

                this.embedOtpForm(embed_url, embed_container);

                setDefaultStyle(embed_mode);

                modal.open();
            }
        };

        getotp_object.showModalForm = function (otp_url) {
            var embed_mode = 'compact';
            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            this.initModalForm(embed_url);
        };

        getotp_object.reloadModalForm = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initModalForm(embed_url);

            return true;
        };

        // end modal form

        // sticky form

        getotp_object.initStickyForm = function (embed_url) {

            var embed_mode = 'wide';

            var embed_container = document.body;

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        };

        getotp_object.showStickyForm = function (otp_url) {

            var embed_mode = 'wide';

            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initStickyForm(embed_url);

            return true;
        };

        getotp_object.reloadStickyForm = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initStickyForm(embed_url);

            return true;
        };

        // end sticky form

        getotp_object.updateIframeHeight = function (embed_height) {
            console.log('update iframe height', embed_height);

            this.embed_height = embed_height;

            var iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';
        };

        // for development purpose

        getotp_object.addOrigin = function (origin) {
            origin = origin.replace(/\/$/, '');
            this.trusted_origins.push(origin);
            return this.trusted_origins;
        };

        getotp_object.clearSession = function () {
            sessionStorage.removeItem(this.settings.url_storage_key);
        };

        return getotp_object;
    }

    // We need that our library is globally accesible, then we save in the window
    if (typeof window.getotp === 'undefined') {
        window.getotp = getotp();
    }

    if (window.addEventListener) {
        window.addEventListener("message", window.getotp.getotpServerMessage, false);
    } else if (window.attachEvent) {
        window.attachEvent("onmessage", window.getotp.getotpServerMessage, false);
    }
})(window);