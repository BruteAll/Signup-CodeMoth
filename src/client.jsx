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

function EmailInput(props) {
  // Don't show email input if already submitted.
  if (props.submitted === true) return

  return (
    <label>Email:
    <input type="text" id="email-input" 
      onChange={props.emailObserver} />
    <button
      onClick={props.submitHandler}>Submit</button>
    </label>
  )
}

function Form(props) {

  return (
		<div>
			<p>[event description]</p>
			<p>Write your email below and click submit to sign up for the event!</p>
      <p>We will only use the email to see how many are signed up, and to send you information about the event.</p>
      <p>After the event the email will be removed from our database.</p>
      <EmailInput 
        emailObserver={props.emailObserver}
        submitHandler={props.submitHandler}
        submitted={props.submitted}/>
      <Feedback message={props.feedback}/>
		</div>
  )
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      email: '',
      feedback: '',
      submitted: false
    }
  }

  render() {

    const submitHandler = () => {
      this.setState({
        feedback: "Submitting...",
        submitted: true
      })

      this.props.post('/', {email: this.state.email}).then(res => {
        this.setState({
          feedback: "Thank you for signing up!"
        })
      }).catch(err => {
        this.setState({
          feedback: err.response.data,
          submitted: false
        })
      })
    }

    const emailObserver = e => {
      this.setState({email: e.target.value})
    }

		return (
			<div>
				<header>
					<h1>Signup form for [event title]</h1>
					<img src="brainpuzzle.gif"/>
				</header>
				<main>
          <Form 
            submitHandler={submitHandler}
            emailObserver={emailObserver}
            feedback={this.state.feedback}
            submitted={this.state.submitted}/>
				</main>
			</div>
		)
  }
}

render((
  <App post={axios.post}/>
), document.body)
