import { h, render, Component } from 'preact'
import axios from 'axios'

function SubmittingNotification(props) {
  return <div>Submitting form!</div>
}

function SubmittedNotification(props) {
  return <div>Submitted form!</div>
}

function Form(props) {
  return (
    <div>
      <label>Email: </label>
      <input type="text" id="email-input" 
        onChange={props.emailObserver} />
      <button
        onClick={props.submitHandler}>Submit</button>
    </div>
  )
}

class App extends Component {
  constructor(props) {
    super(props)

    this.states = {
      FILLING: 0,
      WAITING: 1,
      SUBMITTED: 2
    }

    this.state = {
      state: this.states.FILLING,
      email: ''
    }
  }

  render() {
    if (this.state.state === this.states.WAITING) {
      return <SubmittingNotification/>
    } else if (this.state.state === this.states.SUBMITTED) {
      return <SubmittedNotification/>
    }

    const emailObserver = e => {
      this.setState({email: e.target.value})
    }

    const submitHandler = () => {
      this.setState({state: this.states.WAITING})

      this.props.post('/', {email: this.state.email}).then(res => {
        this.setState({state: this.states.SUBMITTED})
      })
    }

    return <Form emailObserver={emailObserver} submitHandler={submitHandler}/>
  }
}

render((
  <App post={axios.post}/>
), document.body)
