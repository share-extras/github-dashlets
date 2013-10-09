/*
 * Copyright (C) 2010-2013 Share Extras contributors
 *
 * This file is part of the Share Extras project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
* Extras root namespace.
* 
* @namespace Extras
*/
if (typeof Extras == "undefined" || !Extras)
{
   var Extras = {};
}

/**
* Extras dashlet namespace.
* 
* @namespace Extras.dashlet
*/
if (typeof Extras.dashlet == "undefined" || !Extras.dashlet)
{
   Extras.dashlet = {};
}

/**
 * GitHub Notifications Dashlet.
 * 
 * @namespace Extras
 * @class Extras.dashlet.GitHubNotifications
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;


   /**
    * Dashboard GitHubNotifications constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.GitHubNotifications} The new component instance
    * @constructor
    */
   Extras.dashlet.GitHubNotifications = function GitHubNotifications_constructor(htmlId)
   {
      return Extras.dashlet.GitHubNotifications.superclass.constructor.call(this, "Extras.dashlet.GitHubNotifications", htmlId);
   };

   /**
    * Extend from Alfresco.component.Base and add class implementation
    */
   YAHOO.extend(Extras.dashlet.GitHubNotifications, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Identifier used for storing the an OAuth 2.0 token in the repository personal credentials
          * store.
          * 
          * @property endpointId
          * @type string
          * @default ""
          */
         endpointId: "",
         
         /**
          * URI of the provider's authorization page. If an access token does not already exist then the
          * user will be sent here in order to obtain one.
          * 
          * @property authorizationUrl
          * @type string
          * @default ""
          */
         authorizationUrl: "",
         
         /**
          * Comma-separated list of scopes to be requested
          * 
          * @property scopes
          * @type string
          * @default "notifications"
          */
         scopes: "notifications",
         
         /**
          * OAuth client (application) ID
          * 
          * Must be included as a URL parameters when the user is sent to the provider's authorization page
          * 
          * @property clientId
          * @type string
          * @default ""
          */
         clientId: "",
         
         /**
          * URL of the web script (minus the leading slash) to be used as the return landing page after
          * authorization has taken place. The script must exchange the temporary code for an access
          * token and persist it to the repository.
          * 
          * @property returnPage
          * @type string
          * @default "extras/oauth/auth2-return"
          */
         returnPage: "extras/oauth/auth2-return"
      },

      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function GitHubNotifications_onReady()
      {
         // Connect button
         Alfresco.util.createYUIButton(this, "connectButton", this.onConnectClick);
         
         this.loadFeed();
      },
      
      /**
       * Load a feed from GitHub for display in the dashlet
       * 
       * @method loadFeed
       */
      loadFeed: function GitHubNotifications_loadMessages()
      {
          // Get the feed from the server
          this._request({
              url: "notifications",
              successCallback: {
                  fn: this.renderFeed,
                  scope: this
              },
              failureCallback: {
                  fn: function(p_obj) {
                      // Need to re-authenticate in case of a 401 (Unauthorized) or 403 (Forbidden)
                      if (p_obj.serverResponse.status == 401 || p_obj.serverResponse.status == 403)
                      {
                          this.showConnect();
                      }
                      else
                      {
                          Alfresco.util.PopupManager.displayMessage({
                              text: this.msg("error.loadFeed")
                          });
                      }
                  },
                  scope: this
              }
          });
      },
      
      /**
       * Make a request against the API
       */
      _request: function GitHubNotifications__request(config)
      {
          Alfresco.util.Ajax.jsonRequest({
              url: Alfresco.constants.PROXY_URI.replace("/alfresco/", "/" + this.options.endpointId +"/") + config.url,
              method: config.method || "GET",
              dataObj: config.dataObj || {},
              successCallback: config.successCallback,
              failureCallback: config.failureCallback,
              noReloadOnAuthFailure: true
          });
      },
      
      /**
       * Show the Connect to Chatter button at the top of the dashlet
       */
      showConnect: function GitHubNotifications_showConnect()
      {
          Dom.setStyle(this.id + "-connect", "display", "block");
          Alfresco.util.Anim.fadeIn(this.id + "-connect", {});
      },
      
      /**
       * Render the feed in the dashlet
       * 
       * @method renderFeed
       */
      renderFeed: function GitHubNotifications_renderFeed(p_obj)
      {
          // Show the toolbar
          Dom.setStyle(this.id + "-toolbar", "display", "block");
          
          var cEl = Dom.get(this.id + "-feed"),
              data = p_obj.json;
          
          cEl.innerHTML = this._itemsHTML(data);
      },
      
      /**
       * Generate items markup
       * 
       * @method _itemsHTML
       * @private
       */
      _itemsHTML: function GitHubNotifications__itemsHTML(json)
      {
          var item, html = "", repoId, lastRepoId = 0, repoTitle, itemClass;
          if (json.length)
          {
              for (var i = 0; i < json.length; i++)
              {
                  item = json[i];
                  if (item.subject)
                  {
                      repoId = item.repository.id;
                      repoTitle = "<h3><a href=\"" + item.repository.html_url + "\">" + item.repository.full_name + "</a></h3>";
                      itemClass = "gh-item detail-list-item";
                      if (item.subject.type == "Issue")
                         itemClass += " gh-item-issue";
                      else if (item.subject.type == "PullRequest")
                         itemClass += " gh-item-pull-request";
                      else if (item.subject.type == "Commit")
                         itemClass += " gh-commit-item";
                      html += "<div class=\"" + itemClass + "\">" + 
                          "<div class=\"gh-item-bd\">" + (repoTitle != "" ? repoTitle : "") + 
                          "<div>" + item.subject.title + "</div></div>" + 
                          "<div class=\"gh-item-postedOn\">" + this._relativeTime(new Date(item.updated_at)) + "</div>" + 
                          "</div>";
                  }
              }
          }
          return html;
      },
      
      /**
       * Get relative time where possible, otherwise just return a simple string representation of the supplied date
       * 
       * @method _relativeTime
       * @private
       * @param d {date} Date object
       */
      _relativeTime: function GitHubNotifications__getRelativeTime(d)
      {
          return typeof(Alfresco.util.relativeTime) === "function" ? Alfresco.util.relativeTime(d) : Alfresco.util.formatDate(d);
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */
      
      /**
       * Click handler for Connect to Chatter button clicked
       * 
       * @method onConnectClick
       * @param p_oEvent {object} HTML event
       */
      onConnectClick: function GitHubNotifications_onConnectClick(p_oEvent)
      {
         // TODO if this is a site dashboard we need to persist the location of the page we started from,
         // since it seems URL parameters specified on the return URL are not preserved.
         
         // TODO add a random parameter to the state and ensure that this comes back unmodified
         
         var returnUrl = window.location.protocol + "//" + window.location.host + 
               Alfresco.constants.URL_PAGECONTEXT + this.options.returnPage + "/" + encodeURIComponent(this.options.endpointId),
            pageUrl = window.location.pathname.replace(Alfresco.constants.URL_CONTEXT, ""),
            state = "rp=" + encodeURIComponent(pageUrl),
            authUri = this.options.authorizationUrl + 
               "?response_type=code&client_id=" + 
               this.options.clientId + "&redirect_uri=" +
               encodeURIComponent(returnUrl) + "&state=" + 
               encodeURIComponent(state);
         if (this.options.scopes)
         {
            authUri += "&scope=" + encodeURIComponent(this.options.scopes)
         }
         
         window.location = authUri;
         
      }
   });
})();
