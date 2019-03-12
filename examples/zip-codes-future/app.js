const R = require('ramda')
const Type = require('union-type')
const h = require('snabbdom/h').default
const Future = require('ramda-fantasy/src/Future')
const treis = require('treis')


// Utils

const c = R.compose // tiny alias to make the code leaner and more readable
const promToFut = (prom) => Future((rej, res) => prom.then(res, rej))
const getJSON = R.invoker(0, 'json')
const targetValue = R.path(['target', 'value'])
const getUrl = (url) => promToFut(fetch(new Request(url, {method: 'GET'})))
const respIsOk = (r) => r.ok === true

// Model

const USState = Type({
  Loading: [],
  Names: [Array],
  NotFound: [],
  Invalid: [],
})

const init = () => ({
  zipCode: '',
  state: USState.Invalid(),
})

// Update

const Action = Type({
  ChangeZipCode: [String],
  ChangeState: [USState],
})

const fetchZip = (zipCode) => getUrl(`http://api.zippopotam.us/us/${zipCode}`)

const formatPlace = c(R.join(', '), R.props(['place name', 'state']))
const places = c(R.map(formatPlace), R.prop('places'))
const isZip = c(R.not, R.isEmpty, R.match(/^\d{5}$/))
const createChangeStateAction = c(Action.ChangeState, USState.Names, places)

const updateStateFromResp = c(R.map(createChangeStateAction), promToFut, getJSON)
const updateStateToNotFound = c(Future.of, Action.ChangeState, USState.NotFound)
const lookupZipCode = c(R.chain(R.ifElse(respIsOk, updateStateFromResp, updateStateToNotFound)), fetchZip)

const zipLens = R.lensProp('zipCode')
const stateLens = R.lensProp('state')

const update = Action.caseOn({
  ChangeZipCode: (newZip, model) => {
    const validZip = isZip(newZip)
    const newState = validZip ? USState.Loading() : USState.Invalid()
    const newModel = c(R.set(zipLens, newZip), R.set(stateLens, newState))(model)
    return [newModel, validZip ? [lookupZipCode(newZip)] : []]
  },
  ChangeState: c(R.prepend(R.__, [[]]), R.set(stateLens))
})

// View

const view = (actions, model) => {
  const field = h('input', {
    props: {placeholder: 'Zip Code', value: model.zipCode},
    on: {input: c(actions, Action.ChangeZipCode, targetValue)}
  })
  const messages = USState.case({
    Invalid: () => [h('div', 'Please type a valid US zip code!')],
    Loading: () => [h('div', 'Loading ...')],
    NotFound: () => [h('div', 'Not found :(')],
    Names: R.map(R.partial(h, ['div'])),
  }, model.state);
  return h('div', R.prepend(field, messages));
}

module.exports = {init, Action, update, view}
