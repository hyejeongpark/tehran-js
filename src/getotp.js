(function (window) {
    // You can enable the strict mode commenting the following line  
    // 'use strict';

    // This function will contain all our code
    function getotp() {

        // initial object

        let settings = {
            'ui_mode': 'modal',
            'iframe_container_id': 'getotp_iframe_parent',
            'iframe_container_class': '',
            'iframe_id': 'getotp_iframe',
            'iframe_class': '',
            'success_callback_function': 'otpSuccess',
            'failed_callback_function': 'otpFailed',
            'url_storage_key': 'getotp_form_url',
            'dev_mode': false
        };

        let getotp_object = {
            'settings': settings,
            'trusted_origins': [
                'https://otp.dev',
            ],
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

            for (let key in options) {
                if (this.settings.hasOwnProperty(key)) {
                    this.settings[key] = options[key];

                    if (key === 'iframe_container_id') {
                        setDefaultStyle();
                    }
                }
            }

            if (this.settings.ui_mode === 'modal') {

            }
        }

        // end use init to custom config

        // helper

        function enqueueModalScripts() {

            // prepare base url

            let parse_origin = (new URL(getotp_object.script_origin));

            let origin = parse_origin.origin;

            // load CSS

            const style = document.createElement('link');

            style.setAttribute('rel', 'stylesheet');
            style.setAttribute('type', 'text/css');

            let style_url = origin + '/static/css/getotp_modal.min.css';

            if (getotp_object.settings.dev_mode) {
                style_url = origin + '/dist/getotp_modal.min.css';
            }

            style.setAttribute('href', style_url);

            document.getElementsByTagName('head')[0].appendChild(style);

            // load JS

            const script = document.createElement('script');

            script.setAttribute("type", "text/javascript");
            script.setAttribute("async", true);

            let script_url = origin + '/static/js/getotp_modal.min.js';

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
            }
            else {
                return 'div#' + getotp_object.settings.iframe_container_id + ' { position: fixed; bottom: 0; width: 100%; background-color: white; } div#' + getotp_object.settings.iframe_container_id + ' iframe { border: 0; }';
            }
        }

        function setDefaultStyle(embed_mode = 'compact') {

            // create inline style for iframe position

            let style_element = document.createElement('style');

            let css_rules = prepareStyle(embed_mode);

            style_element.appendChild(document.createTextNode(css_rules));

            /* attach to the document head */

            document.getElementsByTagName('head')[0].appendChild(style_element);
        }

        function prepareEmbedUrl(url, embed_mode = 'compact') {
            return url + 'pin/?embed_mode=' + embed_mode;
        }

        function initClientCallback(function_name, payload) {
            if (typeof (window[function_name]) == "function") {
                window[function_name].call(null, payload);
            }
            else {
                console.info('Callback function ' + function_name + '(payload) has not been define');
            }
        }

        function fireEvent(event_name, payload) {
            let custom_event = new CustomEvent(event_name, { detail: payload });

            window.dispatchEvent(custom_event);
        }

        function updateIframeHeight(embed_height) {

            let px_embed_height = embed_height + 'px';

            let iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';

            console.log('update iframe height', px_embed_height);

            getotp_object.embed_height = px_embed_height;

            fireEvent('onOtpAfterLoad', {});
        }

        function loadModal(embed_url, embed_mode) {
            let modal = new tingle.modal({
                footer: false,
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: "Close",
                onOpen: function () {
                    fireEvent('onOpenModal', {});
                },
                onClose: function () {
                    modal.destroy();

                    fireEvent('onCloseModal', {});
                },
                beforeClose: function () {
                    return true;
                }
            });

            getotp_object.active_modal = modal;

            let embed_dom_id = getotp_object.embed_dom_id;
            let modal_spinner_id = getotp_object.modal_spinner_id;

            let spinner = '<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#000"> <g fill="none" fill-rule="evenodd"> <g transform="translate(1 1)" stroke-width="2"> <circle stroke-opacity=".5" cx="18" cy="18" r="18" /> <path d="M36 18c0-9.94-8.06-18-18-18"> <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" /> </path> </g> </g> </svg>';

            let spinner_div = '<div id="' + modal_spinner_id + '" style="display: flex; align-items: center; justify-content: center; height: 100%;">' + spinner + '</div>'

            modal.setContent('<div id="' + embed_dom_id + '">' + spinner_div + '</div>');

            // embed otp iframe

            let embed_container = document.getElementById(embed_dom_id);

            getotp_object.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);

            modal.open();
        }

        function handleKeypressCallback(keycode) {
            // if user press escape
            if (keycode == 27) {
                if (getotp_object.embed_type == 'modal') {
                    getotp_object.closeModal();
                }
                else {
                    // do something
                }
            }

            fireEvent('onOtpKeypress', { keycode });
        }

        // end helper

        /* event listener */

        getotp_object.getotpServerMessage = function (event) {
            console.log("event", event);

            // Check sender origin to be trusted

            let client_origin = window.location.origin;

            if (event.origin != client_origin) {
                if (!getotp_object['trusted_origins'].includes(event.origin)) {
                    console.error('Server callback failed because event origin ' + event.origin + ' is not define inside trusted_origins');
                    return;
                }
            }

            let data = event.data;

            if (typeof (getotp_object[data.func]) == "function") {
                getotp_object[data.func].call(null, data.message);
            }
        }

        /* end event listener */

        /* server callback */

        // callback from message listener, doesnt have access to this scope because under window scope
        getotp_object.iframeHeightCallback = function (message) {
            let embed_height = message.embed_height;

            updateIframeHeight(embed_height);
        }

        getotp_object.keyPressCallback = function (message) {
            let keycode = message.keycode;

            handleKeypressCallback(keycode);
        }

        getotp_object.otpClientCallback = function (message) {

            let otp_id = message.otp_id;
            let status = message.status;
            let redirect_url = message.redirect_url;

            let payload = {
                'otp_id': otp_id,
                'status': status,
                'redirect_url': redirect_url,
            };

            if (status === 'success') {
                fireEvent('onOtpSucces', payload);
            }
            else if (status === 'fail') {
                fireEvent('onOtpFailed', payload);
            }
        }

        /* end server callback */

        getotp_object.embedOtpForm = function (otp_url, embed_container) {

            fireEvent('onOtpBeforeLoad', {});

            let iframe_container = document.createElement('div');

            iframe_container.setAttribute("id", this.settings.iframe_container_id);
            iframe_container.setAttribute("class", this.settings.iframe_container_class);

            let iframe = document.createElement('iframe');

            iframe.setAttribute("id", this.settings.iframe_id);
            iframe.setAttribute("class", this.settings.iframe_class);

            iframe_container.appendChild(iframe);

            // TODO: show loading before fetch the url
            console.log('iframe.src', otp_url);

            iframe.src = otp_url;
            iframe.width = '100%';

            console.log('embed_container', embed_container);

            embed_container.appendChild(iframe_container);

            let self = this;

            iframe.addEventListener("load", function () {

                // remove modal spinner

                let modal_spinner = document.getElementById(self.modal_spinner_id);

                if (modal_spinner) {
                    modal_spinner.parentNode.removeChild(modal_spinner);
                }
            });
        }

        // manual position form

        getotp_object.initEmbed = function (embed_url, embed_container) {

            let embed_mode = 'compact';

            this.embed_type = 'embed';

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        }

        getotp_object.showEmbed = function (otp_url, embed_container) {

            let embed_mode = 'compact';

            let embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initEmbed(embed_url, embed_container);

            return true;
        }

        getotp_object.reloadEmbed = function (embed_container) {
            let embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initEmbed(embed_url, embed_container);
        }

        // end manual position form

        // modal form

        getotp_object.initModal = function (embed_url) {

            let embed_mode = 'compact';

            this.embed_type = 'modal';

            if (typeof (tingle) != 'undefined') {
                loadModal(embed_url, embed_mode);
            }
            else {
                let load_script = enqueueModalScripts();

                load_script.addEventListener('load', () => {
                    loadModal(embed_url, embed_mode);
                });
            }
            
        }

        getotp_object.showModal = function (otp_url) {

            let embed_mode = 'compact';
            let embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initModal(embed_url);
        }

        getotp_object.closeModal = function (otp_url) {
            if (this.active_modal) {
                this.active_modal.close();
            }
        }

        getotp_object.reloadModal = function () {
            let embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initModal(embed_url);

            return true;
        }

        // end modal form

        // sticky form

        getotp_object.initSticky = function (embed_url) {

            let embed_mode = 'wide';
            this.embed_type = 'sticky';

            let embed_container = document.body;

            this.embedOtpForm(embed_url, embed_container);

            setDefaultStyle(embed_mode);
        }

        getotp_object.showSticky = function (otp_url) {

            let embed_mode = 'wide';

            let embed_url = prepareEmbedUrl(otp_url, embed_mode);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            this.initSticky(embed_url);

            return true;
        }

        getotp_object.reloadSticky = function () {
            let embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            this.initSticky(embed_url);

            return true;
        }

        // end sticky form

        // API client

        getotp_object.connect = function (body_payload, auth_payload) {

            let success_redirect_url = body_payload.success_redirect_url;
            let fail_redirect_url = body_payload.fail_redirect_url;
            let user_email = body_payload.user_email;

            let { api_url, api_key, api_token } = auth_payload;

            let api_payload = {
                'callback_url': success_redirect_url,
                'success_redirect_url': success_redirect_url,
                'fail_redirect_url': fail_redirect_url,
                'channel': 'email',
                'email': user_email,
                'embed': 'compact',
            };

            api_url = api_url + 'api/verify/';

            let authorization_key = btoa(api_key + ":" + api_token);

            const fetch_config = {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + authorization_key
                },
                body: JSON.stringify(api_payload)
            };

            let api_call = fetch(api_url, fetch_config)
                .then(response => {
                    return response.json();
                });

            return api_call;
        }

        // end API client

        getotp_object.getEmbedHeight = function () {
            return this.embed_height;
        }

        // client callback

        getotp_object.onOpenModal = function (callback) {

            let self = this;

            window.addEventListener('onOpenModal', function (e) {

                let payload = e.detail;

                callback(payload);

            });
        }

        getotp_object.onCloseModal = function (callback) {

            let self = this;

            window.addEventListener('onCloseModal', function (e) {

                let payload = e.detail;

                callback(payload);

            });
        }

        getotp_object.onSuccess = function (callback) {

            let self = this;

            window.addEventListener('onOtpSucces', function (e) {

                let payload = e.detail;

                callback(payload);

            });
        }

        getotp_object.onFailed = function (callback) {

            let self = this;

            window.addEventListener('onOtpFailed', function (e) {

                let payload = e.detail;

                callback(payload);

            });
        }

        // end client callback

        // for development purpose

        getotp_object.addOrigin = function (origin) {
            origin = origin.replace(/\/$/, '');
            this.trusted_origins.push(origin);
            return this.trusted_origins;
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