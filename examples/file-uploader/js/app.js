const Type = require('union-type');
const T = require('ramda/src/T')
    , evolve = require('ramda/src/evolve')
    , curry  = require('ramda/src/curry')
    , map  = require('ramda/src/map')
    , invoker = require('ramda/src/invoker') 
;
const h = require('snabbdom/h');

const uploadList = require('./list');
const uploader   = require('./uploader');


// action

const listUpdate = (listAction,model) => {
  const [state, tasks] = uploadList.update(listAction);
  return [ evolve({uploads: state},model), 
           tasks.map( map(Action.Route) ) 
         ];
}

const Action = Type({
  Create: [Function,Array],
  Route:  [uploadList.Action]
});

const update = Action.caseOn({
  Create: (up,files,model) => {
    return listUpdate( uploadList.Action.Create(up,files), model );
  },

  Route: listUpdate
});


// model

const init = () = { uploads: uploadList.init() }

// view

const view = curry( ({url, headers, action$}, model) => {
  
  const up = uploader.upload(headers, url);

  const form = (
    h('form', {on: {submit: preventDefault} }, [
       h('input', 
         { attr: {'type': 'file'},
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

