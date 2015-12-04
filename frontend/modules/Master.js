import React  from 'react'
import Slider from './Slider'

import { updateMasterLevel }
  from '../js/actions'

class Master extends React.Component {
  constructor(props) {
    super(props)
  }
  toggleMuted() {
    const { muted, sendMessage } = this.props
    sendMessage('masterMuted', !muted)
  }
  updateLevel(event) {
    const { dispatch, sendMessage } = this.props
    const value = event.target ? event.target.value : event
    sendMessage('masterVolume', value)
    dispatch(updateMasterLevel(value))
  }
  render() {
    const { level, muted } = this.props
    return (
      <div>
        <div style={{textAlign: 'center', marginTop: '20px'}}> 
          <Slider 
            orientation  = 'vertical'
            reversed     = {true}
            min          = {1}
            max          = {100}
            defaultValue = {level}
            value        = {level}
            enabled      = {!muted}
            onChange     = {(from, to) => {this.updateLevel(to)}} />
        </div>
        <div style={{textAlign: 'center', margin: '12px 0'}}> 
          <button onClick={this.toggleMuted.bind(this)}>
            <i className={muted ? 'glyphicon glyphicon-volume-off' : 'glyphicon glyphicon-volume-up'} />
          </button>
        </div>
        <div style={{textAlign: 'center'}}> 
          Master
        </div>
      </div>
    )
  }
}

export default Master
