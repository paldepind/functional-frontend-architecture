
import curry from 'ramda/src/curry'
import assoc from 'ramda/src/assoc'
import merge from 'ramda/src/merge'
import map from 'ramda/src/map'
import toString from 'ramda/src/toString'

import Type from 'union-type'
import Maybe from 'ramda-fantasy/src/Maybe'
import h from 'snabbdom/h'

import isMaybe from './helpers/ismaybe'

const identity = (x) => x

export default function menu(itemComponent,valueAccessor){
    
  // model

  const init = (items=[]) => ({
    selected: Maybe.Nothing(),
    selectedValue: Maybe.Nothing(),
    items: map(itemComponent.init, items)
  });

  const nextIndex = (model) => {
    const idx = model.selected
        , n = model.items.length;
    return idx.isNothing() ? (n === 0 ? Maybe.Nothing() : Maybe.Just(0)) 
                           : map((i) => ((i + 1) % n), idx) ;
  }

  const prevIndex = (model) => {
    const idx = model.selected
        , n = model.items.length;
    return idx.isNothing() ? (n === 0 ? Maybe.Nothing() : Maybe.Just(n-1))
                           : map((i) => ((n + (i-1)) % n), idx) ;
  }

  // update

  const Action = Type({
    Select: [isMaybe],
    SelectNext: [],
    SelectPrev: [],
    Refresh: [Array],
    Clear: []
  });

  
  const update = Action.caseOn({
    
    Select: (idx,model) => {
      const val = map((i) => valueAccessor(model.items[i]), idx);
      return assoc('selectedValue', val, assoc('selected', idx, model));
    },

    SelectNext: (model) => {
      const idx = nextIndex(model);
      return update( Action.Select(idx,model), model );
    },

    SelectPrev: (model) => {
      const idx = prevIndex(model);
      return update( Action.Select(idx,model), model );
    },

    Refresh: init,

    Clear: (_) => init([])

  });


  // view

  const view = curry( ({style=initStyle(), action$}, model) => {
    style.ul = merge(style.ul || {}, fixedStyle.ul);
    style.li = merge(style.li || {}, fixedStyle.li);

    return (
      h('ul', 
        {style: style.ul}, 
        model.items.map( itemView(action$, style.li, model) )
      )
    );
  });

  const itemView = curry( (action$, style, model, item, i) => {
    const subview = itemComponent.view(item);
    return (
      h('li', { class: {selected: model.selected.equals(Maybe(i))},
                style: style,
                on: { click: [action$, Action.Select(Maybe(i))] }
              }, 
              typeof subview == 'string' ? subview : [subview]
      )
    );
  });

  // styles

  const initStyle = () => { return {li: {}, ul: {}}; }
  const fixedStyle = {
    ul: { 
      'list-style': 'none',
      'padding': '0',
      'margin-top': '0',
      'margin-bottom': '0'
    },
    li: { 
      'cursor': 'pointer',
    }
  };


  return { init, update, Action, view };

}

