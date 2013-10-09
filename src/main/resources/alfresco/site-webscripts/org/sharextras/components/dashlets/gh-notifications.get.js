function main()
{
   var endpointId = "github-api",
      connector = remote.connect(endpointId);

   var dashletResizer = {
      id : "DashletResizer",
      name : "Alfresco.widget.DashletResizer",
      initArgs : ["\"" + args.htmlid + "\"", "\"" + instance.object.id + "\""],
      useMessages: false
   };

   var dashlet = {
      id : "GitHubNotifications",
      name : "Extras.dashlet.GitHubNotifications",
      options: {
         endpointId: endpointId,
         clientId: connector.getDescriptor().getStringProperty("client-id"),
         authorizationUrl: "https://github.com/login/oauth/authorize"
      }
   };
   
   model.widgets = [dashlet, dashletResizer];
}
main();