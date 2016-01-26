import React                from 'react'
import ReactDOM             from 'react-dom'
import i18next              from 'i18next'
import injectTapEventPlugin from 'react-tap-event-plugin'
import persistState         from 'redux-localstorage'
import app                  from './reducers'
import getQueryVariable     from './url-params'
import ui                   from '../modules/Ui'

import { ReconnectingWebSocket } 
  from 'awesome-websocket'
import { compose, createStore } 
  from 'redux'
import { Provider, connect } 
  from 'react-redux'
import { initializeMixer, initializeUsers, updateUser, removeUser, updateMixer, updateMaster, updateMasterLevel, updateLevel, setTimeDiff, updateCaller, updateInbox, removeMessage }
  from './actions'

const userId   = getQueryVariable('user_id') 
const hostUrl  = getQueryVariable('host_url') || 'fessbox.local:19998' // '192.168.1.38:19998'
const language = getQueryVariable('language') || 'en' 

const ws = new ReconnectingWebSocket(`ws://${hostUrl}/?user_id=${userId}`) 

let store = null

class App extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    const { t } = this.props
    const Ui = connect(state => {
      return {
        mixer  : state.mixer,
        client : state.client,
        users  : state.users,
        inbox  : state.inbox,
      }
    })(ui)
    return (
      <Ui t={t} sendMessage={(type, data) => {
        ws.send(JSON.stringify({ event : type, data }))
      }} />
    )
  }
}

function initApp(data) {

  if (!store) {
    const createPersistentStore = compose(persistState('client', {
      key    : `__fessbox_client_${userId}`,
      slicer : function(paths) {
        return state => {
          const { channels, diff, $ } = state.client
          return { client : { channels, diff, $ } }
        }
      }
    }))(createStore)
    store = createPersistentStore(app, {client: {channels: {}, $: Math.random()*1000000000|0}})
  }
  
  store.dispatch(initializeMixer(data.mixer))
  if (data.users) {
    store.dispatch(initializeUsers(data.users))
  }
  // Compute time difference between server and device
  const diff = Date.now() - data.server_time
  console.log(`diff : ${diff}`)
  store.dispatch(setTimeDiff(diff))
  // Initialize message inbox
  if (data.inbox) {
    data.inbox.ids.slice().reverse().forEach(id => {
      store.dispatch(updateInbox(id, data.inbox.messages[id]))
    })
  }

  injectTapEventPlugin()
  
  i18next.init({
    lng: language,
    resources: {
      se: {
        translation: {
          'Incoming call' : 'Inkommande samtal',
          'Incoming SMS'  : 'Inkommande SMS',
          'Outgoing SMS'  : 'Utgående SMS',
          'Inbox'         : 'Inkorg',
          'Type'          : 'Typ',
          'Time'          : 'Tidpunkt',
          'Sender'        : 'Avsändare',
          'Content'       : 'Innehåll',
          'Free line'     : 'Tillgänglig linje',
          'Host'          : 'Värd',
          'Private'       : 'Privat',
          'Master'        : 'Huvudkanal',
          'On hold'       : 'Parkera',
          'IVR'           : 'Röstbrevlåda',
          'Defunct'       : 'Ur funktion',
          'Edit caller'   : 'Personinformation',
          'Hang up'       : 'Avsluta samtal',
          'Edit caller details' 
                          : 'Uppdatera personinformation',
          'Name'          : 'Namn',
          'Location'      : 'Plats',
          'Save'          : 'Spara',
          'Cancel'        : 'Avbryt',
        }
      }
    }
  }, (err, t) => {
    ReactDOM.render(
      <Provider store={store}>
        <App t={t} />
      </Provider>,
      document.getElementById('main')
    )
  })

}

ws.onopen  = () => { console.log('WebSocket connection established.') } 
ws.onclose = () => { console.log('WebSocket connection closed.') } 

ws.onmessage = e => { 
  if (e.data) {
    const msg = JSON.parse(e.data)
    console.log('>>> Message')
    console.log(msg)
    console.log('<<<')
    if ('initialize' == msg.event) {
      initApp(msg.data)
    } else if (store) {
      switch (msg.event) {
        case 'channelUpdate':
          store.dispatch(updateMixer(msg.data))
          Object.keys(msg.data).forEach(chan => {
            if (!msg.data[chan]) {
              store.dispatch(removeUser(chan)) 
            }
          })
          break
        case 'channelVolumeChange':
          Object.keys(msg.data).forEach(chan => {
            store.dispatch(updateLevel(chan, msg.data[chan])) 
          })
          break
        case 'userUpdate':
          Object.keys(msg.data).forEach(user => {
            //if (msg.data[user]) {
            store.dispatch(updateUser(user, msg.data[user])) 
            //} else {
            //  store.dispatch(removeUser(user)) 
            //}
          })
          break
        case 'masterUpdate':
          store.dispatch(updateMaster(msg.data))
          break
        case 'masterVolumeChange':
          store.dispatch(updateMasterLevel(msg.data))
          break
        case 'channelContactInfo':
          Object.keys(msg.data).forEach(chan => {
            store.dispatch(updateCaller(chan, msg.data[chan]))
          })
          break
        case 'inboxUpdate':
          Object.keys(msg.data).forEach(id => {
            if (msg.data[id]) {
              store.dispatch(updateInbox(id, msg.data[id]))
            } else {
              store.dispatch(removeMessage(id))
            }
          })
          break
        case 'inboxMessages':
          // @TODO
          break
        default:
          break
      }
    }
  }
} 

ws.onerror = e => { 
  /*alert('Connection to server ' + hostUrl + ' failed.')*/
  console.log(e)
}
