
# QuickNotes Data Model

## 1. Overview

QuickNotes is a note-taking application. The database stores user accounts, notes created by users, tags used to organise notes, and the relationships between notes and tags.

The proposed production database is PostgreSQL, a relational database that supports primary keys, foreign keys, transactions, and indexes.

## 2. Entities and Columns

### 2.1 Users

The `users` table stores the people who use QuickNotes.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary key | Unique user ID |
| name | VARCHAR(100) | NOT NULL | User's name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email |
| password_hash | VARCHAR(255) | NOT NULL | Secure password hash |
| created_at | TIMESTAMPTZ | NOT NULL | Account creation time |

### 2.2 Notes

The `notes` table stores notes belonging to users.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary key | Unique note ID |
| user_id | BIGINT | Foreign key, NOT NULL | Owner of the note |
| title | VARCHAR(100) | NOT NULL | Note title |
| body | TEXT | NOT NULL | Note content |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update time |

### 2.3 Tags

The `tags` table stores labels that help users organise notes.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary key | Unique tag ID |
| user_id | BIGINT | Foreign key, NOT NULL | Owner of the tag |
| name | VARCHAR(50) | NOT NULL | Tag name |

A unique constraint on `(user_id, name)` prevents one user from creating duplicate tags with the same name.

### 2.4 Note Tags

The `note_tags` table connects notes to tags.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| note_id | BIGINT | Composite primary key, foreign key | Linked note |
| tag_id | BIGINT | Composite primary key, foreign key | Linked tag |

The composite primary key `(note_id, tag_id)` prevents the same tag from being assigned to the same note more than once.

## 3. Relationships

- One user can own many notes: one-to-many.
- One user can create many tags: one-to-many.
- One note can have many tags, and one tag can be assigned to many notes: many-to-many.
- The `note_tags` table implements the many-to-many relationship between notes and tags.

## 4. SQL Table Definitions

The following SQL uses PostgreSQL syntax. Tables should be created in the order shown because foreign keys depend on previously created tables.

### 4.1 Create Users

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Create Notes

```sql
CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Create Tags

```sql
CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    UNIQUE (user_id, name)
);
```

### 4.4 Create Note Tags

```sql
CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id)
        ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id)
        ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

## 5. Example SQL Queries

### Query 1: Find all notes belonging to one user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This retrieves a user's notes, showing the most recently updated notes first.

### Query 2: Find notes and their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON n.id = nt.note_id
JOIN tags AS t ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id, t.name;
```

This joins three tables to display each note alongside its assigned tags.

### Query 3: Count notes belonging to each user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

The `LEFT JOIN` includes users who have not created any notes.

### Query 4: Find notes containing a search term

```sql
SELECT id, title, body
FROM notes
WHERE user_id = 1
  AND (
      title ILIKE '%study%'
      OR body ILIKE '%study%'
  );
```

This searches a user's note titles and bodies for the word `study`, without distinguishing uppercase and lowercase letters.

## 6. Indexing Strategy

Indexes improve query performance by helping the database find records without scanning every row.

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags (tag_id);
```

- `idx_notes_user_updated` helps retrieve one user's notes in update-time order.
- `idx_note_tags_tag` helps find notes associated with a particular tag.
- Primary keys and unique constraints automatically create supporting indexes in PostgreSQL.

Indexes use additional storage and make inserts, updates, and deletes slightly more expensive. They should be selected based on common queries and measured performance.

## 7. SQL vs NoSQL

### Why SQL is suitable for QuickNotes

A relational database such as PostgreSQL is a good choice because:

1. Notes belong to users, so foreign keys can enforce ownership relationships.
2. Tags and notes have a many-to-many relationship, which is naturally represented using a junction table.
3. Transactions help maintain consistency when multiple related records are changed.
4. SQL supports filtering, sorting, joins, reporting, and indexing.
5. Constraints help prevent invalid or duplicate data.

### When NoSQL might be useful

A document database could be useful if note structures varied substantially or the application needed flexible document storage. It may also suit certain high-scale access patterns.

However, NoSQL would require careful handling of relationships and consistency. For the current QuickNotes requirements, PostgreSQL is a practical starting choice.

## 8. Security and Data Integrity

- Store password hashes, never plaintext passwords.
- Use parameterised SQL queries to reduce SQL injection risk.
- Authenticate users and check note ownership on every protected operation.
- Use foreign keys and constraints to maintain valid relationships.
- Use encrypted connections and restrict database permissions.
- Back up the database and test recovery procedures.

## 9. Conclusion

This data model separates users, notes, and tags into four related tables. Primary keys identify records, foreign keys maintain relationships, and indexes support common queries. PostgreSQL provides a consistent and maintainable foundation for a growing QuickNotes application.
