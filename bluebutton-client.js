(function(window){

  var BBClient = window.BBClient || (window.BBClient = {debug: true});

  var oauthResult = window.location.hash.match(/#(.*)/);
  oauthResult = oauthResult ? oauthResult[1] : "";
  oauthResult = oauthResult.split(/&/);

  BBClient.authorization = null;
  BBClient.state = null;

  var authorization = {};
  for (var i = 0; i < oauthResult.length; i++){
    var kv = oauthResult[i].split(/=/);
    if (kv[0].length > 0) {
      authorization[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    }
  }

  if (Object.keys(authorization).length > 0){
    BBClient.authorization = authorization;
    BBClient.state = JSON.parse(localStorage[BBClient.authorization.state]);
  }

  console.log(BBClient);

  // don't expose hash in the URL while in production mode
  if (BBClient.debug !== true) {
    window.location.hash="";
  }

  BBClient.authorize = function(params){

    // 1. register to obtain a client_id
    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: params.provider.oauth2.registration_uri,
      data:JSON.stringify(params.client)

      // 2. then authorize to access records
    }).success(function(client){

      var state = Guid.newGuid();
      params.state = params.state || {};
      $.extend(params.state, {client: client, provider: params.provider});
      localStorage[state] = JSON.stringify(params.state);

      window.location.href=params.provider.oauth2.authorize_uri + "?" + 
        "client_id="+client.client_id+"&"+
        "response_type=token&"+
        "scope="+ (params.scope ? params.scope.join("+") : "summary+search")+"&"+
        "redirect_uri="+url+"index.html&"+
        "state="+state;
    });
  };

  BBClient.summary = function(callback){
    $.ajax({
      type: "GET",
      dataType: "text",
      headers: {"Authorization" : "Bearer " + BBClient.authorization.access_token},
      url: BBClient.state.provider.bb_api.summary
    }).success(function(summary) {
      var bb = BlueButton(summary);
      callback && callback(bb.data);
    });
  };

  var Guid = Guid || (function () {

    var EMPTY = '00000000-0000-0000-0000-000000000000';

    var _padLeft = function (paddingString, width, replacementChar) {
      return paddingString.length >= width ? paddingString : _padLeft(replacementChar + paddingString, width, replacementChar || ' ');
    };

    var _s4 = function (number) {
      var hexadecimalResult = number.toString(16);
      return _padLeft(hexadecimalResult, 4, '0');
    };

    var _cryptoGuid = function () {
      var buffer = new window.Uint16Array(8);
      window.crypto.getRandomValues(buffer);
      return [_s4(buffer[0]) + _s4(buffer[1]), _s4(buffer[2]), _s4(buffer[3]), _s4(buffer[4]), _s4(buffer[5]) + _s4(buffer[6]) + _s4(buffer[7])].join('-');
    };

    var _guid = function () {
      var currentDateMilliseconds = new Date().getTime();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (currentChar) {
        var randomChar = (currentDateMilliseconds + Math.random() * 16) % 16 | 0;
        currentDateMilliseconds = Math.floor(currentDateMilliseconds / 16);
        return (currentChar === 'x' ? randomChar : (randomChar & 0x7 | 0x8)).toString(16);
      });
    };

    var create = function () {
      var hasCrypto = typeof (window.crypto) != 'undefined',
      hasRandomValues = typeof (window.crypto.getRandomValues) != 'undefined';
      return (hasCrypto && hasRandomValues) ? _cryptoGuid() : _guid();
    };

    return {
      newGuid: create,
      empty: EMPTY
    };})(); 

}(window));
