const Type = require('union-type');
const T = require('ramda/src/T')
    , adjust = require('ramda/src/adjust')
    , append = require('ramda/src/append')
    , curry  = require('ramda/src/curry')
;
const h = require('snabbdom/h');

const upload = require('./upload');
const uploader = require('./uploader');

const noFx = (s) => [s, []];

// note: prefer to check if iterable, 
// but FileList.prototype doesn't seem to have Symbol.iterator cross-browser?
const isFileList = (x) => x.length !== undefined

// action

const Action = Type({
  Create:      [Function, isFileList],
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
    return noFx(
      uploader.Result.case({
        OK:       finish('Uploaded'),
        NotFound: finish('Error'),
        Error:    finish('Error'),
        Abort:    finish('Abort'), 
        Progress: (abort,p) => {
          return adjust(upload.update(upload.Action.Progress(abort,p)), i, model);
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

  return (
    h('ul', {style: style.ul}, model.map( listItemView ) )
  );

};

const listItemView = (item, i) => {
  return (
    h('li', {style: style.li}, [
      upload.view(
        { progress: { height: 20, width: 200 } },
        item
      )   
    ])
  );
}


const style = {
  ul: {'list-style': 'none'},
  li: { }
}


module.exports = { init, update, Action, view }

