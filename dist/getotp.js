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
            'url_storage_key': 'getotp_form_url',
            'dev_mode': false
        };

        var getotp_object = {
            'settings': settings,
            'trusted_origins': ['https://otp.dev'],
            'active_modal': null,
            'embed_type': null,
            'embed_height': null,
            'embed_dom_id': 'getotp_modal_embed_body',
            'modal_spinner_id': 'getotp_modal_spinner',
            'script_origin': document.currentScript && document.currentScript.src
        };

        // end initial object

        // use init to custom config

        getotp_object.init = function (options) {
            console.log('options', options);

            for (var key in options) {
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

        function enqueueModalScripts() {

            // prepare base url

            var parse_origin = new URL(getotp_object.script_origin);

            var origin = parse_origin.origin;

            // load CSS

            var style = document.createElement('link');

            style.setAttribute('rel', 'stylesheet');

            var style_url = origin + '/static/css/getotp_modal.min.css';

            if (getotp_object.settings.dev_mode) {
                style_url = origin + '/dist/getotp_modal.min.css';
            }

            style.setAttribute('href', style_url);

            document.getElementsByTagName('head')[0].appendChild(style);

            // load JS

            var script = document.createElement('script');

            script.setAttribute("type", "text/javascript");

            var script_url = origin + '/static/js/getotp_modal.min.js';

            if (getotp_object.settings.dev_mode) {
                script_url = origin + '/dist/getotp_modal.min.js';
            }

            script.setAttribute('src', script_url);

            document.body.appendChild(script);

            return script;
        }

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

        function initClientCallback(function_name, payload) {
            if (typeof window[function_name] == "function") {
                window[function_name].call(null, payload);
            } else {
                console.info('Callback function ' + function_name + '(payload) has not been define');
            }
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

        // callback from message listener, doesnt have access to this scope because under window scope
        getotp_object.iframeHeightCallback = function (message) {
            var embed_height = message.embed_height;

            getotp_object.updateIframeHeight(embed_height);
        };

        getotp_object.keyPressCallback = function (message) {
            var keycode = message.keycode;

            getotp_object.handleKeypressCallback(keycode);
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

                var success_event = new CustomEvent('onOtpSucces', { detail: payload });

                window.dispatchEvent(success_event);
            } else if (status === 'fail') {

                var failed_event = new CustomEvent('onOtpFailed', { detail: payload });

                window.dispatchEvent(failed_event);
            }
        };

        /* end server callback */

        getotp_object.embedOtpForm = function (otp_url, embed_container) {

            initClientCallback('otpBeforeLoad', {});

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

            var self = this;

            iframe.addEventListener("load", function () {

                // remove modal spinner

                var modal_spinner = document.getElementById(self.modal_spinner_id);

                if (modal_spinner) {
                    modal_spinner.parentNode.removeChild(modal_spinner);
                }
            });
        };

        // manual position form

        getotp_object.initEmbed = function (embed_url, embed_container) {

            var embed_mode = 'compact';

            this.embed_type = 'embed';

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        };

        getotp_object.showEmbed = function (otp_url, embed_container) {

            var embed_mode = 'compact';

            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initEmbed(embed_url, embed_container);

            return true;
        };

        getotp_object.reloadEmbed = function (embed_container) {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initEmbed(embed_url, embed_container);
        };

        // end manual position form

        // modal form

        getotp_object.initModal = function (embed_url) {

            if (typeof tingle != 'undefined') {
                loadModal();
            } else {
                var load_script = enqueueModalScripts();

                load_script.addEventListener('load', function () {
                    loadModal();
                });
            }

            var embed_mode = 'compact';

            this.embed_type = 'modal';

            function loadModal() {
                var modal = new tingle.modal({
                    footer: false,
                    closeMethods: ['overlay', 'button', 'escape'],
                    closeLabel: "Close",
                    onOpen: function onOpen() {
                        initClientCallback('otpModalOpen', {});
                    },
                    onClose: function onClose() {

                        modal.destroy();

                        initClientCallback('otpModalClose', {});
                    },
                    beforeClose: function beforeClose() {
                        return true;
                    }
                });

                getotp_object.active_modal = modal;

                var embed_dom_id = getotp_object.embed_dom_id;
                var modal_spinner_id = getotp_object.modal_spinner_id;

                var spinner = '<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#000"> <g fill="none" fill-rule="evenodd"> <g transform="translate(1 1)" stroke-width="2"> <circle stroke-opacity=".5" cx="18" cy="18" r="18" /> <path d="M36 18c0-9.94-8.06-18-18-18"> <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" /> </path> </g> </g> </svg>';

                var spinner_div = '<div id="' + modal_spinner_id + '" style="display: flex; align-items: center; justify-content: center; height: 100%;">' + spinner + '</div>';

                modal.setContent('<div id="' + embed_dom_id + '">' + spinner_div + '</div>');

                // embed otp iframe

                var embed_container = document.getElementById(embed_dom_id);

                getotp_object.embedOtpForm(embed_url, embed_container);

                setDefaultStyle(embed_mode);

                modal.open();
            }
        };

        getotp_object.showModal = function (otp_url) {

            var embed_mode = 'compact';
            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initModal(embed_url);
        };

        getotp_object.hideModal = function (otp_url) {
            if (this.active_modal) {
                this.active_modal.close();
            }
        };

        getotp_object.reloadModal = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initModal(embed_url);

            return true;
        };

        // end modal form

        // sticky form

        getotp_object.initSticky = function (embed_url) {

            var embed_mode = 'wide';
            this.embed_type = 'sticky';

            var embed_container = document.body;

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        };

        getotp_object.showSticky = function (otp_url) {

            var embed_mode = 'wide';

            var embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initSticky(embed_url);

            return true;
        };

        getotp_object.connect = function (body_payload, auth_payload) {

            var success_redirect_url = body_payload.success_redirect_url;
            var fail_redirect_url = body_payload.fail_redirect_url;
            var user_email = body_payload.user_email;

            var api_url = auth_payload.api_url,
                api_key = auth_payload.api_key,
                api_token = auth_payload.api_token;


            var api_payload = {
                'callback_url': success_redirect_url,
                'success_redirect_url': success_redirect_url,
                'fail_redirect_url': fail_redirect_url,
                'channel': 'email',
                'email': user_email,
                'embed': 'compact'
            };

            api_url = api_url + 'api/verify/';

            var authorization_key = btoa(api_key + ":" + api_token);

            var fetch_config = {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + authorization_key
                },
                body: JSON.stringify(api_payload)
            };

            var api_call = fetch(api_url, fetch_config).then(function (response) {
                return response.json();
            });

            return api_call;
        };

        getotp_object.reloadSticky = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initSticky(embed_url);

            return true;
        };

        // end sticky form

        getotp_object.handleKeypressCallback = function (keycode) {
            // if user press escape
            if (keycode == 27) {
                if (this.embed_type == 'modal') {
                    this.hideModal();
                } else {
                    // do something
                }

                initClientCallback('keypressCallback', { 'keycode': keycode });
            }
        };

        getotp_object.updateIframeHeight = function (embed_height) {

            var px_embed_height = embed_height + 'px';

            var iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';

            console.log('update iframe height', px_embed_height);
            this.embed_height = px_embed_height;

            initClientCallback('otpAfterLoad', {});
        };

        getotp_object.getEmbedHeight = function () {
            return this.embed_height;
        };

        getotp_object.onSuccess = function (callback) {

            var self = this;

            window.addEventListener('onOtpSucces', function (e) {

                var payload = e.detail;

                callback(payload);
            });
        };

        getotp_object.onFailed = function (callback) {

            var self = this;

            window.addEventListener('onOtpFailed', function (e) {

                var payload = e.detail;

                callback(payload);
            });
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