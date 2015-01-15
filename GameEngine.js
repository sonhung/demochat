// GameEngine.js 1.0.0.0

var ss = require('ss'),
    express = require('express'),
    WS = require('ws'),
    http = require('http'),
    url = require('url');
var $global = this;

// UserManager

function UserManager() {
  this.userlist = [];
  this.rooms = [];
}
var UserManager$ = {
  user_Solve: function(socket, msg) {
    try {
      var mess = msg.split('_');
      if (mess[0] === 'login') {
        this._login(socket, mess[1], mess[2]);
      }
      else if (mess[0] === 'mess') {
        this._send(mess[1], mess[2], mess[3]);
      }
      else if (mess[0] === 'addfriend') {
        this._addFriend(mess[1], mess[2]);
      }
    }
    catch (ex) {
      console.dir(ex);
    }
  },
  find: function(user_name) {
    var user = new User();
    for (var i = 0; i < this.userlist.length; i++) {
      if (this.userlist[i].get_name() === user_name) {
        user = this.userlist[i];
      }
    }
    return user;
  },
  _login: function(socket, username, pass) {
    if (pass === '123456') {
      socket.send('loginOK');
      console.log('loginOK');
      var name = username;
      var user = new User();
      user.set_name(name);
      console.log(user.get_name());
      user.set_socket(socket);
      for (var i = 0; i < user.friends.length; i++) {
        if (user.friends[i] !== name) {
          user.send('friend_' + user.friends[i]);
          console.log('friend_' + user.friends[i]);
        }
      }
      for (var i = 0; i < this.rooms.length; i++) {
        user.send('room_create_' + this.rooms[i]);
      }
      var check = 0;
      for (var i = 0; i < this.userlist.length; i++) {
        console.log('online_' + this.userlist[i].get_name());
        user.send('online_' + this.userlist[i].get_name());
        if (this.userlist[i].get_name() === name) {
          check = 1;
        }
      }
      if (!check) {
        for (var i = 0; i < this.userlist.length; i++) {
          this.userlist[i].send('online_' + name);
          console.log('online_' + name);
        }
      }
      this.userlist.push(user);
    }
    else {
      socket.send('loginFail');
      console.log('loginFail');
    }
  },
  _send: function(user_send, user_received, content) {
    var user = this.find(user_send);
    user.send('sent_' + user_received + '_' + content);
    try {
      user = this.find(user_received);
      user.send('mess_' + user_send + '_' + content);
    }
    catch ($e1) {
    }
  },
  _addFriend: function(user_name, friend_name) {
    var user = this.find(user_name);
    user.add_Friend(friend_name);
    user.send('friend_' + friend_name);
    user = this.find(friend_name);
    user.send('friend_' + user_name);
  }
};


// GroupManager

function GroupManager() {
  this._userManager = new UserManager();
}
var GroupManager$ = {
  group_Solve: function(msg, user_Manager) {
    this._userManager = user_Manager;
    var mess = msg.split('_');
    if (mess[1] === 'create') {
      this._create(mess[2], mess[3]);
    }
    else if (mess[1] === 'add') {
      this._add(mess[2], mess[3]);
    }
    else if (mess[1] === 'mess') {
      this._chat(mess[2], mess[3], mess[4]);
    }
  },
  _create: function(group_name, user_name) {
    var user = this._userManager.find(user_name);
    var check = 0;
    for (var i = 0; i < GroupManager._grouplist.length; i++) {
      if (GroupManager._grouplist[i].get_name() === group_name) {
        check = 1;
      }
    }
    if (check === 1) {
      user.send('group_error');
      console.log('group_error');
    }
    else {
      var group = new Group();
      group.set_name(group_name);
      group.users.push(user);
      GroupManager._grouplist.push(group);
      user.send('group_create_' + group_name);
    }
  },
  _add: function(group_name, user_name) {
    try {
      var group = new Group();
      group = this._find(group_name);
      var check = true;
      for (var i = 0; i < group.users.length; i++) {
        if (group.users[i].get_name() === user_name) {
          check = false;
        }
      }
      if (!!check) {
        var user = new User();
        user = this._userManager.find(user_name);
        group.users.push(user);
        group.send('group_add_' + group_name + '_' + user_name);
      }
    }
    catch (ex) {
      console.dir(ex);
    }
  },
  _chat: function(group_name, user_name, content) {
    var group = new Group();
    group = this._find(group_name);
    group.send('group_mess_' + group_name + '_' + user_name + '_' + content);
  },
  _find: function(group_name) {
    var group = new Group();
    for (var i = 0; i < GroupManager._grouplist.length; i++) {
      if (GroupManager._grouplist[i].get_name() === group_name) {
        group = GroupManager._grouplist[i];
      }
    }
    return group;
  }
};


// RoomManager

function RoomManager() {
  this._roomlist = [];
  this._userManager = new UserManager();
}
var RoomManager$ = {
  room_Solve: function(msg, user_Manager) {
    this._userManager = user_Manager;
    var mess = msg.split('_');
    if (mess[1] === 'create') {
      this._create(mess[2], mess[3]);
    }
    else if (mess[1] === 'join') {
      this._join(mess[2], mess[3]);
    }
    else if (mess[1] === 'mess') {
      this._chat(mess[2], mess[3], mess[4]);
    }
  },
  _create: function(room_name, user_name) {
    var check = 0;
    for (var i = 0; i < this._roomlist.length; i++) {
      if (this._roomlist[i].get_name() === room_name) {
        check = 1;
      }
    }
    if (check === 1) {
      var user = this._userManager.find(user_name);
      user.send('room_error');
    }
    else {
      for (var i = 0; i < this._userManager.userlist.length; i++) {
        this._userManager.userlist[i].send('room_create_' + room_name);
        console.log('room_create_' + room_name);
      }
      var room = new Room();
      room.set_name(room_name);
      this._roomlist.push(room);
      this._userManager.rooms.push(room_name);
    }
  },
  _join: function(room_name, user_name) {
    var room = new Room();
    room = this._find(room_name);
    var check = true;
    for (var i = 0; i < room.users.length; i++) {
      if (user_name === room.users[i].get_name()) {
        check = false;
        break;
      }
    }
    if (!!check) {
      var user = this._userManager.find(user_name);
      room.users.push(user);
      room.send('room_join_' + room_name + '_' + user_name);
    }
  },
  _chat: function(room_name, user_name, content) {
    var room = new Room();
    room = this._find(room_name);
    room.send('room_mess_' + room_name + '_' + user_name + '_' + content);
    console.log('room_mess_' + room_name + '_' + user_name + '_' + content);
  },
  _find: function(room_name) {
    var room = new Room();
    for (var i = 0; i < this._roomlist.length; i++) {
      if (this._roomlist[i].get_name() === room_name) {
        room = this._roomlist[i];
      }
    }
    return room;
  }
};


// Group

function Group() {
  this._name = '';
  this.users = [];
}
var Group$ = {
  get_name: function() {
    return this._name;
  },
  set_name: function(value) {
    this._name = value;
    return value;
  },
  send: function(mess) {
    for (var i = 0; i < this.users.length; i++) {
      this.users[i].send(mess);
    }
  }
};


// Room

function Room() {
  this._name = '';
  this.users = [];
}
var Room$ = {
  get_name: function() {
    return this._name;
  },
  set_name: function(value) {
    this._name = value;
    return value;
  },
  send: function(mess) {
    for (var i = 0; i < this.users.length; i++) {
      this.users[i].send(mess);
    }
  }
};


// User

function User() {
  this._name = '';
  this.friends = ['Dat', 'Duy', 'Khang', 'Khanh', 'Phi', 'Phuc', 'Son'];
}
var User$ = {
  get_name: function() {
    return this._name;
  },
  set_name: function(value) {
    this._name = value;
    return value;
  },
  get_socket: function() {
    return this._socket;
  },
  set_socket: function(value) {
    this._socket = value;
    return value;
  },
  send: function(msg) {
    this.get_socket().send(msg);
  },
  add_Friend: function(name) {
    var check = true;
    for (var i = 0; i < this.friends.length; i++) {
      if (this.friends[i] === name) {
        check = false;
      }
    }
    if (!!check) {
      this.friends.push(name);
    }
  }
};


// Utility

function Utility() {
}
Utility.randInt = function(from, to) {
  if (to < from) {
    var temp = to;
    to = from;
    from = temp;
  }
  return Math.floor(from + Math.random() * (to - from + 1));
};
Utility.randIntSqrt = function(from, to) {
  var dir = (from < to) ? 1 : -1;
  var rand = Math.random() * Math.sqrt(Math.abs(from - to));
  return Math.round(from + dir * rand * rand);
};
Utility.randString = function(length, includeWhitespace) {
  if (!ss.isValue(length)) {
    length = 10;
  }
  if (!ss.isValue(includeWhitespace)) {
    includeWhitespace = false;
  }
  var res = [];
  var charSet = Utility._charSet;
  if (includeWhitespace) {
    charSet += ' ';
  }
  var len = charSet.length;
  for (var i = 0; i < length; i++) {
    res.push(charSet[Utility.randInt(0, len - 1)]);
  }
  return res.join('');
};
Utility.getTime = function() {
  return ss.now().getTime();
};
Utility.normalizeIdOrName = function(name) {
  if (name == null) {
    name = '';
  }
  name = ss.replaceString(name, '_', '').trim();
  if (name.length > 20) {
    name = name.substr(0, 20).trim();
  }
  return name;
};
Utility.writeLog = function(obj) {
  console.log(JSON.stringify(obj));
};
Utility.joinParams = function(token1) {
  return ss.array(arguments).join('_');
};
Utility.parseCookie = function(requestHeaders) {
  var cookieString = requestHeaders['cookie'];
  var cookieSet = {};
  if (!ss.whitespace(cookieString)) {
    var cookies = cookieString.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      if (ss.whitespace(cookie)) {
        break;
      }
      var first = cookie.indexOf('=');
      if (first > 0) {
        var name = cookie.substr(0, first).trim().toLowerCase();
        var value = unescape(cookie.substr(first + 1, cookie.length - first - 1));
        if (!!name && !!value) {
          cookieSet[name] = value;
        }
      }
    }
  }
  return cookieSet;
};
Utility.convertCookieToString = function(cookieSet) {
  var cookies = [];
  for (var $key1 in cookieSet) {
    var kpv = { key: $key1, value: cookieSet[$key1] };
    cookies.push(kpv.key + '=' + escape(kpv.value));
  }
  return cookies.join(';');
};
Utility.shuffleArray = function(arr) {
  var len = arr.length;
  for (var i = len - 1; i >= 1; i--) {
    var j = Utility.randInt(0, i);
    if (j < i) {
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  return arr;
};
Utility.shuffleArray2 = function(arr) {
  var len = arr.length;
  var dicArr = new Array(len);
  for (var i = 0; i < len; i++) {
    var rand = Math.random();
    dicArr[i] = { Source: arr[i], Seed: Math.random(), toString: (function() {
      return this.Seed;
    }) };
  }
  dicArr.sort();
  arr = new Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = dicArr[i]['Source'];
  }
  return arr;
};
Utility.shuffleDictionary = function(dic) {
  var dicArr = [];
  for (var $key1 in dic) {
    var entry = { key: $key1, value: dic[$key1] };
    dicArr.push({ Key: entry.key, Value: entry.value });
    delete dic[entry.key];
  }
  dicArr = Utility.shuffleArray(dicArr);
  var len = dicArr.length;
  for (var i = 0; i < len; i++) {
    dic[dicArr[i]['Key']] = dicArr[i]['Value'];
  }
  return dic;
};


// Server

function Server() {
}
Server._processWebRequest = function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  var urlData = url.parse(request.url);
  if (urlData.pathname.toLowerCase() === '/gamelist') {
    response.write('fdsfadsfasdf');
  }
  response.end();
};
Server.socket_OnOpen = function(socket) {
  console.log('on open');
};
Server.socket_OnConnect = function(socket) {
  socket.onmessage = (function(data) {
    var msg = new MessageData(data);
    console.log(msg.data);
    if (msg.type === 'room') {
      Server._roomManager.room_Solve(msg.data, Server._userManager);
    }
    else if (msg.type === 'group') {
      Server._groupManager.group_Solve(msg.data, Server._userManager);
    }
    else {
      Server._userManager.user_Solve(socket, msg.data);
    }
  });
  Server.socket_OnClose(socket);
};
Server.socket_OnClose = function(socket) {
  socket.onclose = (function() {
    var user_name = '';
    var count = 0;
    for (var i = 0; i < Server._userManager.userlist.length; i++) {
      if (Server._userManager.userlist[i].get_socket() === socket) {
        user_name = Server._userManager.userlist[i].get_name();
        Server._userManager.userlist.splice(i, 1);
      }
    }
    for (var i = 0; i < Server._userManager.userlist.length; i++) {
      Server._userManager.userlist[i].send('offline_' + user_name);
      console.log('offline_' + user_name);
    }
  });
};
Server.socketServer_OnClose = function(scoket) {
};


// MessageData

function MessageData(msg) {
  var dic = ss.safeCast(msg, Object);
  this.data = dic['data'];
  var mess = this.data.split('_');
  this.type = mess[0];
}
var MessageData$ = {

};


var $exports = ss.module('GameEngine',
  {
    Server: [ Server, null, null ]
  },
  {
    UserManager: [ UserManager, UserManager$, null ],
    GroupManager: [ GroupManager, GroupManager$, null ],
    RoomManager: [ RoomManager, RoomManager$, null ],
    Group: [ Group, Group$, null ],
    Room: [ Room, Room$, null ],
    User: [ User, User$, null ],
    Utility: [ Utility, null, null ],
    MessageData: [ MessageData, MessageData$, null ]
  });

GroupManager._grouplist = [];
Utility._charSet = 'QWERTYUIOPASDFGHJKLZXCVBNM01234567890123456789';
Server._userManager = new UserManager();
Server._roomManager = new RoomManager();
Server._groupManager = new GroupManager();
(function() {
  var port = 8721;
  var httpPort = 9721;
  var nonSecureServer = http.createServer();
  var nonSecureApp = nonSecureServer.listen(port);
  var nonSecureWss = new WS.Server({ server: nonSecureApp });
  nonSecureWss.on('connection', Server.socket_OnOpen);
  nonSecureWss.on('connection', Server.socket_OnConnect);
  console.log('Nonsecure Websocket is opened on port: ' + port);
  var webServer;
  webServer = http.createServer(Server._processWebRequest);
  webServer.listen(httpPort);
  console.log('Nonsecure Web Server is running on port: ' + httpPort);
})();

