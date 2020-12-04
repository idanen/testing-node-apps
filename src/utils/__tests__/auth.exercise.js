// Testing Pure Functions

// 🐨 import the function that we're testing
import cases from 'jest-in-case'
import {isPasswordAllowed} from '../auth'

cases(
  'valid passwords',
  ({password}) => {
    expect(isPasswordAllowed(password)).toBe(true)
  },
  {
    valid: {password: '!aBc123'},
  },
)

cases(
  'invalid passwords',
  ({password}) => {
    expect(isPasswordAllowed(password)).toBe(false)
  },
  Object.entries({
    'too short': 'a2cDe!',
    'missing non-alphanumeric': 'abcD123',
    'missing letters': '123456!',
    'missing digit': 'abcdEF!',
    'missing uppercase': 'abcdef!',
    'missing lowercase': 'ABCDEF!',
  }).map(([name, password]) => ({name: `${name} - ${password}`, password})),
)

// 🐨 write tests for valid and invalid passwords
// 💰 here are some you can use:
//
// valid:
// - !aBc123
//
// invalid:
// - a2c! // too short
// - 123456! // no alphabet characters
// - ABCdef! // no numbers
// - abc123! // no uppercase letters
// - ABC123! // no lowercase letters
// - ABCdef123 // no non-alphanumeric characters
