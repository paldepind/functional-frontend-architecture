/* globals XMLHttpRequest, FormData */

const compose = require('ramda/src/compose')
    , __ = require('ramda/src/__')
    , curry = require('ramda/src/curry')
    , always = require('ramda/src/always')
;
const Type = require('union-type');
const Future = require('ramda-fantasy/src/Future');

const identity = (x) => x ;

const Result = Type({
  OK: [Object],
  NotFound: [Object],
  Error: [Object],
  Abort: [Object],
  Unknown:  [Object],
  Progress: [Function, Object]
});


const upload = curry( (headers, url, files) => {
  headers = headers || {};

  return new Future( (rej,res) => {
    const xhr = new XMLHttpRequest();
    const getxhr = always(xhr);
    const abort = xhr.abort.bind(xhr)
    xhr.addEventListener("load",  compose(res, deriveResult, getxhr), false);
    xhr.addEventListener("abort", compose(res, Result.Abort, getxhr), false);
    xhr.addEventListener("error", compose(res, Result.Error, getxhr), false); 

    xhr.upload.addEventListener("progress", 
                                compose(res, Result.Progress(abort)), false);

    xhr.open("post", url, true);
    for (k in headers){
      xhr.setRequestHeader(k, headers[k]);
    }
    xhr.send(formdata(files));
  });
});

module.exports = {upload, Result}


function deriveResult(xhr){
  return (xhr.status <  400                     ? Result.OK :
          xhr.status >= 400 && xhr.status < 500 ? Result.NotFound :
          xhr.status >= 500                     ? Result.Error :
                                                  Result.Unknown
         )(xhr);
}

function formdata(files){
  const data = new FormData();
  for (let i=0; i<files.length; ++i) data.append(files[i].name, files[i]);
  return data;
}

