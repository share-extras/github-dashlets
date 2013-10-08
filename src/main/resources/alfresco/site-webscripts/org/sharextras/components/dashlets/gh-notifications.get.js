function main()
{
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
         // TODO Need to get these values from the web tier config (same source as used by connector)
         clientId: "0b2807d35864befb93c7"
      }
   };
   
   model.widgets = [dashlet, dashletResizer];
}
main();