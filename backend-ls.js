math.factory('Backend', function ($q) {

  var users = JSON.parse(localStorage["users"] || "{}");

  var user_token = localStorage["user_token"] || "";

  var user = null;

  var persist = function () {
    localStorage["users"] = JSON.stringify(users);
    localStorage["user_token"] = user_token;
  };

  // not crypto, but who gives a damn for this jazz?
  var djb2 = function (str) {
    var hash = 5381;
    for (var i=0; i<str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return hash;
  };

  var token = function () {
    return (Math.random() + 1).toString(36).substring(2);
  };

  var signup = function (username, password) {
    username = username.trim();
    var auth = $q.defer();
    if (username in users) auth.reject("username already in use");
    else if (password.length === 0) auth.reject("password field empty");
    else if (username.length === 0) auth.reject("username field empty");
    else {
      user_token = token();
      var hash = djb2(password);
      users[username] = {password: hash, token: user_token, history: [], name:username, op: "+", time: 1, level: 2};
      auth.resolve(users[username]);
      user = user;

      persist();
    }
    return auth.promise;
  };

  var login = function (username, password) {
    username = username.trim();
    var deferred = $q.defer();
    var u;
    if ((u = users[username.trim()]) != null && u.password === djb2(password)) {
      deferred.resolve(u);
      user = u;
      user_token = token();
      user.token = user_token;
      persist();
    } else {
      deferred.reject("bad login credentials");
    }
    return deferred.promise;
  };

  var logout = function () {
    user = null;
    user_token = "";
    persist();
  };

  var history = function () {
    var d = $q.defer();
    if (user != null) {
      d.resolve(user.history);
    } else {
      d.reject("not logged in");
    }
    return d.promise;
  };

  var recoverSession = function () {
    var d = $q.defer();
    if (user != null) {
      d.resolve(user);
    } else if (user_token.length > 0) {
      for (var u in users) {
        if (users[u].token === user_token) {
          user = users[u];
          d.resolve(user);
          break;
        }
      }
      if (user == null) {
        d.reject("no active session found");
      }
    } else {
      d.reject("no active session found");
    }
    return d.promise;
  };

  var log = function (mode, level, time, score) {
    if (user = null) {
      throw new Error("what you is doing?");
    } else {
      user.history.push({mode: mode, level: level, time: time, score: score, timestamp: +new Date()});
      persist();
    }
  };

  var update = function (prop, val) {
    if (user) {
      user[prop] = val;
      persist();
    }
  };

  return {
    update: update,
    signup: signup,
    login: login,
    logout: logout,
    history: history,
    log: log,
    recoverSession: recoverSession
  };

});