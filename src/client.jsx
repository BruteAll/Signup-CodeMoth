import { h, render, Component } from 'preact'
import axios from 'axios'

function SubmittingNotification(props) {
  return (
		<div>
			Submitting form!
		</div>
	)
}

function SubmittedNotification(props) {
  return (
		<div>
			Thanks for signing up!
		</div>
	)
}

function Form(props) {
  return (
		<div>
			<p>[event description]</p>
			<p>Write your email below and click submit to sign up for the event!</p>
			<p>The email will be removed from our database on the day after the event.</p>
			<label>Email:
			<input type="text" id="email-input" 
				onChange={props.emailObserver} />
			<button
				onClick={props.submitHandler}>Submit</button>
			</label>
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
    const emailObserver = e => {
      this.setState({email: e.target.value})
    }

    const submitHandler = () => {
      this.setState({state: this.states.WAITING})

      this.props.post('/', {email: this.state.email}).then(res => {
        this.setState({state: this.states.SUBMITTED})
      })
    }

		let main = <Form emailObserver={emailObserver} submitHandler={submitHandler}/>

    if (this.state.state === this.states.WAITING) {
      main = <SubmittingNotification/>
    } else if (this.state.state === this.states.SUBMITTED) {
      main = <SubmittedNotification/>
    }

		return (
			<div>
				<header>
					<h1>Signup form for [event title]</h1>
					<img src="brainpuzzle.gif"/>
				</header>
				<main>
					{main}
				</main>
			</div>
		)
  }
}

render((
  <App post={axios.post}/>
), document.body)
