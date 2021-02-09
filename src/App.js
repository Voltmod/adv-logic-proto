import React, { useState, useEffect, useCallback } from 'react'
import AdvLogicNode from '../src/AdvLogic/lib/ReactTags'
import { create, all } from 'mathjs'
import './App.css'

// Constants and input data
const NODE_TYPE = {
  CALC: 1,
  ROUTE: 2
}
const MATH_OPERATIONS = [
  { id: 'c_1', name: '(', autocomplete: true },
  { id: 'c_2', name: ')', autocomplete: true },
  { id: 'c_3', name: '+', autocomplete: true },
  { id: 'c_4', name: '-', autocomplete: true },
  { id: 'c_5', name: '*', longName: '* (multiplication)', autocomplete: true },
  { id: 'c_6', name: '/', longName: '/ (division)', autocomplete: true },
  { id: 'c_7', name: '^', longName: '^ (power)', autocomplete: true },
  { id: 'c_8', name: 'sqrt(', longName: 'sqrt(x) - square root', autoclose: 1 }
]
const LOGICAL_OPERATORS = [
  { id: 'r_1', name: '>', longName: '> (greater than)' },
  { id: 'r_2', name: '<', longName: '< (less than)' },
  { id: 'r_3', name: '>=', longName: '>= (greater than or equal to)', autocomplete: true },
  { id: 'r_4', name: '<=', longName: '<= (less than or equal to)', autocomplete: true },
  { id: 'r_5', name: '==', longName: '== (is equal)', autocomplete: true },
  { id: 'r_6', name: '!=', longName: '!= (not equal)', autocomplete: true },
  { id: 'r_7', name: 'contains(', longName: 'contains(x, y) - contains y in x', autoclose: 3 },
  { id: 'r_8', name: 'and', longName: 'logical AND' },
  { id: 'r_9', name: 'or', longName: 'logical OR' },
  { id: 'r_10', name: 'not', longName: 'logical NOT' },
]
const SEPARATORS = [
  { id: 's_1', name: ',' }
]
const ALLOWED_OPERATIONS = [...MATH_OPERATIONS, ...LOGICAL_OPERATORS, ...SEPARATORS].reduce((acc, item) => {
  acc.push(item.name)
  return acc
}, [])

// Extends MathJS functionality before launch App
const math = create(all)
const contains = (args, math, scope) => {
  const strings = args.map((arg) => {
    return String(arg.value).trim().toLowerCase()
  })
  return strings[0].includes(strings[1])
}
contains.rawArgs = true
math.import({ contains })

// Main APP
const App = () => {
  const [tags, setTags] = useState([])
  const [possibleOperations, setPossibleOperations] = useState([...MATH_OPERATIONS])
  const [nodeType, setNodeType] = useState(NODE_TYPE.CALC)
  const [execution, setExecution] = useState({ result: null, error: null })
  const [dynamicVariables, setDynamicVariables] = useState([])
  const [dvInput, setDvInput] = useState({ name: '', value: '' })
  const [maxAutoClose, setMaxAutoClose] = useState(0)

  useEffect(() => {
    const executionResult = (tags.map(item => {
      let value = item.value ?? item.name
      return (ALLOWED_OPERATIONS.includes(value) || !Number.isNaN(Number(value))) ? value : `'${value}'`
    })).join(' ')
    try {
      if (nodeType === NODE_TYPE.ROUTE && tags.length === 0) {
        setExecution({ result: true, error: null })
      } else {
        setExecution({ result: math.evaluate(executionResult), error: null })
      }
    } catch (err) {
      setExecution({ result: null, error: err.message })
    }
  }, [nodeType, tags])

  useEffect(() => {
    if (nodeType === NODE_TYPE.CALC) {
      setPossibleOperations([...MATH_OPERATIONS])
    }
    if (nodeType === NODE_TYPE.ROUTE) {
      setPossibleOperations([...MATH_OPERATIONS, ...LOGICAL_OPERATORS])
    }
    setTags([])
  }, [nodeType])

  useEffect(() => {
    const maxAutoCloseValue = possibleOperations.reduce((max, item) => {
      return (item.autoclose && item.autoclose > max) ? item.autoclose : max
    }, 0)
    setMaxAutoClose(maxAutoCloseValue)
  }, [possibleOperations])

  const testInput = useCallback(
    (value) => {
      if (nodeType === NODE_TYPE.CALC) {
        return RegExp(/^[+-]?\d+(\.\d+)?$/).test(value)
      }
      return true
    },
    [nodeType]
  )

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

  const changeNodeType = (e) => {
    setNodeType(Number(e.target.value))
  }

  const onError = (value) => {
    setExecution({ result: null, error: `"${value}" input is not allowed. Numbers (integers/floats) only.` })
  }

  const handleSetTags = newTags => {
    if (newTags.length > tags.length) {
      const autoCloseOffset = newTags.length > maxAutoClose ? maxAutoClose : newTags.length
      for (let offset = 0; offset <= autoCloseOffset; offset++) {
        const itemAutoClose = newTags[newTags.length - 1 - offset]?.autoclose
        if (itemAutoClose === offset) {
          setTags([...newTags, { id: 'c_2', name: ')', autocomplete: true }])
          break
        } else {
          setTags([...newTags])
        }
      }
    } else {
      setTags([...newTags])
    }
  }

  return (
    <div className="App-cont">
      <br/>

      <div>Select node type: &nbsp;
        <select
          value={nodeType}
          name="node_type"
          onChange={changeNodeType}
        >
          <option value={NODE_TYPE.CALC}>Advanced Calculator</option>
          <option value={NODE_TYPE.ROUTE}>Advanced Router</option>
        </select>

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
            // {type: 1, id: Number} - dynamic variable
            // {type: 2, id: Number} - label
            // {type: 10} - lead name
            // {type: 11} - lead email
            // {type: 12} - lead phone
            // {type: 13} - lead company
            // {type: 14} - lead location
            [...prevState, { id: Date.now(), name: dvInput.name, value: dvInput.value, type: 1 }]
          ))
          setDvInput({ name: '', value: '' })
        }}>
          Add
        </button>
      </div>

      <br/>

      <div>Add &nbsp;
        <select
          value="default"
          name="operations"
          onChange={onSelectPredefined(possibleOperations)}
        >
          <option value="default" disabled>Operations</option>
          {
            possibleOperations.map((item) => <option key={item.id} value={item.id}>{item.longName || item.name}</option>)
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

      <AdvLogicNode
        allowNew
        minQueryLength={1}
        suggestions={[...possibleOperations, ...dynamicVariables]}
        tags={tags}
        addTags={handleSetTags}
        validation={testInput}
        onError={onError}
      />
      <br/>

      <div>
        <b>Result: </b>
        {String(nodeType === NODE_TYPE.ROUTE ? !!execution.result : execution.result)}
        <br/><br/>
        <b>Error: </b>
        {String(execution.error)}
      </div>
      <br/>

      <div>
        <b>Data to save in DB:</b>
        <code>
          {JSON.stringify(tags.map(({ id, type, name }) => {
            if (Number.isInteger(Number(id))) {
              return { id, type }
            } else {
              return name
            }
          }))}
        </code>
      </div>
      <br/>

      <div>
        <b>Raw state:</b> <code>[</code>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {tags.map((item, index) => <li style={{ marginLeft: 10 }} key={`${item.name + index}`}><code>{JSON.stringify(item)}</code></li>)}
          <code>]</code>
        </ul>
      </div>

    </div>
  )
}

export default App
