import { DataManager } from "./DataManager.js"
import PostmanFooterForm from './PostmanFooterForm.html';

//
// console.log( document.currentScript.getAttribute("rss"));
//
// var app = new App({
//   target: document.body,
//   data: {
//     "name": ""
//   }
// });

var postmanForm = null;
var dataManager = null;


function fetchThat(){
  var myHeaders = new Headers();

  var fetchConfig = {
    method: 'GET',
    headers: myHeaders,
    //mode: 'cors',
    cache: 'default'
  };

  //var url = "http://localhost:3000/ping";
  var url = "https://wt-3d8e69c28886f9c9f7ed6ba6797d805b-0.run.webtask.io/stripe-payment/test"

  fetch(url, fetchConfig)
  .then(function(response) {
    if( response.status !== 200 ){
      throw "Unable to get server answer"
      return;
    }
    return response.json();
  })
  .then(function( data ) {
    //var objectURL = URL.createObjectURL(myBlob);
    //myImage.src = objectURL;
    console.log( data );
  })
  .catch( function( e ){
    console.log( e );
  });


}

//fetchThat();


function init(){
  dataManager = new DataManager();

   if( !dataManager.shouldShowPostman() )
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
}




init();

export default app;
