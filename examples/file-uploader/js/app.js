
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
  Create: (up,files,model) => {
    return listUpdate( uploadList.Action.Create(up,files), model );
  },

  Route: listUpdate
});


// model

const init = () => { return { uploads: uploadList.init() }; }

// view

const view = curry( ({url, headers, action$}, model) => {
  
  const up = uploader.upload(headers, url);

  const form = (
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

  return (
    h('div.uploading', {}, [
      form,
      uploadList.view(model.uploads)
    ])
  );
});

const getTarget = curry( (key,e) => e.target[key] );
const preventDefault = invoker(0, 'preventDefault');


module.exports = { init, update, Action, view }

