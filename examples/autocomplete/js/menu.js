
import curry from 'ramda/src/curry'
import assoc from 'ramda/src/assoc'
import merge from 'ramda/src/merge'
import map from 'ramda/src/map'
import toString from 'ramda/src/toString'

import Type from 'union-type'

import h from 'snabbdom/h'

const identity = (x) => x

export default function menu(itemComponent,valueAccessor){
    
  // model

  // TODO: use a Maybe for selected/selectedValue

  const init = (items=[]) => ({
    selected: null,
    selectedValue: null,
    items: map(itemComponent.init, items)
  });

  const nextIndex = (model) => {
    const i = model.selected
        , n = model.items.length;
    return i === null ? (n === 0 ? null : 0) : ((i + 1) % n) ;
  }

  const prevIndex = (model) => {
    const i = model.selected
        , n = model.items.length;
    return i === null ? (n === 0 ? null : n-1) : ((n + (i-1)) % n) ;
  }

  // update

  const Action = Type({
    Select: [Number],
    SelectNext: [],
    SelectPrev: [],
    Refresh: [Array],
    Clear: [String]
  });

  const update = Action.caseOn({
    
    Select: (i,model) => {
      const it = model.items[i];
      const v = (it === undefined) ? null : valueAccessor(it) ;
      return assoc('selectedValue', v, assoc('selected', i, model));
    },

    SelectNext: (model) => {
      const i = nextIndex(model);
      if (i === null) return model;
      return update( Action.Select(i,model), model );
    },

    SelectPrev: (model) => {
      const i = prevIndex(model);
      if (i === null) return model;
      return update( Action.Select(i,model), model );
    },

    Refresh: init,

    Clear: (_,model) => init([])

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
    const itemview = itemComponent.view(item);
    return (
      h('li', { class: {selected: model.selected === i},
                style: style,
                on: { click: [action$, Action.Select(i)] }
              }, 
              typeof itemview == 'string' ? itemview : [itemview]
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

