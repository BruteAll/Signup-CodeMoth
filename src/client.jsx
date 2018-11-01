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

function Feedback(props) {
  if (props.message) {
    return (
      <div class="feedback">
        {props.message}
      </div>
    )
  }

  return
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
      <Feedback message={props.feedback}/>
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
      email: '',
      feedback: ''
    }
  }

  render() {
    const emailObserver = e => {
      this.setState({email: e.target.value})
    }

    const submitHandler = () => {
      this.setState({
        feedback: "Submitting..."
      })

      this.props.post('/', {email: this.state.email}).then(res => {
        this.setState({
          feedback: "Thank you for signing up!"
        })
      }).catch(err => { 
        this.setState({
          state: this.states.FILLING,
          feedback: err.response.data
        })
      })
    }

		return (
			<div>
				<header>
					<h1>Signup form for [event title]</h1>
					<img src="brainpuzzle.gif"/>
				</header>
				<main>
          <Form emailObserver={emailObserver} submitHandler={submitHandler} feedback={this.state.feedback}/>
				</main>
			</div>
		)
  }
}

render((
  <App post={axios.post}/>
), document.body)
