
# QuickNotes System Architecture

## 1. Overview

QuickNotes is a web-based note-taking application. Users can create, read, update, and delete notes. This document describes a scalable production architecture that can support one million registered users.

The current project uses HTML, CSS, JavaScript, and JSONPlaceholder for API practice. JSONPlaceholder simulates API operations and is not a production database. The architecture below describes a proposed real deployment.

## 2. Functional Requirements

The system must:

1. Allow users to register and log in securely.
2. Allow authenticated users to create notes.
3. Allow users to view and search their notes.
4. Allow users to update and delete their notes.
5. Allow users to organise notes with tags.
6. Prevent users from accessing other users' private notes.
7. Return clear success responses and error messages.
8. Support pagination when users have many notes.

## 3. Non-Functional Requirements

### Performance

- Aim for common read requests to complete within 300 ms at the 95th percentile under normal load.
- Aim for create and update requests to complete within 500 ms at the 95th percentile under normal load.
- Use caching where appropriate to reduce repeated database reads.

These are proposed targets that must be validated through performance testing.

### Scalability

- Support horizontal scaling by adding application servers.
- Use database indexes, connection pooling, and read replicas where appropriate.
- Use a queue for background tasks such as sending notifications.

### Availability and Reliability

- Deploy application servers across multiple availability zones where available.
- Use health checks and automatic replacement of unhealthy instances.
- Back up the database and regularly test restoration.
- Monitor errors, latency, database load, and queue depth.

### Security

- Require authentication for private notes.
- Enforce note ownership checks on the server.
- Use HTTPS, secure password hashing, and managed secrets.
- Validate input and use parameterised database queries.
- Apply rate limits and least-privilege permissions.

### Maintainability

- Separate the client, application logic, database, and background workers.
- Use version control, automated tests, and documented APIs.
- Keep configuration and secrets outside source code.

## 4. High-Level Architecture Diagram

```text
                     +------------------+
                     |      Users       |
                     | Web Browser/App  |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     |       DNS        |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | CDN / WAF / TLS  |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | Load Balancer    |
                     +--------+---------+
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        +----------------+       +----------------+
        | App Server 1   |       | App Server 2   |
        | REST API       |       | REST API       |
        +-------+--------+       +-------+--------+
                |                        |
                +------------+-----------+
                             |
                +------------+------------+
                |                         |
                v                         v
        +----------------+       +----------------+
        | Cache          |       | Primary DB     |
        | Redis          |       | PostgreSQL     |
        +----------------+       +-------+--------+
                                         |
                                         v
                                +----------------+
                                | Read Replica   |
                                +----------------+

        App Servers
             |
             v
        +----------------+
        | Message Queue  |
        +-------+--------+
                |
                v
        +----------------+
        | Background     |
        | Worker(s)      |
        +----------------+
```

The diagram represents logical components. A production deployment may place these components in managed cloud services or containers.

## 5. Component Responsibilities

### 5.1 Client

The client is the web browser or mobile application. It displays notes, collects user input, and sends HTTP requests to the API.

### 5.2 DNS

The Domain Name System maps the application's domain name to the appropriate service endpoint. Multiple DNS records or a managed DNS service can improve resilience.

### 5.3 CDN, WAF, and TLS

The Content Delivery Network (CDN) caches suitable static assets close to users. A Web Application Firewall (WAF) filters suspicious traffic, while TLS protects data in transit through HTTPS.

Private note data must not be placed in a shared public cache.

### 5.4 Load Balancer

The load balancer distributes requests among healthy application servers and performs health checks. It prevents all incoming traffic from depending on a single application instance.

### 5.5 Application Servers

At least two application server instances handle API requests, authenticate users, validate input, enforce ownership, and execute business logic.

The servers should be stateless where practical, allowing additional instances to be added without moving user sessions between machines.

### 5.6 Cache

Redis can cache suitable, frequently requested data and reduce repeated database reads. Cache entries must respect user permissions and be invalidated or refreshed when notes change.

Caching private notes requires user-specific keys and careful expiration rules.

### 5.7 Primary Database

PostgreSQL is the authoritative data store for users, notes, tags, and their relationships. Create, update, and delete operations are written to the primary database.

Transactions and constraints protect data integrity.

### 5.8 Read Replica

A read replica serves eligible read-only queries and can reduce load on the primary database. Replication may be delayed, so requests that require immediately consistent data should read from the primary.

### 5.9 Message Queue

A message queue temporarily stores background jobs so that application requests do not have to wait for every task to finish. Examples include sending notifications and processing exports.

### 5.10 Background Workers

Workers consume queued jobs and process them independently of user-facing requests. They should retry temporary failures safely and avoid duplicating non-idempotent operations.

### 5.11 Monitoring and Backups

Centralised logs, metrics, alerts, and database backups help operators detect failures and restore data. Monitoring should cover latency, error rates, resource usage, and replication health.

## 6. Request Flow: GET /notes

When a user retrieves notes:

1. The browser sends `GET /notes?page=1&limit=20` over HTTPS.
2. DNS resolves the application domain.
3. The CDN and WAF handle eligible static content and inspect incoming traffic.
4. The load balancer forwards the API request to a healthy application server.
5. The application server authenticates the user and validates pagination parameters.
6. The server checks the cache for the user's permitted note results.
7. If the cache misses, the server queries PostgreSQL, using a suitable read replica when eventual consistency is acceptable.
8. The server returns a JSON response with the notes and pagination information.
9. The browser renders the results.

Example response:

```json
{
  "data": [
    {
      "id": 101,
      "title": "Study Plan",
      "body": "Review today's lecture notes."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

The example is illustrative. A production API should return only fields the authenticated user is authorised to see.

## 7. Request Flow: POST /notes

When a user creates a note:

1. The browser sends `POST /notes` with a JSON request body and authentication credentials.
2. DNS, the CDN/WAF, and the load balancer route the request to a healthy application server.
3. The server authenticates the user and validates the title and body.
4. The server obtains the owner ID from the authenticated identity, not from an untrusted client-supplied owner field.
5. The server inserts the note into the primary PostgreSQL database.
6. The database commits the transaction and returns the new note ID.
7. The application invalidates or updates relevant cache entries.
8. The server responds with `201 Created` and the newly created note.
9. Non-essential follow-up work can be placed on the message queue.

Example response:

```json
{
  "id": 102,
  "title": "Study Plan",
  "body": "Review today's lecture notes."
}
```

If a request fails validation, the API returns an appropriate client error instead of creating the note.

## 8. Capacity Estimates for One Million Registered Users

These are planning estimates, not measured traffic. Actual capacity depends on user behaviour, note size, indexes, caching, and the deployment environment.

### 8.1 Assumptions

- Registered users: 1,000,000.
- Daily active users: 10% of registered users = 100,000.
- Average reads per active user per day: 20.
- Average writes per active user per day: 2.
- Average stored note content and basic record metadata: 2 KB per note.
- Each day has 86,400 seconds.

### 8.2 Average Reads per Second

Daily reads:

100,000 × 20 = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23 reads/second.

### 8.3 Average Writes per Second

Daily writes:

100,000 × 2 = 200,000 writes per day.

Average writes per second:

200,000 ÷ 86,400 ≈ 2.3 writes/second.

These write estimates combine note creation and other write operations. A real workload should separately measure creates, updates, and deletes.

### 8.4 Peak Traffic

Assume peak traffic is ten times the average:

- Peak reads: approximately 230 reads/second.
- Peak writes: approximately 23 writes/second.

The application and database should be load-tested against these estimates, with extra capacity for growth and temporary spikes.

### 8.5 Storage per Year

Assume each active user creates two new notes per day and each note averages 2 KB.

Annual new notes:

100,000 × 2 × 365 = 73,000,000 notes per year.

Annual raw note storage:

73,000,000 × 2 KB = 146,000,000 KB, approximately 146 GB per year using decimal units.

This estimate covers note records and content only. It excludes user records, tags, indexes, logs, replicas, backups, and storage overhead. A practical capacity plan must budget additional space for these items and monitor real growth.

## 9. Scalability and Reliability Strategies

1. **Horizontal scaling:** Add application server instances when CPU, latency, or request volume increases.
2. **Database indexing:** Index commonly filtered and sorted fields, such as `user_id` and `updated_at`.
3. **Caching:** Cache suitable read results and invalidate stale entries after writes.
4. **Read replicas:** Offload eligible read traffic from the primary database.
5. **Connection pooling:** Reuse database connections instead of opening a new connection for every request.
6. **Asynchronous jobs:** Move slow, non-essential tasks to a queue and worker system.
7. **Rate limiting:** Protect the API from abuse and excessive requests.
8. **Backups and recovery:** Maintain backups and test restoration procedures.
9. **Observability:** Track latency, error rates, queue depth, database health, and saturation.

## 10. Trade-Offs

### Trade-Off 1: SQL vs NoSQL

PostgreSQL provides strong relational constraints, transactions, and joins. A NoSQL database can offer more flexible document structures, but it may require additional application logic to maintain relationships.

For QuickNotes, the relational model is a good starting point because notes, users, and tags have clear relationships.

### Trade-Off 2: Caching vs Data Consistency

Caching can lower response times and reduce database load. However, cached results can become stale after a note is updated or deleted.

The application must invalidate or refresh affected cache entries. Operations requiring immediate consistency should use the primary database.

### Trade-Off 3: Read Replicas vs Immediate Consistency

Read replicas improve read capacity, but replication delay can cause a recently changed note to appear outdated briefly.

Requests requiring read-after-write consistency should use the primary database.

### Trade-Off 4: Synchronous vs Asynchronous Processing

Synchronous processing is simpler and immediately reports the result of a database operation. Asynchronous processing improves responsiveness for background work but adds queue management, retries, and monitoring requirements.

Core note creation should be confirmed after the database commits. Non-essential notifications can be asynchronous.

## 11. Avoiding Single Points of Failure

- Run multiple application servers behind a health-checking load balancer.
- Spread instances across availability zones when the platform supports it.
- Use managed or highly available database deployments with automated failover where practical.
- Back up the database and regularly test recovery.
- Use redundant networking and managed DNS services.
- Monitor cache availability and define a safe fallback when the cache is unavailable.
- Configure durable queues, worker retries, and dead-letter handling for repeatedly failing jobs.
- Alert on failed health checks, elevated error rates, and database replication lag.

Redundancy reduces single points of failure, but it does not guarantee uninterrupted service. Failover and recovery procedures must be tested.

## 12. Conclusion

The proposed architecture separates client presentation, API processing, data storage, caching, and background tasks. Multiple application servers, a load balancer, database replicas, monitoring, and backups provide a foundation for growth.

The estimates suggest an average workload of approximately 23 reads per second and 2.3 writes per second under the stated assumptions. Load testing and production monitoring should guide future capacity decisions.
