import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { createLogger } from '../../utils/logger.mjs'
import { getUserId } from '../utils.mjs'
import { saveImgUrl } from '../../dataLayer/todosAccess.mjs'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const bucketName = process.env.TODOS_S3_BUCKET
const urlExpiration = Number(process.env.SIGNED_URL_EXPIRATION)
const logger = createLogger('generateUploadUrl')
const client = new S3Client({ region: "us-east-1" });

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    logger.info('Generating upload URL for todo', {
      todoId,
      userId,
      bucketName
    })

    try {
      const command = new PutObjectCommand({ Bucket: bucketName, Key: todoId })
      const uploadUrl = await getSignedUrl(client, command, { expiresIn: urlExpiration })

      await saveImgUrl(userId, todoId, bucketName)

      logger.info('Successfully generated upload URL:', {
        todoId,
        uploadUrl
      })

      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl: uploadUrl
        })
      }
    } catch (error) {
      logger.error('Error generating upload URL:', { error, todoId, userId })

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Error generating upload URL'
        })
      }
    }
  })