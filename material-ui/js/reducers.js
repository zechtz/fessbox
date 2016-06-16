import app      from './reducers/app'
import messages from './reducers/messages'
import mixer    from './reducers/mixer'
import toastr   from './reducers/toastr'
import users    from './reducers/users'

import { combineReducers } 
  from 'redux'
import { modelReducer, formReducer } 
  from 'react-redux-form';

export default combineReducers({
  mixer,
  messages,
  app,
  users,
  toastr,
  sms: modelReducer('sms', { 
    channel : 'auto',
  }),
  smsForm: formReducer('sms'),
  call: modelReducer('call', { 
    channel : 'auto', 
    mode    : 0,
  }),
  callForm: formReducer('call'),
})
