/* eslint no-unused-vars: 0 */

import React from 'react'
import ReactDOM from 'react-dom'
import TreeView from 'react-treeview'
import qs from 'query-string'

class View extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false,
      children: props.children
    }
  }

  handleClick () {
    this.setState({
      open: !this.state.open
    })

    if (typeof this.state.children === 'undefined') {
      fetchKeysAtPath(this.props.path)
        .then(rows => {
          this.setState({
            children: rows
          })
        })
    }

    if (typeof this.state.value === 'undefined') {
      fetchValueAtPath(this.props.path)
        .then(val => {
          this.setState({
            value: val
          })
        })
    }
  }

  render () {
    let key = this.props.lastKey

    let label = (
      <span className='node' onClick={this.handleClick.bind(this)}>
        {key}
      </span>
    )

    let value = this.state.value ? [(
      <span className='tree-value' key='_val'>
        {this.state.value}
      </span>
    )] : []

    return (
      <div>
        <TreeView
          key={key}
          nodeLabel={label}
          collapsed={!this.state.open}
          onClick={this.handleClick.bind(this)}
        >
          {
            value.concat(
              this.state.children
                ? this.state.children.map(child =>
                  <View
                    path={this.props.path + '/' + child.key.replace(/ /g, '+')}
                    lastKey={child.key}
                    key={child.key}
                  />
                )
                : null
            )
          }
        </TreeView>
      </div>
    )
  }
}

function fetchKeysAtPath (path) {
  return window.fetch(summa + path + '/_all_docs')
    .then(res => res.json())
    .then(body => {
      if (body.rows) return body.rows
      else throw body
    })
    .catch(err => console.log('failed to fetch keys at ' + path, err) || [])
}

function fetchValueAtPath (path) {
  return window.fetch(summa + path + '/_val')
    .then(res => res.json())
    .then(val => {
      if (typeof val === 'object') throw val
      else return val
    })
    .catch(err => console.log('failed to fetch value at ' + path, err) || null)
}

function handleArgs () {
  const args = qs.parse(window.location.search)

  var summa = args.summa || args.host
  if (!summa) {
    summa = 'https://summadb-temp.herokuapp.com'
    document.getElementById('target').innerHTML = 'append <code>?summa=your-db-url</code> to the URL of this page to inspect any SummaDB instance.<br>'
  } else {
    if (summa[summa.length - 1] === '/') {
      summa = summa.slice(0, -1)
    }
    if (summa.slice(0, 4) !== 'http') {
      summa = window.location.protocol + '//' + summa
    }
  }
  document.getElementById('target').innerHTML += `browsing <code>${summa}</code>.`

  return {summa}
}

const {summa} = handleArgs()
fetchKeysAtPath('')
  .then(rows =>
    ReactDOM.render(<View path='' lastKey='~' children={rows} />, document.getElementById('main'))
  )
