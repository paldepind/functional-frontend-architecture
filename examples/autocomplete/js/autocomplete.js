
import curry from 'ramda/src/curry'
import compose from 'ramda/src/compose'
import map from 'ramda/src/map'
import always from 'ramda/src/always'
import T from 'ramda/src/T'
import F from 'ramda/src/F'
import assoc from 'ramda/src/assoc'
import merge from 'ramda/src/merge'
import lensProp from 'ramda/src/lensProp'
import get from 'ramda/src/view'

import Type from 'union-type'
import Future from 'ramda-fantasy/src/Future'
import Maybe from 'ramda-fantasy/src/Maybe'
import forwardTo from 'flyd-forwardto'

import h from 'snabbdom/h'

const noop = function(){};
const noFx = (s) => [s, []];

const isMaybe = (val) => Maybe.isNothing(val) || Maybe.isJust(val)
const maybeEmpty = (val) => val.length === 0 ? Maybe.Nothing() : Maybe(val)

const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}


export default function autocomplete(menu){

  // model

  const init = (value=null) => ({
    menu: menu.init(),
    isEditing: false,
    value: Maybe(value)
  });

  const showMenu = (model) => model.isEditing && model.menu.items.length > 0;

  const selectedOrInputValue = (model) => (
    model.menu.selectedValue.getOrElse(model.value.getOrElse('')) 
  );

  // update

  const Action = Type({
    Input: [Function, isMaybe],
    RefreshMenu: [Array],
    ClearMenu: [],
    UpdateMenu: [menu.Action],
    ShowMenu: [],
    HideMenu: []
  })

  const update = Action.caseOn({
    
    Input: (query, str, model) => {
      const tasks = [ query(str,model) ]; 
      return [
        assoc('isEditing', true, assoc('value', str, model)) ,
        tasks
      ];
    },

    RefreshMenu: (items, model) => (
      update( Action.UpdateMenu( menu.Action.Refresh(items) ), model )
    ),

    ClearMenu: (model) => (
      update( Action.UpdateMenu( menu.Action.Clear() ), model )
    ),

    UpdateMenu: (action, model) => (
      noFx( assoc('menu', menu.update(action, model.menu), model) )
    ),

    ShowMenu: compose(noFx, assoc('isEditing', true)),

    HideMenu: compose(noFx, assoc('isEditing', false))

  });


  // view

  const view = curry( ({query, action$}, model) => {

    const menuAction$ = forwardTo(action$, Action.UpdateMenu)
    const input = inputView(action$, menuAction$, query, model);
    const menudiv = menuView(menu.view({action$: menuAction$}), 
                             style.menu, 
                             model.menu);

    return h('div.autocomplete', showMenu(model) ? [input, menudiv] : [input] );

  });

  const inputView = (action$, menuAction$, query, model) => {
    
    const handleEsc   = compose( action$, always(Action.HideMenu()) );
    const handleEnter = handleEsc;
    const handleDown  = compose( menuAction$, always(menu.Action.SelectNext()) );
    const handleUp    = compose( menuAction$, always(menu.Action.SelectPrev()) );

    return (
      h('input', {
        on: {
          input: compose(action$, Action.Input(query), maybeEmpty, get(valueLens)),
          keydown: !model.isEditing ? noop 
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
  }

  const menuView = (mview, style, model) => (
    h('div.menu', {
        style: style,
        hook: { insert: positionUnder('input'), 
                postpatch: repositionUnder('input') 
        } 
      }, 
      [ mview(model) ]
    )
  );

  // styles

  const style = {
    menu: {
      position: 'absolute',
      'z-index': '100',
      opacity: '1', 
      transition: 'opacity 0.2s', 
      remove: { opacity: '0' }
    }
  };

  return {init, update, Action, view};
}



// hooks

const positionUnder = curry( (selector, vnode) => {
  let elm = vnode.elm,
      targetElm = elm.parentNode.querySelector(selector);
  if (!(elm && targetElm)) return;
  const rect = targetElm.getBoundingClientRect();
  elm.style.top = "" + (rect.top + rect.height + 1) + "px";
  elm.style.left = "" + rect.left + "px";
  return;
});

const repositionUnder = curry( (selector, oldVNode, vnode) => (
  positionUnder(selector,vnode)
));
  


// move to helpers

const valueLens = compose( lensProp('target'), lensProp('value') );

const caseKey = curry( (handlers,e) => {
  const k = e.key || e.keyCode;
  const mapHandlers = handlers.reduce((o,handler) => {
            for (let i=0;i<handler[0].length;++i) 
              o[handler[0][i]] = handler[1];
            return o;
          }, {});
  return hasOwnProperty.call(mapHandlers,k) ? mapHandlers[k](e) : noop() ;
});

