import React, { useState, useEffect } from 'react'
import ReactTags from '../src/react-tags/lib/ReactTags'
import { parse } from 'mathjs'
import './App.css'

const testInput = value => RegExp(/^[+-]?\d+(\.\d+)?$/).test(value)

const MATH_OPERATIONS = [
  { id: 'ac_1', name: '(', autocomplete: true },
  { id: 'ac_2', name: ')', autocomplete: true },
  { id: 'ac_3', name: '+', autocomplete: true },
  { id: 'ac_4', name: '-', autocomplete: true },
  { id: 'ac_5', name: '*', autocomplete: true },
  { id: 'ac_6', name: '/', autocomplete: true },
  { id: 'ac_7', name: '^', autocomplete: true },
  { id: 'ac_8', name: 'sqrt(' }
]

const App = () => {
  const [tags, setTags] = useState([])
  const [execution, setExecution] = useState({ result: null, error: null })
  const [dynamicVariables, setDynamicVariables] = useState([])
  const [dvInput, setDvInput] = useState({ name: '', value: '' })

  useEffect(() => {
    const executionResult = tags.map(item => item.value ?? item.name)
    try {
      const node = parse(executionResult.join(''))
      const code = node.compile()
      setExecution({ result: code.evaluate(), error: null })
    } catch (err) {
      setExecution({ result: null, error: err.message })
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
    setExecution({ result: null, error: `"${value}" input is not allowed. Numbers (integers/floats) only.` })
  }

  return (
    <div className="App-cont">
      <br/>

      <div>
        <p>Add dynamic variable:</p>
        <input
          value={dvInput.name}
          type="text"
          placeholder="name"
          onChange={(e) => {
            setDvInput((prevState) => ({
              ...prevState,
              name: e.target.value
            }))
          }}
        />
        <input
          value={dvInput.value}
          type="text"
          placeholder="default value"
          onChange={(e) => {
            setDvInput((prevState) => ({
              ...prevState,
              value: e.target.value
            }))
          }}/>
        <button onClick={() => {
          setDynamicVariables((prevState) => (
            [...prevState, { id: Date.now(), name: dvInput.name, value: dvInput.value }]
          ))
          setDvInput({ name: '', value: '' })
        }}>
          Add
        </button>
      </div>

      <br/>

      <p>Calculator node:</p>
      <div>Add &nbsp;
        <select
          value="default"
          name="operations"
          onChange={onSelectPredefined(MATH_OPERATIONS)}
        >
          <option value="default" disabled>Operations</option>
          {
            MATH_OPERATIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)
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
        suggestions={[...MATH_OPERATIONS, ...dynamicVariables]}
        tags={tags}
        addTags={setTags}
        validation={testInput}
        onError={onError}
      />
      <br/>

      <div>
        {
          execution.error !== null && <b>Error: </b>
        }
        {
          execution.result !== null && <b>Execution result: </b>
        }
        {execution.error || execution.result}
      </div>
      <br/>

      <div>
        <b>Data to save in DB:</b>
        <code>
          {JSON.stringify(tags.map(tag => {
            if (Number.isInteger(Number(tag.id))) {
              return {id: tag.id}
            } else {
              return tag.name
            }
          }))}
        </code>
      </div>
      <br/>

      <div>
        <b>Raw data:</b> <br/>
        <ul>
          {tags.map((item, index) => <li key={`${item.name + index}`}><code>{JSON.stringify(item)}</code></li>)}
        </ul>
      </div>

    </div>
  )
}

export default App
