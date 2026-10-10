
# QuickNotes API Design

## 1. Overview

QuickNotes is a note-taking application that allows users to create, retrieve, update, and delete notes. The proposed API follows REST (Representational State Transfer) principles and uses HTTP methods to perform operations on resources.

The API exchanges data using JSON (JavaScript Object Notation).

**Proposed base URL:** `https://api.quicknotes.example/v1`

**Content type:** `application/json`

**Authentication:** Protected endpoints require a valid authentication token, sent using the `Authorization: Bearer <token>` header.

**Important implementation note:** The current QuickNotes front end uses JSONPlaceholder for API practice. The endpoints described below are the proposed design for a future QuickNotes backend, not a claim that this backend is already deployed.

## 2. REST Endpoints

| Method | Endpoint | Description | Success status |
|---|---|---|---|
| GET | `/health` | Check whether the API is available | 200 OK |
| POST | `/auth/login` | Authenticate a user | 200 OK |
| GET | `/users/me` | Retrieve the authenticated user's profile | 200 OK |
| GET | `/notes` | Retrieve the authenticated user's notes | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| GET | `/notes/{noteId}` | Retrieve one note by its ID | 200 OK |
| PATCH | `/notes/{noteId}` | Update selected fields of a note | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | Retrieve the user's tags | 200 OK |
| POST | `/tags` | Create a new tag | 201 Created |
| POST | `/notes/{noteId}/tags/{tagId}` | Assign a tag to a note | 201 Created |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag from a note | 204 No Content |

### HTTP Method Explanations

- **GET:** Reads information without intentionally changing stored data.
- **POST:** Creates a resource or performs an operation.
- **PATCH:** Updates selected fields of an existing resource.
- **DELETE:** Removes a resource or relationship.
- **201 Created:** Indicates that a resource was created successfully.
- **204 No Content:** Indicates success with no response body.

## 3. Example: Retrieve Notes

**Request**

```http
GET /v1/notes
Authorization: Bearer <token>
```

**Example response — 200 OK**

```json
{
  "data": [
    {
      "id": 101,
      "title": "Study Plan",
      "body": "Revise JavaScript and complete the assignment.",
      "userId": 1,
      "createdAt": "2026-10-10T09:00:00Z",
      "updatedAt": "2026-10-10T09:00:00Z"
    },
    {
      "id": 102,
      "title": "Project Ideas",
      "body": "Plan the next QuickNotes features.",
      "userId": 1,
      "createdAt": "2026-10-10T10:00:00Z",
      "updatedAt": "2026-10-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

The API returns notes belonging to the authenticated user. Pagination helps clients retrieve large collections in manageable groups.

## 4. Example: Create a Note

**Request**

```http
POST /v1/notes
Content-Type: application/json
Authorization: Bearer <token>
```

**Request body**

```json
{
  "title": "My First Note",
  "body": "This is a note created through the QuickNotes API."
}
```

**Example response — 201 Created**

```json
{
  "data": {
    "id": 103,
    "title": "My First Note",
    "body": "This is a note created through the QuickNotes API.",
    "userId": 1,
    "createdAt": "2026-10-10T11:00:00Z",
    "updatedAt": "2026-10-10T11:00:00Z"
  }
}
```

The server obtains the user's identity from the authentication token rather than trusting a user ID supplied in the request body. The database generates the new note ID and stores the note.

## 5. Example: Update and Delete a Note

### Update a Note

**Request**

```http
PATCH /v1/notes/103
Content-Type: application/json
Authorization: Bearer <token>
```

**Request body**

```json
{
  "title": "Updated Note Title"
}
```

**Success response — 200 OK**

```json
{
  "data": {
    "id": 103,
    "title": "Updated Note Title",
    "body": "This is a note created through the QuickNotes API.",
    "userId": 1,
    "updatedAt": "2026-10-10T12:00:00Z"
  }
}
```

Only the supplied fields are changed. The server checks that the note belongs to the authenticated user.

### Delete a Note

**Request**

```http
DELETE /v1/notes/103
Authorization: Bearer <token>
```

**Success response**

```http
204 No Content
```

A successful response has no response body. The server deletes the note if it exists and belongs to the authenticated user.

## 6. Error Handling

The API uses standard HTTP status codes to communicate errors.

| Status | Error | When it occurs |
|---|---|---|
| 400 | Bad Request | Invalid input or malformed JSON |
| 401 | Unauthorized | Missing, invalid, or expired authentication token |
| 403 | Forbidden | The user is not permitted to perform the requested operation |
| 404 | Not Found | The requested resource does not exist |
| 500 | Internal Server Error | An unexpected server-side failure occurs |

### Example Error Response

**HTTP status:** `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "title": "Title is required."
    }
  }
}
```

### Error-Handling Rules

1. Validate incoming data before storing it.
2. Return clear error messages that help the client correct a request.
3. Never expose passwords, authentication tokens, database credentials, or internal stack traces in API error responses.
4. Verify ownership before allowing a user to update or delete a note.
5. Log unexpected server errors for investigation without exposing sensitive information to the client.

## 7. Validation Rules

- A note title is required.
- A note title must not exceed 100 characters.
- A note body is optional, subject to a configured maximum length.
- Note IDs must be valid identifiers.
- Every note must belong to an existing user.
- A user may access only notes they are authorised to view or modify.
- Tag names must not be empty, and duplicate tag assignments should be prevented.

## 8. Security Considerations

- Use HTTPS to protect information transmitted between the client and server.
- Authenticate users before accessing protected resources.
- Authorise each note operation by checking resource ownership.
- Validate and sanitise incoming data.
- Apply rate limiting to reduce abuse.
- Store passwords securely using an appropriate password-hashing algorithm.
- Keep secrets and credentials out of client-side JavaScript and public source code.

## 9. Current Practice API

The current front end uses JSONPlaceholder for practice:

- **GET:** `https://jsonplaceholder.typicode.com/posts?_limit=10`
- **POST:** `https://jsonplaceholder.typicode.com/posts`
- **DELETE:** `https://jsonplaceholder.typicode.com/posts/{id}`

JSONPlaceholder is a testing service. It simulates creating and deleting posts, but these changes are not permanently saved on its server. The proposed QuickNotes endpoints above would require a separate backend implementation.

## 10. Conclusion

The proposed QuickNotes API provides a consistent interface for authentication, note management, and tag management. Standard HTTP methods, JSON responses, validation, and appropriate error codes make the API easier to use, test, maintain, and extend.
