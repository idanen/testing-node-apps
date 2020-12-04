// Testing Middleware
import {UnauthorizedError} from 'express-jwt'
import {buildRes, buildNext} from 'utils/generate'
import errorMiddleware from '../error-middleware'

test(`that an unauthorized error is thrown`, () => {
  const code = 'some_error_code'
  const message = 'Some message'
  const error = new UnauthorizedError(code, {message})
  const res = buildRes()
  const next = buildNext()
  errorMiddleware(error, {}, res, next)
  expect(next).not.toBeCalled()
  expect(res.json).toBeCalledWith({code: error.code, message: error.message})
  expect(res.json).toBeCalledTimes(1)
  expect(res.status).toBeCalledWith(401)
  expect(res.status).toBeCalledTimes(1)
})

test(`that we do nothing when header already sent`, () => {
  const error = new Error('no')
  const res = buildRes({headersSent: true})
  const nextFn = buildNext()
  errorMiddleware(error, {}, res, nextFn)
  expect(nextFn).toBeCalledWith(error)
  expect(nextFn).toBeCalledTimes(1)
  expect(res.json).not.toBeCalled()
  expect(res.status).not.toBeCalled()
})

// 🐨 Write a test for the else case (responds with a 500)
test(`that we send a "default" response`, () => {
  const error = new Error('just an ordinary error')
  const res = buildRes()
  const next = buildNext()
  errorMiddleware(error, {}, res, next)
  expect(next).not.toBeCalled()
  expect(res.status).toBeCalledWith(500)
  expect(res.status).toBeCalledTimes(1)
  expect(res.json).toBeCalledWith({message: error.message, stack: error.stack})
  expect(res.json).toBeCalledTimes(1)
})
