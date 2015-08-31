
import curry from 'ramda/src/curry'
import assoc from 'ramda/src/assoc'
import merge from 'ramda/src/merge'
import map from 'ramda/src/map'
import toString from 'ramda/src/toString'

import Type from 'union-type'

const identity = (x) => x

export default function menu(itemComponent,valueAccessor){
    
  // model

  // TODO: use a Maybe for selected/selectedValue

  const init = (items=[]) => {
    return {
      selected: null,
      selectedValue: null,
      items: map(itemComponent.init, items)
    };
  }

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
    Refresh: [Array]
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

    Refresh: init
  });


  // view

  const initStyle = () => { return {li: {}, ul: {}}; }
  const fixedStyle = {
    ul: { 'list-style': 'none' },
    li: { 'cursor': 'pointer' }
  };

  const view = curry( ({style=initStyle(), action$}, model) => {
    style.ul = merge(style.ul || {}, fixedStyle.ul);
    style.li = merge(style.li || {}, fixedStyle.li);

    const li = (item,i) => {
      const itemview = itemComponent.view(item);
      return (
        h('li', { class: {selected: model.selected === i},
                  style: style.li,
                  on: { click: [action$, Action.Select(i)] }
                }, 
                typeof itemview == 'string' ? itemview : [itemview]
        )
      );
    }

    return (
      h('ul', {style: style.ul}, model.items.map(li))
    );
  });

  return { init, update, Action, view };

}

