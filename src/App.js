import React, { useState, useEffect, useRef } from 'react'
import ReactTags from '../src/react-tags/lib/ReactTags'
import { parse } from 'mathjs'
import './App.css'

const testInput = value => RegExp(/^[+-]?\d+(\.\d+)?$/).test(value)

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

const App = () => {
  const [tags, setTags] = useState([])
  const [result, setResult] = useState({ error: null, value: null })
  const [dynamicVariables, setDynamicVariables] = useState([])
  const [dvInput, setDvInput] = useState({ name: '', value: '' })

  useEffect(() => {
    const result = tags.map(item => item.defaultValue || item.name)
    try {
      const node = parse(result.join(''))
      const code = node.compile()
      setResult({ value: code.evaluate(), error: null })
    } catch (err) {
      setResult({ value: null, error: err.message })
    }
  }, [tags])

  const onSelectPredefined = (predefinedArray) => (e) => {
    const suggestedValue = predefinedArray.find(item => String(item.id) === String(e.target.value))
    if (suggestedValue) {
      const value = suggestedValue.name.trim()
      if (suggestedValue.id || testInput(suggestedValue)) {
        setTags([...tags, { ...suggestedValue, name: value }])
      } else {
        onError(value)
      }
    }
  }

  const onError = (value) => {
    setResult({ value: null, error: `"${value}" input is not allowed. Numbers (integers/floats) only.` })
  }

  return (
    <div className="App-cont">
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
            [...prevState, { id: Date.now(), name: dvInput.name, defaultValue: dvInput.value, type: 'dv' }]
          ))
          setDvInput({ name: '', value: '' })
        }}>Add
        </button>
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
        suggestions={[...OPERATIONS, ...dynamicVariables]}
        tags={tags}
        addTags={setTags}
        validation={testInput}
        onError={onError}
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
          {tags.map((item, index) => <li key={`${item.name + index}`}><code>{JSON.stringify(item)}</code></li>)}
        </ul>
      </div>
    </div>
  )
}

export default App
