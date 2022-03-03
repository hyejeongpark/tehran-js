(function (window) {
    // You can enable the strict mode commenting the following line  
    // 'use strict';

    // This function will contain all our code
    function getotp() {

        // initial object

        let settings = {
            'ui_mode': 'modal', // modal / embed / sticky
            'url_storage_key': 'getotp_form_url',
            'dev_mode': false
        };

        let getotp_object = {
            'settings': settings,
            'iframe_settings': {
                'iframe_container_id': 'getotp_iframe_parent',
                'iframe_container_class': '',
                'iframe_id': 'getotp_iframe',
                'iframe_class': '',
            },
            'trusted_origins': [
                'https://otp.dev',
            ],
            'is_loading_script': false,
            'is_script_loaded': false,
            'active_modal': null,
            'embed_height': null,
            'embed_dom_id': 'getotp_modal_embed_body',
            'modal_spinner_id': 'getotp_modal_spinner',
            'script_origin': document.currentScript && document.currentScript.src
        };

        // end initial object

        // use init to custom config

        getotp_object.init = function (options) {

            for (let key in options) {
                if (this.settings.hasOwnProperty(key)) {
                    this.settings[key] = options[key];
                }
            }

            // load modal script and CSS
            if (this.settings.ui_mode === 'modal') {
                enqueueModalScripts();
            }
        }

        // end use init to custom config

        // business logic

        function embedOtpForm(otp_url, embed_container) {

            fireEvent('onOtpBeforeLoad', {});

            let iframe_container = document.createElement('div');

            iframe_container.setAttribute("id", getotp_object.iframe_settings.iframe_container_id);
            iframe_container.setAttribute("class", getotp_object.iframe_settings.iframe_container_class);

            let iframe = document.createElement('iframe');

            iframe.setAttribute("id", getotp_object.iframe_settings.iframe_id);
            iframe.setAttribute("class", getotp_object.iframe_settings.iframe_class);

            iframe_container.appendChild(iframe);

            // TODO: show loading before fetch the url
            console.log('iframe.src', otp_url);

            iframe.src = otp_url;
            iframe.width = '100%';
            iframe.style.border = 'none';

            console.log('embed_container', embed_container);

            embed_container.appendChild(iframe_container);

            let self = getotp_object;

            iframe.addEventListener("load", function () {

                // remove modal spinner

                let modal_spinner = document.getElementById(self.modal_spinner_id);

                if (modal_spinner) {
                    modal_spinner.parentNode.removeChild(modal_spinner);
                }
            });
        }

        function updateIframeHeight(embed_height) {

            let px_embed_height = embed_height + 'px';

            let iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';

            console.log('update iframe height', px_embed_height);

            getotp_object.embed_height = px_embed_height;

            fireEvent('onOtpAfterLoad', {});
        }

        function loadModal(embed_url) {
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

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();

            modal.open();
        }

        function enqueueModalScripts() {

            // load JS

            getotp_object.is_loading_script = true;
            getotp_object.is_script_loaded = false;

            let script_url = getAssetUrl('getotp_modal.min.js');

            loadScript(script_url, function () {

                // load CSS

                let style_url = getAssetUrl('getotp_modal.min.css');

                loadStylesheet(style_url, function () {
                    getotp_object.is_loading_script = false;
                    getotp_object.is_script_loaded = true;
                    fireEvent('modalScriptLoaded', {});
                });
            });
        }

        // end business logic

        // helper

        function setDefaultStyle() {

            // create inline style for iframe position

            let style_element = document.createElement('style');

            let css_rules = getStyle();

            if (css_rules) {
                style_element.appendChild(document.createTextNode(css_rules));

                /* attach to the document head */

                document.getElementsByTagName('head')[0].appendChild(style_element);
            }
        }

        function getStyle() {

            if (getotp_object.settings.ui_mode === 'sticky') {
                return 'div#' + getotp_object.iframe_settings.iframe_container_id + ' { position: fixed; bottom: 0; width: 100%; background-color: white; }';
            }

            return null;
        }

        function prepareEmbedUrl(url) {
            return url + 'pin/';
        }

        // deprecated
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

        function handleKeypressCallback(keycode) {
            // if user press escape
            if (keycode == 27) {
                if (getotp_object.settings.ui_mode == 'modal') {
                    getotp_object.closeModal();
                }
                else {
                    // do something
                }
            }

            fireEvent('onOtpKeypress', { keycode });
        }

        function loadScript(url, callback) {
            let script = document.createElement('script');

            script.type = 'text/javascript';
            script.async = true;
            script.src = url

            let entry = document.getElementsByTagName('script')[0];
            entry.parentNode.insertBefore(script, entry);

            if (script.addEventListener)
                script.addEventListener('load', callback, false);
            else {
                script.attachEvent('onreadystatechange', function () {
                    if (/complete|loaded/.test(script.readyState))
                        callback();
                });
            }
        }

        function loadStylesheet(url, callback) {
            let link = document.createElement('link');

            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = url;

            // Append <link/> tag
            let entry = document.getElementsByTagName('script')[0];
            entry.parentNode.insertBefore(link, entry);

            callback();
        }

        function getBaseUrl() {

            let parse_origin = (new URL(getotp_object.script_origin));

            let base_url = parse_origin.origin;

            return base_url;
        }

        function getAssetPath(filename) {
            let file_extension = filename.split('.').pop();

            let path = '/static/js/';

            if (file_extension === 'css') {
                path = '/static/css/';
            }

            if (getotp_object.settings.dev_mode) {
                path = '/dist/';
            }

            return path;
        }

        function getAssetUrl(filename) {
            let base_url = getBaseUrl();

            let path = getAssetPath(filename);

            let asset_url = base_url + path + filename;

            return asset_url;
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

        // manual position form

        function initEmbed(embed_url, embed_container) {

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();
        }

        getotp_object.showEmbed = function (otp_url, embed_container) {

            let embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initEmbed(embed_url, embed_container);

            return true;
        }

        getotp_object.reloadEmbed = function (embed_container) {
            let embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            initEmbed(embed_url, embed_container);
        }

        // end manual position form

        // modal form

        function initModal(embed_url) {

            if (getotp_object.is_script_loaded) {
                loadModal(embed_url);
            }
            else {

                if (!getotp_object.is_loading_script) {
                    enqueueModalScripts();
                }

                window.addEventListener('modalScriptLoaded', function (e) {
                    loadModal(embed_url);
                });
            }
        }

        getotp_object.showModal = function (otp_url) {

            let embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initModal(embed_url);
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

            initModal(embed_url);

            return true;
        }

        // end modal form

        // sticky form

        function initSticky(embed_url) {

            let embed_container = document.body;

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();
        }

        getotp_object.showSticky = function (otp_url) {

            let embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initSticky(embed_url);

            return true;
        }

        getotp_object.reloadSticky = function () {
            let embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            initSticky(embed_url);

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