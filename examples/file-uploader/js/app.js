
const Type = require('union-type');
const T = require('ramda/src/T')
    , assoc = require('ramda/src/assoc')
    , curry  = require('ramda/src/curry')
    , compose  = require('ramda/src/compose')
    , map  = require('ramda/src/map')
    , invoker = require('ramda/src/invoker') 
;
const h = require('snabbdom/h');

const uploadList = require('./list');
const uploader   = require('./uploader');
  

// app constants

const UPLOAD_URL = '/upload'
const UPLOAD_HEADERS = {}


// action

const listUpdate = (listAction,model) => {
  const [state, tasks] = uploadList.update(listAction, model.uploads);
  return [ assoc('uploads', state, model), 
           tasks.map( map(Action.Route) ) 
         ];
}

const Action = Type({
  Create: [T, T],
  Route:  [uploadList.Action]
});

const update = Action.caseOn({
  Create: (up,files,model) => (
    listUpdate( uploadList.Action.Create(up,files), model )
  ),

  Route: listUpdate
});


// model

const init = () => { return { uploads: uploadList.init() }; }

// view

const view = curry( ({action$}, model) => {

  const up = uploader.upload(UPLOAD_HEADERS, UPLOAD_URL);
  
  return (
    h('div.uploading', {}, [
      form(action$, up),
      uploadList.view(model.uploads)
    ])
  );
});

const form = (action$, up) => (
  h('form', {on: {submit: preventDefault} }, [
     h('input', 
       { props: {type: 'file', multiple: true},
         on:   {
           change: compose(action$, Action.Create(up), getTarget('files')) 
         }
       }
     )
   ]
  )
);


const getTarget = curry( (key,e) => e.target[key] );
const preventDefault = invoker(0, 'preventDefault');


module.exports = { init, update, Action, view }

