
import curry from 'ramda/src/curry'
import compose from 'ramda/src/compose'
import map from 'ramda/src/map'
import always from 'ramda/src/always'
import T from 'ramda/src/T'
import F from 'ramda/src/F'
import assoc from 'ramda/src/assoc'
import lensProp from 'ramda/src/lensProp'
import get from 'ramda/src/view'

import Type from 'union-type'
import Future from 'ramda-fantasy/src/Future'
import forwardTo from 'flyd-forwardto'

const noop = function(){};

const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}


export default function autocomplete(menu){

  // model

  const init = (value=null) => {
    return {
      menu: menu.init(),
      menuVisible: false,
      value: value
    }
  }

  const selectedOrInputValue = (model) => {
    return (model.menu.selectedValue === null) ? model.value 
                                               : model.menu.selectedValue;
  }

  // update

  const noFx = (s) => [s, []];

  const Action = Type({
    Input: [Function, String],
    UpdateMenu: [menu.Action],
    ShowMenu: [],
    HideMenu: []
  })

  const refreshMenu = compose(Action.UpdateMenu, menu.Action.Refresh);
  const clearMenu   = compose(Action.UpdateMenu, menu.Action.Clear);
  
  const update = Action.caseOn({
    
    Input: (query, str, model) => {
      const tasks = [ query(str,model).bimap( throwOr(clearMenu), refreshMenu ) ]; 
      return [
        assoc('menuVisible', true, assoc('value', str, model)) ,
        tasks
      ];
    },

    UpdateMenu: (action, model) => {
      return noFx( assoc('menu', menu.update(action, model.menu), model) )
    },

    ShowMenu: compose(noFx, assoc('menuVisible', true)),

    HideMenu: compose(noFx, assoc('menuVisible', false))

  });


  // view

  const valueLens = compose( lensProp('target'), lensProp('value') );

  const view = curry( ({query, guard=T, action$}, model) => {

    const menuAction$ = forwardTo(action$, Action.UpdateMenu)
    const menuView = menu.view({ action$: menuAction$ }); 

    const handleEsc   = compose( action$, always(Action.HideMenu()) );
    const handleEnter = handleEsc;
    const handleDown  = compose( menuAction$, always(menu.Action.SelectNext()) );
    const handleUp    = compose( menuAction$, always(menu.Action.SelectPrev()) );

    const input = (
      h('input', {
        on: {
          input: compose(action$, Action.Input(query,guard), get(valueLens)),
          keydown: !model.menuVisible ? noop 
                     : caseKey([
                         [['Esc','Escape', 0x1B],    handleEsc],
                         [['Enter', 0x0A, 0x0D],     handleEnter],
                         [['Down','DownArrow',0x28], handleDown],
                         [['Up','UpArrow',0x26],     handleUp]
                       ]),
          blur: [action$, Action.HideMenu()]
        },
        props: { type: 'text', 
                 value: selectedOrInputValue(model) 
               }
      })
    );

    return (
      h('div.autocomplete', 
        model.menuVisible ? [input]
                          : [input, menuView(model.menu)]
      )
    );

  });

  return {init, update, Action, view};
}


// move to helpers?
const caseKey = curry( (handlers,e) => {
  const k = e.key || e.keyCode;
  mapHandlers = handlers.reduce((o,handler) => {
                  for (let i=0;i<handler[0].length;++i) 
                    o[handler[0][i]] = handler[1];
                  return o;
                }, {});
  return hasOwnProperty.call(mapHandlers,k) ? mapHandlers[k](e) : noop() ;
});

