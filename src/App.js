import React, { useState, useEffect, useRef } from 'react'
import ReactTags from '../src/react-tags/lib/ReactTags'
import { parse } from 'mathjs'
import './App.css'

const OPERATIONS = [
  { id: 1, name: '(', autocomplete: true },
  { id: 2, name: ')', autocomplete: true },
  { id: 3, name: '+', autocomplete: true },
  { id: 4, name: '-', autocomplete: true },
  { id: 5, name: '*', autocomplete: true },
  { id: 6, name: '/', autocomplete: true },
  { id: 7, name: '^', autocomplete: true },
  { id: 8, name: 'sqrt(' }
]

const AUTOCOMPLETION = OPERATIONS.filter(operation => operation.autocomplete)

const App = () => {
  const [expression, setExpression] = useState([])
  const [result, setResult] = useState({ error: null, value: null })
  const [dynamicVariables, setDynamicVariables] = useState([])
  const [dvInput, setDvInput] = useState({ name: '', value: '' })
  const expressionInput = useRef()

  useEffect(() => {
    const result = expression.map(item => item.defaultValue || item.name)
    try {
      const node = parse(result.join(''))
      const code = node.compile()
      setResult({ value: code.evaluate(), error: null })
    } catch (err) {
      setResult({ value: null, error: err.message })
    }
  }, [expression])

  const testInput = value => RegExp(/^[+-]?\d+(\.\d+)?$/).test(value)

  const onDelete = (i) => {
    const newExpression = expression.slice(0)
    newExpression.splice(i, 1)
    setExpression(newExpression)
  }

  const onAddition = (tag, inputPosition) => {
    const value = tag.name.trim()

    if (tag.id || testInput(value)) {
      if (inputPosition > -1) {
        expression.splice(inputPosition, 1, { ...tag, name: value })
        setExpression([...expression])
      } else {
        setExpression([...expression, { ...tag, name: value }])
      }
    } else {
      setResult({ value: null, error: `"${value}" input is not allowed. Numbers (integers/floats) only.` })
    }
  }

  const onSelectPredefined = (predefinedArray) => (e) => {
    const suggestedValue = predefinedArray.find(item => String(item.id) === String(e.target.value))
    if (suggestedValue) {
      onAddition(suggestedValue)
    }
    expressionInput?.current?.input?.current?.input?.current?.focus()
  }

  const onInput = (inputQuery, inputPosition) => {
    const query = inputQuery.trim()
    const operation = AUTOCOMPLETION.find(item => query.includes(item.name))
    if (operation) {
      const number = query.replace(operation.name, '').trim()
      if (operation.name.length === query.length) {
        setExpression([...expression, operation])
      } else if (testInput(number)) {
        setExpression([...expression, { name: number }, operation])
      } else {
        setResult({ value: null, error: `"${number}" input is not allowed. Numbers (integers/floats) only.` })
      }
      // because this state change should happen after input state were set
      setTimeout(() => {
        expressionInput.current.clearInput()
      }, 0)
    }
  }

  return (
    <div className="App-cont">
      {/*<select*/}
      {/*  value="calculator"*/}
      {/*  name="node_type"*/}
      {/*  onChange={() => {}}*/}
      {/*>*/}
      {/*  <option value="calculator">Calculator</option>*/}
      {/*  <option value="router">Router</option>*/}
      {/*</select>*/}
      <br/>

      <div>
        <p>Add dynamic variable:</p>
        <input value={dvInput.name} type="text" placeholder="name" onChange={(e) => {
          setDvInput((prevState) => ({
            ...prevState,
            name: e.target.value
          }))
        }}/>
        <input value={dvInput.value} type="text" placeholder="value" onChange={(e) => {
          setDvInput((prevState) => ({
            ...prevState,
            value: e.target.value
          }))
        }}/>
        <button onClick={() => {
          setDynamicVariables((prevState) => (
            [...prevState, {id: Date.now(), name: dvInput.name, defaultValue: dvInput.value}]
          ))
          setDvInput({name: '', value: ''})
        }}>Add</button>
      </div>
      <br/>

      <p>Calculator node:</p>
      <div>Add &nbsp;
        <select
          value="default"
          name="operations"
          onChange={onSelectPredefined(OPERATIONS)}
        >
          <option value="default" disabled>Operations</option>
          {
            OPERATIONS.map((item) =>
              <option key={item.id} value={item.id}>{item.name}</option>
            )
          }
        </select>
        {
          dynamicVariables.length !== 0 && (
            <select
              value="default"
              name="variables"
              onChange={onSelectPredefined(dynamicVariables)}
            >
              <option value="default" disabled>Variables</option>
              {
                dynamicVariables.map((item) =>
                  <option key={item.id} value={item.id}>{item.name}</option>
                )
              }
            </select>
          )
        }
      </div>
      <br/>

      <ReactTags
        allowNew
        minQueryLength={1}
        onAddition={onAddition}
        onDelete={onDelete}
        placeholderText="Type an expression"
        ref={expressionInput}
        suggestions={[...OPERATIONS, ...dynamicVariables]}
        tags={expression}
        onInput={onInput}
      />
      <br/>

      <div>
        {
          result.error !== null && <b>Error: </b>
        }
        {
          result.value !== null && <b>Result: </b>
        }
        {result.error || result.value}
      </div>
      <br/>

      <div>
        <b>Expression values:</b> <br/>
        <ul>
          {expression.map((item, index) => <li key={`${item.name + index}`}><code>{JSON.stringify(item)}</code></li>)}
        </ul>
      </div>
    </div>
  )
}

export default App
