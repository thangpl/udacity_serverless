import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createLogger } from '../utils/logger.mjs';
import AWSXRay from 'aws-xray-sdk-core'

const logger = createLogger('todoAccess');
const dynamoDb = AWSXRay.captureAWSv3Client(new DynamoDB())
const dynamoDbClient = DynamoDBDocument.from(dynamoDb)
const todosTable = process.env.TODOS_TABLE;

const sendCommand = async (command, actionDescription) => {
    try {
        logger.info(actionDescription);
        const result = await dynamoDbClient.send(command);
        return result;
    } catch (error) {
        logger.error(`Failed to ${actionDescription.toLowerCase()}`, { error });
        throw error;
    }
};

export const getTodos = async (userId) => {
    const command = new QueryCommand({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    });

    const result = await sendCommand(command, 'retrieve all todo items');
    return result.Items;
};

export const createTodo = async (newTodo) => {
    const command = new PutCommand({
        TableName: todosTable,
        Item: newTodo
    });

    await sendCommand(command, `create new todo item: ${newTodo.todoId}`);
    return newTodo;
};

export const updateTodo = async (userId, todoId, updateData) => {
    const command = new UpdateCommand({
        TableName: todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set #n = :n, dueDate = :due, done = :dn',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
            ':n': updateData.name,
            ':due': updateData.dueDate,
            ':dn': updateData.done,
        }
    });

    await sendCommand(command, `update todo item: ${todoId}`);
};

export const deleteTodo = async (userId, todoId) => {
    const command = new DeleteCommand({
        TableName: todosTable,
        Key: { userId, todoId }
    });

    await sendCommand(command, `delete todo item: ${todoId}`);
};

export const saveImgUrl = async (userId, todoId, bucketName) => {
    const command = new UpdateCommand({
        TableName: todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
            ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoId}`
        }
    });

    await sendCommand(
        command,
        `update image URL for todo item: https://${bucketName}.s3.amazonaws.com/${todoId}`
    );
};