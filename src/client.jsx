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
      onChange={props.emailObserver}/>
    <button
      onClick={props.submitHandler}
      disabled={props.submitting}>Submit</button>
    </label>
  )
}

function Form(props) {

  return (
		<div>
			<p>This is a signup form for the Code Moth lecture on 29th of November, 18:00-20:00. Read here for more info if you haven't already: <a href="https://digidemlab.org/hackerspace/#/lectures">https://digidemlab.org/hackerspace/#/lectures</a></p>
			<p>Write your email below and click submit to sign up for the event!</p>
      <p>We will only use the email to see how many are signed up, and to send you information about the event.</p>
      <p>After the event the email will be removed from our database.</p>
      <EmailInput 
        emailObserver={props.emailObserver}
        submitHandler={props.submitHandler}
        submitted={props.submitted}
        submitting={props.submitting}/>
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
      submitting: false,
      submitted: false
    }
  }

  render() {

    const submitHandler = () => {
      this.setState({
        feedback: "Submitting...",
        submitting: true
      })

      this.props.post('/', {email: this.state.email}).then(res => {
        this.setState({
          feedback: "Thank you for signing up!",
          submitted: true
        })
      }).catch(err => {
        this.setState({
          feedback: err.response.data,
          submitted: false,
          submitting: false
        })
      })
    }

    const emailObserver = e => {
      this.setState({email: e.target.value})
    }

		return (
			<div>
				<header>
					<h1>Signup form for:</h1>
          <h1>Why should I learn programming?</h1>
					<img src="focused_radu_and_seb.png"/>
				</header>
				<main>
          <Form 
            submitHandler={submitHandler}
            emailObserver={emailObserver}
            feedback={this.state.feedback}
            submitted={this.state.submitted}
            submitting={this.state.submitting}/>
				</main>
			</div>
		)
  }
}

render((
  <App post={axios.post}/>
), document.body)
