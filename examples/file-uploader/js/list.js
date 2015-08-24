const Type = require('union-type');
const T = require('ramda/src/T')
    , adjust = require('ramda/src/adjust')
    , append = require('ramda/src/append')
    , curry  = require('ramda/src/curry')
;
const h = require('snabbdom/h');

const upload = require('./upload');
const uploader = require('./uploader');

const sync = (s) => [s, []];

// action

const Action = Type({
  Create:      [Function, Array],
  Result:      [Number, uploader.Result]
});

const update = Action.caseOn({

  Create: (up,files,model) => {
    const idx = nextIndex(model);
    const task = up(files);
    const taskAction = Action.Result(idx);
    const newState = append( upload.init(files), model);
    return [newState, [task.map(taskAction)]];
  },
  
  Result: (i,result,model) => {
    const finish = (type) => () => {
      return adjust(upload.update(upload.Action[type]()), i, model);
    };
    return sync(
      uploader.Result.case({
        OK:       finish('Uploaded'),
        NotFound: finish('Error'),
        Error:    finish('Error'),
        Abort:    finish('Abort'), 
        Progress: (p,abort) => {
          return adjust(upload.update(upload.Action.Progress(p,abort)), i, model);
        }
      }, result)
    );
  }

});


// model

const init = () => []
const nextIndex = (model) => model.length;

// view

const view = (model) => {

  const listItemView = (item, i) => {
    const view = upload.view(
                   { progress: { height: 20, weight: 200 } },
                   item
                 );
    return h('li', {}, view);
  }

  return (
    h('ul', {}, model.map( listItemView ) )
  );

};


module.exports = { init, update, Action, view }

