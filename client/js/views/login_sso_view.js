/**
 * @fileOverview This file has functions related to login view. This view calling from application view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: user model.
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * Login SSO View
 * @class LoginSsoView
 * @constructor
 * @extends Backbone.View
 */
App.LoginSsoView = Backbone.View.extend({
    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function() {    
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
        }
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('token')){
            var token = urlParams.get('token');
            this.startSSO12(token);
        } else {
            this.startSSO1();
        }
        

        this.render();
        this.changeFavicon();
    },
    template: JST['templates/login_sso'],
    tagName: 'section',
    errorText: '',
    isLoading: false,
    className: 'clearfix',

    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
    },

    startSSO1: function () {
        var self = this;
        this.isLoading = true;
        this.errorText = "";
        Backbone.ajax({
            url: api_url + "ituniversum/sso/saml20/login",
            success: function(response){
                this.isLoading = false;
                if (response.status == "SUCCESS"){
                    self.processLogin(response.action);
                } else {
                    
                }
            }
        });        
    },

    startSSO12: function (token) {
        var self = this;
        this.isLoading = true;
        this.errorText = "";
        Backbone.ajax({
            url: api_url + "ituniversum/sso/saml20/auth?token="+token,
            success: function(response){
                this.isLoading = false;
                self.processSSO2(response);
            }
        });
    },

    processLogin: function (action) {
        switch (action.type) {
            case 'redirect': {
                location.replace(action.to);
                break;
            }
        }        
    },

    processSSO2: function (response) {
        var auth_response = {};
        auth_response.user = {};
        auth_response.access_token = response["access-token"];
        auth_response.refresh_token = response["refresh-token"];
        auth_response.user.id = response.user.id;
        auth_response.user.is_productivity_beats = response.user.is_productivity_beats;
        auth_response.user.initials = response.user.initials;
        auth_response.user.profile_picture_path = response.user.profile_picture_path;
        auth_response.user.role_id = response.user.role_id;
        auth_response.user.username = response.user.username;
        auth_response.user.full_name = response.user.full_name;
        auth_response.user.persist_card_divider_position = response.user.persist_card_divider_position;
        auth_response.user.timezone = response.user.timezone;
        auth_response.board_id = response.board_id;
        auth_response.user.notify_count = response.user.notify_count;
        auth_response.user.unread_activity_id = response.user.unread_activity_id;
        auth_response.user.last_activity_id = response.user.last_activity_id;
        auth_response.user.language = response.user.language;
        auth_response.user.default_desktop_notification = response.user.default_desktop_notification;
        auth_response.user.is_list_notifications_enabled = response.user.is_list_notifications_enabled;
        auth_response.user.is_card_notifications_enabled = response.user.is_card_notifications_enabled;
        auth_response.user.is_card_members_notifications_enabled = response.user.is_card_members_notifications_enabled;
        auth_response.user.is_card_labels_notifications_enabled = response.user.is_card_labels_notifications_enabled;
        auth_response.user.is_card_checklists_notifications_enabled = response.user.is_card_checklists_notifications_enabled;
        auth_response.user.is_card_attachments_notifications_enabled = response.user.is_card_attachments_notifications_enabled;
        auth_response.user.is_ldap = response.user.is_ldap;
        auth_response.user.is_intro_video_skipped = response.user.is_intro_video_skipped;
        auth_response.user.is_two_factor_authentication_enabled = response.user.is_two_factor_authentication_enabled;
        $.cookie('auth', JSON.stringify(auth_response));
        i18next.changeLanguage(response.user.language);
        api_token = response["access-token"];
        localforage.setItem("links", response.role_links);
        var links = JSON.parse(response.role_links);
        role_links.reset();
        if (!_.isEmpty(links)) {
            role_links.add(links);
        }
        if (!_.isUndefined(APPS) && APPS !== null && !_.isEmpty(APPS.enabled_apps) && !_.isUndefined(APPS.enabled_apps) && APPS.enabled_apps !== null) {
            APPS.permission_checked_apps = [];
            _.each(APPS.enabled_apps, function(app) {
            if (!_.isEmpty(authuser.user) && !_.isUndefined(authuser.user)) {
                if ((!_.isEmpty(role_links.where({
                        slug: app
                    })) || parseInt(authuser.user.role_id) === 1) && $.inArray(app, APPS.permission_checked_apps) === -1) {
                        APPS.permission_checked_apps.push(app);
                    }
                }
            });
        }

        auth_user_organizations.add(response.user.organizations);
        this.changeFavicon(response.user.notify_count);
        this.headerView = new App.HeaderView({
            model: new App.User()
        });
        $('.company').addClass('hide');
        $('#header').html(this.headerView.el);
        if (!_.isEmpty($.cookie('redirect_link'))) {
            var redirect_link = $.cookie('redirect_link');
            $.removeCookie('redirect_link');
            window.location = redirect_link;
        } else {
            window.location = '/';
        }
    },

    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    render: function() {
        var ldap_servers = [];
        if (!_.isUndefined(R_MLDAP_SERVERS) && !_.isEmpty(R_MLDAP_SERVERS)) {
            ldap_servers = R_MLDAP_SERVERS.split(',');
        }
        this.$el.html(this.template({
            ldap_servers: ldap_servers,
            errorText: this.errorText,
            isLoading: this.isLoading
        }));
        this.showTooltip();
        return this;
    },
    
    /**
     * changeFavicon()
     * update notification count in favicon
     * @param count
     * @type number
     *
     */
    changeFavicon: function(count) {
        if (!_.isUndefined(count) && count !== '0') {
            favicon.badge(count);
        } else {
            favicon.badge(0);
        }
    }
});
