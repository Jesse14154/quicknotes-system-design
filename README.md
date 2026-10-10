
# QuickNotes System Design

QuickNotes is a note-taking application project that demonstrates front-end API integration and the design of a scalable note-management system.

The project uses HTML, CSS, and JavaScript to demonstrate retrieving notes, creating notes, and deleting notes through HTTP requests. It also includes documentation for a proposed REST API, relational database model, and scalable system architecture.

## Project Objectives

- Practise REST API operations using GET, POST, and DELETE.
- Handle loading, success, empty, and error states.
- Validate user input before submitting a new note.
- Design a REST API for a future QuickNotes backend.
- Model users, notes, tags, and their relationships using SQL.
- Plan an architecture that can scale to a large number of users.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## Technologies Used

- HTML5 for page structure.
- CSS3 for layout and styling.
- JavaScript for API requests and interface behaviour.
- Fetch API for HTTP communication.
- JSONPlaceholder as a practice API.
- Markdown for project documentation.
- PostgreSQL as the proposed production database.

## How to Run the Project

### Option 1: Open the HTML file

1. Clone or download this repository.
2. Open the project folder.
3. Open `index.html` in a web browser.
4. Click **Load notes** to retrieve sample posts.
5. Enter a title and optional body, then click **Create note**.
6. Click **Delete note** to remove a displayed note from the page.

For the best development experience, use Visual Studio Code with the Live Server extension, or another local static web server.

### Option 2: Run with VS Code Live Server

1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. Test loading, creating, and deleting notes in the browser.

No separate backend server is required for this demonstration because the front end communicates with JSONPlaceholder.

## API Practice

The project uses the JSONPlaceholder posts API:

| Operation | Method | Endpoint |
|---|---|---|
| Load notes | GET | `https://jsonplaceholder.typicode.com/posts?_limit=10` |
| Create a note | POST | `https://jsonplaceholder.typicode.com/posts` |
| Delete a note | DELETE | `https://jsonplaceholder.typicode.com/posts/{id}` |

**Important limitation:** JSONPlaceholder is a testing service. It simulates POST and DELETE operations but does not permanently save these changes on its server. Newly created notes may disappear after a page reload, and deleted sample posts may reappear when notes are loaded again.

The production API described in the documentation is a proposed design. It is not currently deployed as a real QuickNotes backend.

## Documentation

### 1. API Design

See [docs/api-design.md](docs/api-design.md).

This document describes the proposed REST endpoints, HTTP methods, JSON request and response examples, validation rules, authentication, and error handling.

### 2. Data Model

See [docs/data-model.md](docs/data-model.md).

This document defines the users, notes, tags, and note_tags tables, their relationships, SQL table definitions, example queries, indexes, and database choice.

### 3. System Architecture

See [docs/architecture.md](docs/architecture.md).

This document describes functional and non-functional requirements, the architecture diagram, request flows, capacity estimates, scalability, trade-offs, and reliability strategies.

## Key Learning Outcomes

1. **HTTP methods and REST:** GET retrieves resources, POST submits new resources, and DELETE requests the removal of resources.
2. **Asynchronous JavaScript:** The Fetch API and async/await make it possible to handle HTTP requests without blocking the entire interface.
3. **Error handling and validation:** Input validation and clear loading, success, and error messages improve usability and reliability.
4. **Relational database design:** Primary keys, foreign keys, indexes, and joins help organise and retrieve related data.
5. **System scalability:** Load balancing, caching, read replicas, queues, and monitoring can help a system handle increased traffic.
6. **API limitations:** A successful response from a practice API does not necessarily mean changes are permanently stored.

## Future Improvements

- Implement a real backend and persistent database.
- Add user registration and authentication.
- Implement note updating and searching.
- Add tags and filtering.
- Add automated tests and continuous integration.
- Improve accessibility and mobile responsiveness.
- Deploy the application with HTTPS, monitoring, backups, and appropriate security controls.

## Author

Created as a Web Foundations system design project.
