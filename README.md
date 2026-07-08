# To_Do_list
 Ledger — To-Do List Dashboard

A task dashboard with **Active**, **Previous Pending**, and **Completed** sections, a MySQL-backed
persistence layer, and a PHP JSON API.

## Project structure

```
todo-app/
├── index.html          Dashboard page (markup only)
├── css/
│   └── style.css        All styling, fully responsive
├── js/
│   └── app.js            Fetches from the API, renders lists, handles add/complete/delete
├── api/
│   └── tasks.php          Single JSON endpoint: list / create / complete / delete
├── config/
│   └── db.php              PDO/MySQL connection (edit credentials here)
└── sql/
    └── schema.sql            CREATE DATABASE + CREATE TABLE statements
```

## How "Previous Pending" works

There is **no separate table or cron job** for pending tasks. A task has only two stored
states: `active` and `completed`. Whether it displays under **Active Tasks** or
**Previous Pending Tasks** is computed every time the list is loaded:

```sql
-- Active   : status = 'active' AND task_date >= CURDATE()
-- Pending  : status = 'active' AND task_date <  CURDATE()
```

So the moment midnight passes, a task whose date has slipped into the past automatically
reads as "pending" on the very next page load — no background process required. The
`created_at` timestamp is preserved and shown so the user can always see when the task
was originally created, and pending tasks can still be completed with the same button as
active tasks (`api/tasks.php?action=complete`).

## Database setup

1. Create the database and table:
   ```bash
   mysql -u root -p < sql/schema.sql
   ```
2. Open `config/db.php` and set `$DB_USER` / `$DB_PASS` to match your MySQL install.

## Running the app

Any standard PHP setup works (Apache, Nginx + PHP-FPM, or the built-in server):

```bash
cd todo-app
php -S localhost:8000
```

Then open `http://localhost:8000` in a browser.

## API reference (`api/tasks.php`)

| Action     | Method | Body / Query                                   | Description                              |
|------------|--------|-------------------------------------------------|-------------------------------------------|
| `list`     | GET    | `?action=list`                                   | Returns active, pending, completed + counts |
| `create`   | POST   | `{action, task_name, task_date, task_time}`      | Creates a new task                       |
| `complete` | POST   | `{action, id}`                                   | Marks a task completed, stamps `completed_at` |
| `delete`   | POST   | `{action, id}`                                   | Deletes a task                           |

All responses are JSON: `{ "success": true/false, ... }`.

## Notes

- Dates/times are stored as `DATE` and `TIME` columns (not combined) so the schema matches
  "task name, date, and time" exactly as specified.
- `created_at` records when the task was actually added to the ledger (used for the
  "original created date" shown on pending tasks); `task_date`/`task_time` is when the
  task is scheduled/due.
- `completed_at` is a `DATETIME` populated by `NOW()` at completion time, shown in the
  Completed column.

output:
  click this link : http://list.infy.click/?task_name=sql&task_date=2026-07-18&task_time=13%3A26
