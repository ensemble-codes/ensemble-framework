import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import env from '@fastify/env';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import agentRoutes from './routes/agents';
import { swaggerDefinitions } from './schemas/definitions';

// Environment schema
const envSchema = {
  type: 'object',
  required: ['PORT', 'NETWORK_RPC_URL', 'AGENT_REGISTRY_ADDRESS', 'SERVICE_REGISTRY_ADDRESS', 'TASK_REGISTRY_ADDRESS'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    JWT_SECRET: {
      type: 'string',
      default: 'ensemble-jwt-secret-change-in-production'
    },
    NETWORK_RPC_URL: {
      type: 'string'
    },
    AGENT_REGISTRY_ADDRESS: {
      type: 'string'
    },
    SERVICE_REGISTRY_ADDRESS: {
      type: 'string'
    },
    TASK_REGISTRY_ADDRESS: {
      type: 'string'
    },
    ENSEMBLE_SUBGRAPH_URL: {
      type: 'string'
    }
  }
};

async function build() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty'
      } : undefined
    }
  });

  try {
    // Register environment plugin
    await fastify.register(env, {
      schema: envSchema,
      dotenv: true
    });

    // Register Swagger documentation
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Ensemble Framework API',
          description: 'REST API for agent discovery, management, and blockchain interaction within the Ensemble Framework',
          version: '0.1.0',
          contact: {
            name: 'Ensemble Framework',
            url: 'https://ensemble.ai',
            email: 'support@ensemble.ai'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        host: process.env.NODE_ENV === 'development' ? `localhost:${process.env.PORT}` : process.env.PRODUCTION_DOMAIN,
        schemes: process.env.NODE_ENV === 'development' ? ['http'] : ['https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'agents', description: 'Agent discovery and management endpoints' },
          { name: 'health', description: 'System health and status endpoints' }
        ],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT Bearer token'
          },
          ApiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            description: 'API Key for service authentication'
          }
        },
        definitions: swaggerDefinitions
      }
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
      },
      uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      transformSpecificationClone: true
    });

    // Register plugins
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'development' ? true : ['https://ensemble.ai'],
    });

    await fastify.register(sensible);

    await fastify.register(jwt, {
      secret: (fastify as any).config.JWT_SECRET
    });

    await fastify.register(rateLimit, {
      max: 1000,
      timeWindow: '1 minute',
      errorResponseBuilder: (request, context) => {
        return {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
            timestamp: new Date().toISOString()
          }
        };
      }
    });

    // Register routes
    await fastify.register(agentRoutes, { prefix: '/api/v1' });

    // Health check endpoint
    fastify.get('/health', {
      schema: {
        tags: ['health'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the API server',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '0.1.0'
      };
    });

    // Error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      fastify.log.error(error);
      
      if (error.validation) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.validation,
            timestamp: new Date().toISOString()
          }
        });
      }

      const statusCode = error.statusCode || 500;
      const response: any = {
        error: {
          code: error.code || 'INTERNAL_SERVER_ERROR',
          message: statusCode === 500 ? 'Internal server error' : error.message,
          timestamp: new Date().toISOString()
        }
      };

      if (isDevelopment && statusCode === 500) {
        response.error.stack = error.stack;
      }

      return reply.status(statusCode).send(response);
    });

    return fastify;
  } catch (err) {
    console.error('Error building server:', err);
    process.exit(1);
  }
}

async function start() {
  try {
    const server = await build();
    const port = Number((server as any).config.PORT);
    
    await server.listen({ port, host: '0.0.0.0' });
    
    server.log.info(`🚀 Ensemble API server listening on port ${port}`);
    server.log.info(`📍 Environment: ${(server as any).config.NODE_ENV}`);
    server.log.info(`🔗 Health check: http://localhost:${port}/health`);
    server.log.info(`📚 API Documentation: http://localhost:${port}/docs`);
    server.log.info(`🤖 Agent API: http://localhost:${port}/api/v1/agents`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { build, start };