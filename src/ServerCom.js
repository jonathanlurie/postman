class ServerCom {
  static post( baseUrl, route, data, cb ){


    var url = baseUrl + route;
    var status = null;

    fetch(url,
    {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then(function(res){
      status = res.status;
      if( status > 200 ){
        throw "Server error, status " + status;
        return;
      }
      return res.json();
    })
    .then(function(data){
      cb( data )
    })
    .catch(function(e){
      cb( {error: 1, message: e} )
    })

  }


}

export { ServerCom };
