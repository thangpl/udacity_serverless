import axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-4rzdc21qohb01vge.us.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader);
  const decodedJwt = jsonwebtoken.decode(token, { complete: true });

  if (!decodedJwt || !decodedJwt.header) {
    throw new Error('Invalid token');
  }

  try {
    const cert = await getSigningCertificate(decodedJwt.header.kid);
    return jsonwebtoken.verify(token, cert, { algorithms: ['RS256'] });
  } catch (error) {
    logger.error('Token verification failed', { error });
    return undefined;
  }
}

async function getSigningCertificate(kid) {
  try {
    const { data: { keys = [] } = {} } = await axios.get(jwksUrl);
    const key = keys.find((k) => k.kid === kid);

    if (!key || !key.x5c || key.x5c.length === 0) {
      throw new Error('Signing key not found');
    }

    const pem = key.x5c[0];
    return `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----`;
  } catch (error) {
    throw new Error(`Failed to retrieve signing certificate: ${error.message}`);
  }
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
