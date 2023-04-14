const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const getTodo = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const priorities = ["HIGH", "MEDIUM", "LOW"];
const statuses = ["TO DO", "IN PROGRESS", "DONE"];
const categories = ["WORK", "HOME", "LEARNING"];

app.get("/todos/", async (request, response) => {
  const {
    search_q = "",
    category = "",
    priority = "",
    status = "",
  } = request.query;
  if (statuses.includes(status) === false && status !== "") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorities.includes(priority) === false && priority !== "") {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categories.includes(category) === false && category !== "") {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND category LIKE '%${category}%' AND priority LIKE '%${priority}%'
      and status like '%${status}%';`;
    const dbResponse = await db.all(getTodoQuery);
    response.send(dbResponse.map((dbObj) => getTodo(dbObj)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery2 = `select * from todo where id = ${todoId};`;
  const dbResponse = await db.get(getTodoQuery2);
  response.send(getTodo(dbResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  try {
    const date1 = format(new Date(date), "yyyy-MM-dd");
    if (date1 !== undefined) {
      const getTodosQuery = `select * from todo where due_date = '${date1}';`;
      const dbResponse = await db.all(getTodosQuery);
      response.send(dbResponse.map((eachObj) => getTodo(eachObj)));
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (statuses.includes(status) === false && status !== "") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorities.includes(priority) === false && priority !== "") {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categories.includes(category) === false && category !== "") {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== undefined || dueDate !== "") {
    try {
      const date1 = format(new Date(dueDate), "yyyy-MM-dd");
      const newTodoQuery = `insert into todo (id,todo,priority,status,category,due_date)
        values(${id},'${todo}','${priority}','${status}','${category}','${date1}');`;
      await db.run(newTodoQuery);
      response.send("Todo Successfully Added");
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (statuses.includes(status) === false && status !== "") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorities.includes(priority) === false && priority !== "") {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categories.includes(category) === false && category !== "") {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== "") {
    try {
      const date1 = format(new Date(dueDate), "yyyy-MM-dd");
      if (dueDate !== undefined && dueDate !== "") {
        const updateTodoQuery = `update todo set due_date='${date1}' where id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    if (status !== undefined && status !== "") {
      const updateTodoQuery = `update todo set 
      status='${status}' where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else if (priority !== undefined && priority !== "") {
      const updateTodoQuery = `update todo set priority='${priority}'
      where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else if (todo !== undefined && todo !== "") {
      const updateTodoQuery = `update todo set todo = '${todo}' where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
    } else if (category !== undefined && category !== "") {
      const updateTodoQuery = `update todo set
     category='${category}' where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
