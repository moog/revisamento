import { assoc, pluck, without } from 'ramda'
import React, { Component } from 'react';
import axios from 'axios'
import { map } from 'ramda'

import './App.css';

const { remote, ipcRenderer, shell } = window.require('electron');

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentNumbers: [],
      pulls: [],
    }

    this.renderPull = this.renderPull.bind(this)
    this.getPulls = this.getPulls.bind(this)
    this.handleClick= this.handleClick.bind(this)
  }

  componentWillMount () {
    this.getPulls()
    setInterval(this.getPulls, remote.process.env.GITHUB_NOTIFIER_INTERVAL)
  }

  getPulls () {
    const user = remote.process.env.GITHUB_NOTIFIER_USERNAME
    const repo = remote.process.env.GITHUB_NOTIFIER_REPO
    const search = `q=type:pr+repo:${repo}+is:open+review-requested:${user}`

    axios.get(
      `https://api.github.com/search/issues?${search}`,
      {
        params: {
          access_token: remote.process.env.GITHUB_NOTIFIER_ACCESS_TOKEN,
        },
      }
    )
      .then(({ data }) => {
        const { currentNumbers } = this.state
        const updatedNumbers = pluck('number', data.items)
        const newNumbers = without(currentNumbers, updatedNumbers)

        if (newNumbers.length > 0) {
          const assocPulls = assoc('pulls', data.items, this.state)
          const newState = assoc('currentNumbers', updatedNumbers, assocPulls)
          this.setState(newState)

          ipcRenderer.send('notificate', { updatedNumbers, newNumbers })

          this.forceUpdate()
        }
      })
      .catch((error) => {
        console.log(error.message)
      })
  }

  handleClick (e, url) {
    e.preventDefault()
    shell.openExternal(url)
  }

  renderPull (pull) {
    return (
      <p>
        <a href="#" onClick={ e => this.handleClick(e, pull.html_url) }>
          <img src={ pull.user.avatar_url } width="30" /> #{ pull.number } { pull.title }
        </a>
      </p>
    )
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Revisamento</h1>
        </header>
        <div id="pulls">
          { map(this.renderPull, this.state.pulls) }
        </div>
      </div>
    );
  }
}

export default App;
