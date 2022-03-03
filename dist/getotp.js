'use strict';

(function (window) {
    // You can enable the strict mode commenting the following line  
    // 'use strict';

    // This function will contain all our code
    function getotp() {

        // initial object

        var settings = {
            'ui_mode': 'modal', // modal / embed / sticky
            'url_storage_key': 'getotp_form_url',
            'dev_mode': false
        };

        var _getotp = {
            'settings': settings,
            'iframe_settings': {
                'iframe_container_id': 'getotp_iframe_parent',
                'iframe_container_class': '',
                'iframe_id': 'getotp_iframe',
                'iframe_class': ''
            },
            'trusted_origins': ['https://otp.dev'],
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

        _getotp.init = function (options) {

            for (var key in options) {
                if (this.settings.hasOwnProperty(key)) {
                    this.settings[key] = options[key];
                }
            }

            // load modal script and CSS
            if (this.settings.ui_mode === 'modal') {
                enqueueModalScripts();
            }
        };

        // end use init to custom config

        // business logic

        function embedOtpForm(otp_url, embed_container) {

            fireEvent('onOtpBeforeLoad', {});

            var iframe_container = document.createElement('div');

            iframe_container.setAttribute("id", _getotp.iframe_settings.iframe_container_id);
            iframe_container.setAttribute("class", _getotp.iframe_settings.iframe_container_class);

            var iframe = document.createElement('iframe');

            iframe.setAttribute("id", _getotp.iframe_settings.iframe_id);
            iframe.setAttribute("class", _getotp.iframe_settings.iframe_class);

            iframe_container.appendChild(iframe);

            // TODO: show loading before fetch the url
            console.log('iframe.src', otp_url);

            iframe.src = otp_url;
            iframe.width = '100%';
            iframe.style.border = 'none';

            console.log('embed_container', embed_container);

            embed_container.appendChild(iframe_container);

            var self = _getotp;

            iframe.addEventListener("load", function () {

                // remove modal spinner

                var modal_spinner = document.getElementById(self.modal_spinner_id);

                if (modal_spinner) {
                    modal_spinner.parentNode.removeChild(modal_spinner);
                }
            });
        }

        function updateIframeHeight(embed_height) {

            var px_embed_height = embed_height + 'px';

            var iframe = document.getElementById('getotp_iframe');

            iframe.style.height = embed_height + 'px';

            console.log('update iframe height', px_embed_height);

            _getotp.embed_height = px_embed_height;

            fireEvent('onOtpAfterLoad', {});
        }

        function loadModal(embed_url) {
            var modal = new tingle.modal({
                footer: false,
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: "Close",
                onOpen: function onOpen() {
                    fireEvent('onOpenModal', {});
                },
                onClose: function onClose() {
                    modal.destroy();

                    fireEvent('onCloseModal', {});
                },
                beforeClose: function beforeClose() {
                    return true;
                }
            });

            _getotp.active_modal = modal;

            var embed_dom_id = _getotp.embed_dom_id;
            var modal_spinner_id = _getotp.modal_spinner_id;

            var spinner = '<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#000"> <g fill="none" fill-rule="evenodd"> <g transform="translate(1 1)" stroke-width="2"> <circle stroke-opacity=".5" cx="18" cy="18" r="18" /> <path d="M36 18c0-9.94-8.06-18-18-18"> <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" /> </path> </g> </g> </svg>';

            var spinner_div = '<div id="' + modal_spinner_id + '" style="display: flex; align-items: center; justify-content: center; height: 100%;">' + spinner + '</div>';

            modal.setContent('<div id="' + embed_dom_id + '">' + spinner_div + '</div>');

            // embed otp iframe

            var embed_container = document.getElementById(embed_dom_id);

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();

            modal.open();
        }

        function enqueueModalScripts() {

            // load JS

            _getotp.is_loading_script = true;
            _getotp.is_script_loaded = false;

            var script_url = getAssetUrl('getotp_modal.min.js');

            loadScript(script_url, function () {

                // load CSS

                var style_url = getAssetUrl('getotp_modal.min.css');

                loadStylesheet(style_url, function () {
                    _getotp.is_loading_script = false;
                    _getotp.is_script_loaded = true;
                    fireEvent('modalScriptLoaded', {});
                });
            });
        }

        // end business logic

        // helper

        function setDefaultStyle() {

            // create inline style for iframe position

            var style_element = document.createElement('style');

            var css_rules = getStyle();

            if (css_rules) {
                style_element.appendChild(document.createTextNode(css_rules));

                /* attach to the document head */

                document.getElementsByTagName('head')[0].appendChild(style_element);
            }
        }

        function getStyle() {

            if (_getotp.settings.ui_mode === 'sticky') {
                return 'div#' + _getotp.iframe_settings.iframe_container_id + ' { position: fixed; bottom: 0; width: 100%; background-color: white; }';
            }

            return null;
        }

        function prepareEmbedUrl(url) {
            return url + 'pin/';
        }

        // deprecated
        function initClientCallback(function_name, payload) {
            if (typeof window[function_name] == "function") {
                window[function_name].call(null, payload);
            } else {
                console.info('Callback function ' + function_name + '(payload) has not been define');
            }
        }

        function fireEvent(event_name, payload) {
            var custom_event = new CustomEvent(event_name, { detail: payload });

            window.dispatchEvent(custom_event);
        }

        function handleKeypressCallback(keycode) {
            // if user press escape
            if (keycode == 27) {
                if (_getotp.settings.ui_mode == 'modal') {
                    _getotp.closeModal();
                } else {
                    // do something
                }
            }

            fireEvent('onOtpKeypress', { keycode: keycode });
        }

        function loadScript(url, callback) {
            var script = document.createElement('script');

            script.type = 'text/javascript';
            script.async = true;
            script.src = url;

            var entry = document.getElementsByTagName('script')[0];
            entry.parentNode.insertBefore(script, entry);

            if (script.addEventListener) script.addEventListener('load', callback, false);else {
                script.attachEvent('onreadystatechange', function () {
                    if (/complete|loaded/.test(script.readyState)) callback();
                });
            }
        }

        function loadStylesheet(url, callback) {
            var link = document.createElement('link');

            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = url;

            // Append <link/> tag
            var entry = document.getElementsByTagName('script')[0];
            entry.parentNode.insertBefore(link, entry);

            callback();
        }

        function getBaseUrl() {

            var parse_origin = new URL(_getotp.script_origin);

            var base_url = parse_origin.origin;

            return base_url;
        }

        function getAssetPath(filename) {
            var file_extension = filename.split('.').pop();

            var path = '/static/js/';

            if (file_extension === 'css') {
                path = '/static/css/';
            }

            if (_getotp.settings.dev_mode) {
                path = '/dist/';
            }

            return path;
        }

        function getAssetUrl(filename) {
            var base_url = getBaseUrl();

            var path = getAssetPath(filename);

            var asset_url = base_url + path + filename;

            return asset_url;
        }

        // end helper

        /* event listener */

        _getotp.getotpServerMessage = function (event) {
            console.log("event", event);

            // Check sender origin to be trusted

            var client_origin = window.location.origin;

            if (event.origin != client_origin) {
                if (!_getotp['trusted_origins'].includes(event.origin)) {
                    console.error('Server callback failed because event origin ' + event.origin + ' is not define inside trusted_origins');
                    return;
                }
            }

            var data = event.data;

            if (typeof _getotp[data.func] == "function") {
                _getotp[data.func].call(null, data.message);
            }
        };

        /* end event listener */

        /* server callback */

        // callback from message listener, doesnt have access to this scope because under window scope
        _getotp.iframeHeightCallback = function (message) {
            var embed_height = message.embed_height;

            updateIframeHeight(embed_height);
        };

        _getotp.keyPressCallback = function (message) {
            var keycode = message.keycode;

            handleKeypressCallback(keycode);
        };

        _getotp.otpClientCallback = function (message) {

            var otp_id = message.otp_id;
            var status = message.status;
            var redirect_url = message.redirect_url;

            var payload = {
                'otp_id': otp_id,
                'status': status,
                'redirect_url': redirect_url
            };

            if (status === 'success') {
                fireEvent('onOtpSucces', payload);
            } else if (status === 'fail') {
                fireEvent('onOtpFailed', payload);
            }
        };

        /* end server callback */

        // manual position form

        function initEmbed(embed_url, embed_container) {

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();
        }

        _getotp.showEmbed = function (otp_url, embed_container) {

            var embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initEmbed(embed_url, embed_container);

            return true;
        };

        _getotp.reloadEmbed = function (embed_container) {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            initEmbed(embed_url, embed_container);
        };

        // end manual position form

        // modal form

        function initModal(embed_url) {

            if (_getotp.is_script_loaded) {
                loadModal(embed_url);
            } else {

                if (!_getotp.is_loading_script) {
                    enqueueModalScripts();
                }

                window.addEventListener('modalScriptLoaded', function (e) {
                    loadModal(embed_url);
                });
            }
        }

        _getotp.showModal = function (otp_url) {

            var embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initModal(embed_url);
        };

        _getotp.closeModal = function (otp_url) {
            if (this.active_modal) {
                this.active_modal.close();
            }
        };

        _getotp.reloadModal = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            initModal(embed_url);

            return true;
        };

        // end modal form

        // sticky form

        function initSticky(embed_url) {

            var embed_container = document.body;

            embedOtpForm(embed_url, embed_container);

            setDefaultStyle();
        }

        _getotp.showSticky = function (otp_url) {

            var embed_url = prepareEmbedUrl(otp_url);

            // save otp url for reload purpose
            sessionStorage.setItem(this.settings.url_storage_key, embed_url);

            initSticky(embed_url);

            return true;
        };

        _getotp.reloadSticky = function () {
            var embed_url = sessionStorage.getItem(this.settings.url_storage_key);

            if (!embed_url) {
                console.error('No previous otp form url define in session storage with key ' + this.settings.url_storage_key);
                return;
            }

            initSticky(embed_url);

            return true;
        };

        // end sticky form

        // API client

        _getotp.connect = function (body_payload, auth_payload) {

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

        // end API client

        _getotp.getEmbedHeight = function () {
            return this.embed_height;
        };

        // client callback

        _getotp.onOpenModal = function (callback) {

            var self = this;

            window.addEventListener('onOpenModal', function (e) {

                var payload = e.detail;

                callback(payload);
            });
        };

        _getotp.onCloseModal = function (callback) {

            var self = this;

            window.addEventListener('onCloseModal', function (e) {

                var payload = e.detail;

                callback(payload);
            });
        };

        _getotp.onSuccess = function (callback) {

            var self = this;

            window.addEventListener('onOtpSucces', function (e) {

                var payload = e.detail;

                callback(payload);
            });
        };

        _getotp.onFailed = function (callback) {

            var self = this;

            window.addEventListener('onOtpFailed', function (e) {

                var payload = e.detail;

                callback(payload);
            });
        };

        // end client callback

        // for development purpose

        _getotp.addOrigin = function (origin) {
            origin = origin.replace(/\/$/, '');
            this.trusted_origins.push(origin);
            return this.trusted_origins;
        };

        _getotp.clearSession = function () {
            sessionStorage.removeItem(this.settings.url_storage_key);
        };

        return _getotp;
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