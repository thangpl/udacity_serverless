import * as uuid from 'uuid';
import { getTodos as getTodosDb, createTodo as createTodoDb, updateTodo as updateTodoDb, deleteTodo as deleteTodoDb } from '../dataLayer/todosAccess.mjs'

export const getTodos = async (userId) => getTodosDb(userId);

export const createTodo = async (userId, todoData) => {
    const todoId = uuid.v4();
    const newTodo = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        ...todoData,
    };
    return createTodoDb(newTodo);
};

export const updateTodo = async (userId, todoId, todoData) => updateTodoDb(userId, todoId, todoData);

export const deleteTodo = async (userId, todoId) => deleteTodoDb(userId, todoId);