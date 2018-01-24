import { DataManager } from "./DataManager.js";
import { ServerCom } from "./ServerCom.js";
import PostmanFooterForm from './PostmanFooterForm.html';

const SERVER_URL = "https://wt-3d8e69c28886f9c9f7ed6ba6797d805b-0.run.webtask.io/postman";
var postmanForm = null;
var dataManager = null;


function init(){
  dataManager = new DataManager();

   if( !dataManager.shouldShowPostman() )
    return;

  var feedUrl = dataManager.getFeedUrl();

  if( !feedUrl )
   return;

  postmanForm = new PostmanFooterForm({
    target: document.body,
    data: {
      message: "Hello, subscribe!"
    }
  });


  postmanForm.closeCallback = function(){
    var email = postmanForm.get("email");
    console.log("email: " + email);
  }

  postmanForm.submitCallback = function(){
    var email = postmanForm.get("email");

    ServerCom.post(
      SERVER_URL,     // url
      "/subscribe",   // route
      {               // data
        email: email,
        feedUrl: feedUrl
      },
      function( res ){
        if( res.error ){
          console.warn( res.message );
          return;
        }

        console.log( res );

      }
    )

  }
}




init();

export default app;
