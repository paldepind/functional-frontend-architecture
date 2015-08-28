'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var multipart = require('multiparty');

var UPLOADDIR = 'uploads';
var PORT = process.argv[2] || 8080;

createServer(function(req,res){

  if (req.url == '/upload' && req.method == 'POST'){
    var form = new multipart.Form();
    
    form.on('part', function(part){
      if (!part.filename) return;

      try {
        var fsOut = path.join(__dirname, UPLOADDIR, part.filename);
        var out = fs.createWriteStream(fsOut);
        part.pipe(out);
        console.log('-> ' + fsOut);
      } catch (e) {
        console.error('-X ' + fsOut);
        console.error("Upload error: " + e.message);
        respond(500, e.message, res);
      }

    });
    
    form.on('error', function(){
      respond(400, 'Unable to parse as multipart', res);
    });

    form.on('close', function(){
      respond(200, 'OK', res);
    });

    form.parse(req);

    return;
  }
  
  // otherwise, static file serving
  
  if (req.method == 'GET') {
    var requestUrl = url.parse(req.url);
    var fsPath = path.join( __dirname, requestUrl.pathname);

    fs.exists(fsPath, function(exists) {
      try {
        if(exists) {
          console.log('<- ' + fsPath);
          res.writeHead(200)
          fs.createReadStream(fsPath).pipe(res);
        } else {
          console.error("X- " + fsPath);
          respond(404, "Not Found", res);
        }
      } catch (e) {
        res.end();
      }
    });
    
  } else {
    respond(404, "Not Found", res);
  }
  

  function errhand(e){
    respond(500, e.message, res);
  };

}).listen(PORT);



function createServer(app){
  return http.createServer( wrap(app) );
}

function wrap(app){
  return function(req,res){
    try {
      app(req,res);
    }
    catch (e) {
      respond(500, e.message + "\n" + e.stack, res)
    }
  }
}

function respond(status, msg, res){
  res.writeHead(status, {'content-type': 'text/plain'});
  res.write(msg);
  res.end();
}
