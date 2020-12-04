// Testing Controllers

// 🐨 you'll need a few of the generaters from test/utils/generate.js
// 💰 remember, you can import files in the test/utils directory as if they're node_modules
import {
  buildUser,
  buildBook,
  buildListItem,
  buildReq,
  buildRes,
  buildNext,
} from '../../../test/utils/generate'
import * as booksDB from '../../db/books'
import * as listItemsDB from '../../db/list-items'
import {
  getListItem,
  createListItem,
  setListItem,
  getListItems,
  updateListItem,
  deleteListItem,
} from '../list-items-controller'

jest.mock('../../db/books')
jest.mock('../../db/list-items')

beforeEach(() => {
  jest.clearAllMocks()
})

test('getListItem returns the req.listItem', async () => {
  const user = buildUser()
  const book = buildBook()
  const listItem = buildListItem({ownerId: user.id, bookId: book.id})

  booksDB.readById.mockResolvedValueOnce(book)
  const req = buildReq({user, listItem})
  const res = buildRes()

  await getListItem(req, res)

  expect(booksDB.readById).toHaveBeenCalledWith(book.id)
  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    listItem: {...listItem, book},
  })
  expect(res.json).toHaveBeenCalledTimes(1)
})

test('createListItem returns a 400 error if no bookId is provided', async () => {
  const req = buildReq()
  const res = buildRes()
  await createListItem(req, res)

  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No bookId provided",
      },
    ]
  `)
  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(listItemsDB.query).not.toHaveBeenCalled()
})

test('createListItem returns a 400 error if the item already exists', async () => {
  const ownerId = 'owner-id'
  const user = buildUser({id: ownerId})
  const bookId = 'existing-book-id'
  const req = buildReq({user, body: {bookId}})
  const res = buildRes()

  listItemsDB.query.mockResolvedValueOnce([
    buildListItem({ownerId: user.id, bookId}),
  ])

  await createListItem(req, res)

  expect(listItemsDB.query).toHaveBeenCalledWith({ownerId: user.id, bookId})
  expect(listItemsDB.query).toHaveBeenCalledTimes(1)

  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "User ${ownerId} already has a list item for the book with the ID existing-book-id",
      },
    ]
  `)
  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.status).toHaveBeenCalledTimes(1)
})

test('createListItem creates and returns created list item', async () => {
  const user = buildUser()
  const book = buildBook()
  const listItem = buildListItem({ownerId: user.id, bookId: book.id})
  const req = buildReq({user, body: {bookId: book.id}})
  const res = buildRes()

  booksDB.readById.mockResolvedValueOnce(book)
  listItemsDB.query.mockResolvedValueOnce([])
  listItemsDB.create.mockResolvedValueOnce(listItem)

  await createListItem(req, res)

  expect(listItemsDB.query).toHaveBeenCalledWith({
    ownerId: user.id,
    bookId: book.id,
  })
  expect(listItemsDB.query).toHaveBeenCalledTimes(1)
  expect(listItemsDB.create).toHaveBeenCalledWith({
    ownerId: user.id,
    bookId: book.id,
  })
  expect(listItemsDB.create).toHaveBeenCalledTimes(1)
  expect(listItemsDB.query).toHaveBeenCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(book.id)
  expect(booksDB.readById).toHaveBeenCalledTimes(1)

  expect(res.json).toHaveBeenCalledWith({listItem: {...listItem, book}})
  expect(res.json).toHaveBeenCalledTimes(1)
})

test('setListItem returns 404 if the given listItem does not exist', async () => {
  const fakeId = 'not-in-db'
  const req = buildReq({params: {id: fakeId}})
  const res = buildRes()
  const next = buildNext()

  listItemsDB.readById.mockImplementation((id) =>
    id === fakeId ? null : buildBook({id}),
  )

  await setListItem(req, res, next)

  expect(listItemsDB.readById).toHaveBeenCalledWith(fakeId)
  expect(listItemsDB.readById).toHaveBeenCalledTimes(1)

  expect(next).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(404)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No list item was found with the id of not-in-db",
      },
    ]
  `)
})

test('setListItem returns 403 when trying to change non-owned listItem', async () => {
  const ownerId = 'owner-id'
  const nonOwnerId = 'non-owner-id'
  const owner = buildUser({id: ownerId})
  const someUser = buildUser({id: nonOwnerId})
  const listItem = buildListItem({ownerId: owner.id, id: 'list-item-id'})
  const req = buildReq({user: someUser, params: {id: listItem.id}})
  const res = buildRes()
  const next = buildNext()

  await setListItem(req, res, next)

  expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)
  expect(listItemsDB.readById).toHaveBeenCalledTimes(1)

  expect(next).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(403)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "User with id non-owner-id is not authorized to access the list item list-item-id",
      },
    ]
  `)
  expect(res.json).toHaveBeenCalledTimes(1)
})

test('setListItem sets the item on the req', async () => {
  const owner = buildUser()
  const book = buildBook()
  const listItem = buildListItem({ownerId: owner.id, bookId: book.id})
  const req = buildReq({user: owner, params: {id: listItem.id}})
  const res = buildRes()
  const next = buildNext()
  listItemsDB.readById.mockResolvedValueOnce(listItem)

  await setListItem(req, res, next)

  expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)
  expect(listItemsDB.readById).toHaveBeenCalledTimes(1)

  expect(next).toHaveBeenCalledWith(/* nothing */)
  expect(next).toHaveBeenCalledTimes(1)
  expect(req.listItem).toBe(listItem)
})

test('getListItems gets all items of an owner', async () => {
  const user = buildUser()
  const books = [buildBook(), buildBook(), buildBook()]
  const listItems = books.map((book) => ({
    ...buildListItem({ownerId: user.id, bookId: book.id}),
    book,
  }))
  const req = buildReq({user})
  const res = buildRes()

  listItemsDB.query.mockResolvedValueOnce(listItems)
  booksDB.readManyById.mockResolvedValueOnce(books)

  await getListItems(req, res)

  expect(listItemsDB.query).toHaveBeenCalledWith({ownerId: user.id})
  expect(listItemsDB.query).toHaveBeenCalledTimes(1)

  expect(booksDB.readManyById).toHaveBeenCalledWith(books.map(({id}) => id))
  expect(booksDB.readManyById).toHaveBeenCalledTimes(1)

  expect(res.json).toHaveBeenCalledWith({listItems})
  expect(res.json).toHaveBeenCalledTimes(1)
})

test('updateListItem updates a list item', async () => {
  const initialRating = 3
  const updatedRating = initialRating + 1
  const book = buildBook()
  const listItem = buildListItem({rating: initialRating, bookId: book.id})
  const updates = {rating: updatedRating}
  const req = buildReq({listItem, body: updates})
  const res = buildRes()

  booksDB.readById.mockResolvedValueOnce(book)
  listItemsDB.update.mockResolvedValueOnce({...listItem, ...updates})

  await updateListItem(req, res)

  expect(booksDB.readById).toHaveBeenCalledWith(book.id)
  expect(booksDB.readById).toHaveBeenCalledTimes(1)

  expect(listItemsDB.update).toHaveBeenCalledWith(listItem.id, updates)
  expect(listItemsDB.update).toHaveBeenCalledTimes(1)

  expect(res.json).toBeCalledWith({
    listItem: {...listItem, ...updates, book},
  })
  expect(res.json).toHaveBeenCalledTimes(1)
})

test('deleteListItem deletes a list item', async () => {
  const listItem = buildListItem()
  const req = buildReq({listItem})
  const res = buildRes()

  listItemsDB.remove.mockResolvedValueOnce()

  await deleteListItem(req, res)

  expect(listItemsDB.remove).toHaveBeenCalledWith(listItem.id)
  expect(listItemsDB.remove).toHaveBeenCalledTimes(1)

  expect(res.json).toHaveBeenCalledWith({success: true})
  expect(res.json).toHaveBeenCalledTimes(1)
})
