//import feedme  from 'feedme';
import * as htmlparser from 'htmlparser'

class DataManager {

  constructor(){

    // data from the <script> markup, config of Postman
    this._scriptConfigData = {
      feedUrl: null,
      apiKey: null,
      theme: null,
      isValid: false
    }

    // fetched from the the meta markups
    this._currentPageData = {
      title: null,
      description: null,
      image: null
    }

    // fetched from local storage (possibly not existant)
    this._localStorageData = null;
    this._isFirstVisit = true;

    this._init();
  }


  _init(){
    this._fetchLocalStorageData();
    this._fetchCurrentPageData();
    this._fetchScriptConfigData();
  }


  _fetchScriptConfigData(){
    var that = this;
    this._scriptConfigData.apiKey = document.currentScript.getAttribute("key");
    this._scriptConfigData.theme = document.currentScript.getAttribute("theme");

    var feedUrl = document.currentScript.getAttribute("feed");
    that._scriptConfigData.feedUrl = feedUrl;

    // if( feedUrl ){
    //
    //   fetch( feedUrl )
    //   .then(function(response) {
    //     if( response.status > 200 ){
    //       throw "Error status: " + response.status;
    //       return;
    //     }
    //
    //     return response.text();
    //   }).then(function(rssXml) {
    //
    //     var handler = new htmlparser.RssHandler(function (error, rss) {
    //       if( error ){
    //         console.warn( error );
    //         return;
    //       }
    //       if( "items" in rss && rss.items.length > 1){
    //           that._scriptConfigData.feedUrl = feedUrl;
    //       }
    //       console.log( rss );
    //     });
    //
    //     var parser = new htmlparser.Parser(handler);
    //     parser.parseComplete(rssXml);
    //
    //   })
    //   .catch( function(e){
    //     console.log( e );
    //   });
    // }

  }


  _fetchCurrentPageData(){
    function getMeta( rule ){
      var meta = null;

      try{
        meta = document.querySelector( rule );
      }catch(e){}

      var attr = null;

      if( meta ){
        try{
          attr = meta.getAttribute("content")
        }catch(e){}
      }
      return attr;
    }

    this._currentPageData.image = getMeta( "meta[property='og:image']" ) ||
                                  getMeta( "meta[name='twitter:image']" )

    this._currentPageData.description = getMeta( "meta[property='og:description']" ) ||
                                        getMeta( "meta[name='twitter:description']" ) ||
                                        getMeta( "meta[name='description']" );

    this._currentPageDatatitle = getMeta( "meta[property='og:title']" ) ||
                                 getMeta( "meta[name='twitter:title']" ) ||
                                 document.querySelector( "title").text;

  }


  _fetchLocalStorageData(){
    /*
    the local storage for "postman" is a JSON string of the following object:
    {
      hide: Boolean, // true: dont show the Postman widget, false: show it
      lastVisit: Date, // date of the last visit
      subscribed: Boolean ??
    }
    */

    var localPostman = localStorage.getItem("postman");

    if( localPostman ){
      this._isFirstVisit = false;
      this._localStorageData = JSON.parse( window.localStorage.getItem("postman") );
      this._localStorageData.lastVisit = new Date( this._localStorageData.lastVisit );
    }else{
      this._localStorageData = {
        hide: false,
        lastVisit: new Date(),
        subscribed: false
      }
      this._writeToLocalStorage()
    }
  }

  _writeToLocalStorage(){
    window.localStorage.setItem("postman", JSON.stringify( this._localStorageData ))
  }

  isFeedUrlValid(){
    return this._scriptConfigData.isValid;
  }

  getFeedUrl(){
    return this._scriptConfigData.feedUrl;
  }

  shouldShowPostman(){
    return ( !this._localStorageData.subscribed || (new Date() - this._localStorageData.lastVisit > 86400000) )
    // 86400000 is 1 day in ms
  }



  updateLastVisitDate(){
    this._localStorageData.lastVisit = new Date();
    this._writeToLocalStorage();
  }

  enableSubscribe(){
    this._localStorageData.subscribed = true;
    this._writeToLocalStorage();
  }


  close(){
    this.updateLastVisitDate();
  }

}


export { DataManager };
