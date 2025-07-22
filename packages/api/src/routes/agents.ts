import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import AgentService from '../services/agentService';
import { 
  AgentListResponse, 
  AgentDetailResponse, 
  AgentDiscoveryRequest,
  AgentCategory,
  AgentSkill 
} from '../types/agent';

// Request type definitions
interface AgentListQuery {
  page?: number;
  limit?: number;
  category?: string;
  status?: 'active' | 'inactive' | 'all';
  owner?: string;
  reputation_min?: number;
  reputation_max?: number;
  search?: string;
  tags?: string;
  sort_by?: 'created_at' | 'updated_at' | 'reputation' | 'name' | 'total_tasks';
  sort_order?: 'asc' | 'desc';
  service_name?: string;
  price_min?: string;
  price_max?: string;
  token_address?: string;
}

interface AgentDetailParams {
  agentId: string;
}

interface AgentsByOwnerParams {
  ownerAddress: string;
}

interface AgentSkillsQuery {
  category?: string;
  min_usage?: number;
  limit?: number;
  search?: string;
}

interface AgentCategoriesQuery {
  include_empty?: boolean;
  include_counts?: boolean;
}

async function agentRoutes(fastify: FastifyInstance) {
  // Initialize agent service
  const agentService = new AgentService(
    (fastify as any).config.RPC_URL,
    (fastify as any).config.AGENT_REGISTRY_ADDRESS,
    (fastify as any).config.SERVICE_REGISTRY_ADDRESS,
    (fastify as any).config.TASK_REGISTRY_ADDRESS
  );

  // Schema definitions for validation
  const agentListQuerySchema = {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      category: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive', 'all'], default: 'active' },
      owner: { type: 'string' },
      reputation_min: { type: 'number', minimum: 0, maximum: 5 },
      reputation_max: { type: 'number', minimum: 0, maximum: 5 },
      search: { type: 'string' },
      tags: { type: 'string' },
      sort_by: { 
        type: 'string', 
        enum: ['created_at', 'updated_at', 'reputation', 'name', 'total_tasks'],
        default: 'updated_at'
      },
      sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      service_name: { type: 'string' },
      price_min: { type: 'string' },
      price_max: { type: 'string' },
      token_address: { type: 'string' }
    }
  };

  const agentDiscoverySchema = {
    type: 'object',
    properties: {
      query: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          excludeTags: { type: 'array', items: { type: 'string' } }
        }
      },
      filters: {
        type: 'object',
        properties: {
          reputation: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0, maximum: 5 },
              max: { type: 'number', minimum: 0, maximum: 5 }
            }
          },
          pricing: {
            type: 'object',
            properties: {
              min: { type: 'string' },
              max: { type: 'string' },
              tokens: { type: 'array', items: { type: 'string' } }
            }
          },
          availability: {
            type: 'object',
            properties: {
              responseTime: { type: 'number' },
              timezone: { type: 'string' },
              online: { type: 'boolean' }
            }
          },
          experience: {
            type: 'object',
            properties: {
              minTasks: { type: 'number', minimum: 0 },
              successRate: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        }
      },
      sort: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', enum: ['reputation', 'price', 'responseTime', 'successRate'] },
            order: { type: 'string', enum: ['asc', 'desc'] }
          },
          required: ['field', 'order']
        }
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  };

  /**
   * GET /agents - List all agents with filtering and pagination
   */
  fastify.get<{ Querystring: AgentListQuery }>(
    '/agents',
    {
      schema: {
        tags: ['agents'],
        summary: 'List agents with filtering and pagination',
        description: 'Retrieve a paginated list of agents with optional filtering by category, status, reputation, and other criteria',
        querystring: agentListQuerySchema,
        response: {
          200: {
            type: 'object',
            description: 'Successful response with agent list',
            properties: {
              data: { 
                type: 'array',
                description: 'Array of agent records',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    owner: { type: 'string' },
                    agent: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    reputationScore: { type: 'number' },
                    totalRatingsCount: { type: 'integer' },
                    agentCategory: { type: 'string' },
                    communicationType: { type: 'string' },
                    attributes: { type: 'array', items: { type: 'string' } },
                    instructions: { type: 'array', items: { type: 'string' } },
                    prompts: { type: 'array', items: { type: 'string' } },
                    imageURI: { type: 'string' },
                    socials: { type: 'object' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
                  }
                }
              },
              pagination: { 
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  hasNext: { type: 'boolean' },
                  hasPrev: { type: 'boolean' }
                }
              },
              filters: { 
                type: 'object',
                properties: {
                  applied: { type: 'object' },
                  available: { type: 'object' }
                }
              }
            },
            example: {
              data: [{
                id: "agent-001",
                name: "DataAnalyst Pro",
                description: "Advanced data analysis and visualization agent",
                owner: "0x742d35Cc6560C02C69E27...1234",
                agent: "0x847fA49b999489fD2780...5678",
                status: "active",
                reputationScore: 4.8,
                totalRatingsCount: 156,
                agentCategory: "data-analysis",
                communicationType: "websocket",
                attributes: ["data-analysis", "visualization", "python", "sql"],
                instructions: ["Send your dataset", "Specify analysis requirements"],
                prompts: ["Analyze this sales data for trends", "Create a visualization of user engagement"],
                imageURI: "https://ipfs.io/ipfs/Qm...",
                socials: {
                  twitter: "@dataanalyst_pro",
                  telegram: "@dataanalyst_channel",
                  dexscreener: "https://dexscreener.com/..."
                },
                createdAt: "2024-01-15T10:30:00Z",
                updatedAt: "2024-07-20T14:22:00Z"
              }],
              pagination: {
                page: 1,
                limit: 20,
                total: 156,
                totalPages: 8,
                hasNext: true,
                hasPrev: false
              },
              filters: {
                applied: { category: "data-analysis", status: "active" },
                available: {
                  categories: ["data-analysis", "content-creation", "trading"],
                  statuses: ["active", "inactive"]
                }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: AgentListQuery }>, reply: FastifyReply) => {
      try {
        const result = await agentService.getAgents(request.query);
        
        const response: AgentListResponse = {
          data: result.data,
          pagination: result.pagination,
          filters: {
            applied: request.query,
            available: {
              categories: await agentService.getAgentCategories(),
              statuses: ['active', 'inactive'],
              sort_options: ['created_at', 'updated_at', 'reputation', 'name', 'total_tasks']
            }
          }
        };

        return reply.code(200).send(response);
      } catch (error) {
        request.log.error(error, 'Failed to get agents');
        throw fastify.httpErrors.internalServerError('Failed to retrieve agents');
      }
    }
  );

  /**
   * GET /agents/{agentId} - Get specific agent details
   */
  fastify.get<{ Params: AgentDetailParams }>(
    '/agents/:agentId',
    {
      schema: {
        tags: ['agents'],
        summary: 'Get agent details by ID',
        description: 'Retrieve detailed information about a specific agent including capabilities, reputation, and service offerings',
        params: {
          type: 'object',
          properties: {
            agentId: { 
              type: 'string',
              description: 'Unique identifier of the agent'
            }
          },
          required: ['agentId']
        },
        response: {
          200: {
            type: 'object',
            description: 'Successful response with agent details',
            properties: {
              data: { 
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  owner: { type: 'string' },
                  agent: { type: 'string' },
                  status: { type: 'string' },
                  reputationScore: { type: 'number' },
                  totalRatingsCount: { type: 'integer' },
                  agentCategory: { type: 'string' },
                  communicationType: { type: 'string' },
                  attributes: { type: 'array', items: { type: 'string' } },
                  instructions: { type: 'array', items: { type: 'string' } },
                  prompts: { type: 'array', items: { type: 'string' } },
                  imageURI: { type: 'string' },
                  metadataURI: { type: 'string' },
                  socials: {
                    type: 'object',
                    properties: {
                      twitter: { type: 'string' },
                      telegram: { type: 'string' },
                      dexscreener: { type: 'string' },
                      github: { type: 'string' },
                      website: { type: 'string' }
                    }
                  },
                  communicationURL: { type: 'string' },
                  communicationParams: { type: 'object' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  lastActiveAt: { type: 'string' }
                }
              }
            },
            example: {
              data: {
                id: "agent-001",
                name: "DataAnalyst Pro",
                description: "Advanced data analysis and visualization agent with expertise in Python, SQL, and statistical modeling. Specializes in business intelligence and predictive analytics.",
                owner: "0x742d35Cc6560C02C69E27dFD5c6C1234567890abc",
                agent: "0x847fA49b999489fD2780fe2843A7b1608106b49b",
                status: "active",
                reputationScore: 4.8,
                totalRatingsCount: 156,
                agentCategory: "data-analysis",
                communicationType: "websocket",
                attributes: ["data-analysis", "visualization", "python", "sql", "machine-learning"],
                instructions: [
                  "Send your dataset in CSV or JSON format",
                  "Specify your analysis requirements and desired outcomes",
                  "Include any specific metrics or KPIs you want to track"
                ],
                prompts: [
                  "Analyze this sales data for quarterly trends and seasonality",
                  "Create a comprehensive dashboard for user engagement metrics",
                  "Build a predictive model for customer churn"
                ],
                imageURI: "https://ipfs.io/ipfs/QmDataAnalystPro123...",
                metadataURI: "https://ipfs.io/ipfs/QmMetadata456...",
                socials: {
                  twitter: "@dataanalyst_pro",
                  telegram: "@dataanalyst_channel",
                  dexscreener: "https://dexscreener.com/base/dataanalyst",
                  github: "https://github.com/dataanalyst-pro",
                  website: "https://dataanalyst-pro.ai"
                },
                communicationURL: "wss://api.dataanalyst-pro.ai/ws",
                communicationParams: {
                  apiVersion: "v1",
                  timeout: 30000,
                  maxFileSize: "100MB"
                },
                createdAt: "2024-01-15T10:30:00Z",
                updatedAt: "2024-07-20T14:22:00Z",
                lastActiveAt: "2024-07-20T13:45:00Z"
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: AgentDetailParams }>, reply: FastifyReply) => {
      try {
        const agent = await agentService.getAgentById(request.params.agentId);
        
        if (!agent) {
          throw fastify.httpErrors.notFound(`Agent with ID ${request.params.agentId} not found`);
        }

        const response: AgentDetailResponse = {
          data: agent
        };

        return reply.code(200).send(response);
      } catch (error: any) {
        if (error.statusCode === 404) throw error;
        request.log.error(error, 'Failed to get agent details');
        throw fastify.httpErrors.internalServerError('Failed to retrieve agent details');
      }
    }
  );

  /**
   * POST /agents/discovery - Advanced agent discovery
   */
  fastify.post<{ Body: AgentDiscoveryRequest }>(
    '/agents/discovery',
    {
      schema: {
        tags: ['agents'],
        summary: 'Advanced agent discovery with complex filtering',
        description: 'Perform sophisticated agent discovery using natural language queries, category filters, reputation requirements, and availability constraints',
        body: agentDiscoverySchema,
        response: {
          200: {
            type: 'object',
            description: 'Successful response with discovered agents',
            properties: {
              data: { 
                type: 'array',
                description: 'Array of agents matching discovery criteria',
                items: {
                  type: 'object',
                  description: 'Agent record with relevance scoring'
                }
              },
              pagination: { 
                type: 'object',
                description: 'Pagination metadata for discovery results'
              },
              filters: { 
                type: 'object',
                description: 'Applied discovery criteria and available refinements'
              }
            }
          },
          400: {
            type: 'object',
            description: 'Invalid discovery request',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: AgentDiscoveryRequest }>, reply: FastifyReply) => {
      try {
        const result = await agentService.discoverAgents(request.body);
        
        const response: AgentListResponse = {
          data: result.data,
          pagination: result.pagination,
          filters: {
            applied: request.body,
            available: {
              categories: await agentService.getAgentCategories(),
              skills: await agentService.getAgentSkills()
            }
          }
        };

        return reply.code(200).send(response);
      } catch (error) {
        request.log.error(error, 'Failed to discover agents');
        throw fastify.httpErrors.internalServerError('Failed to discover agents');
      }
    }
  );

  /**
   * GET /agents/owner/{ownerAddress} - Get agents by owner
   */
  fastify.get<{ Params: AgentsByOwnerParams }>(
    '/agents/owner/:ownerAddress',
    {
      schema: {
        tags: ['agents'],
        summary: 'Get agents by owner address',
        description: 'Retrieve all agents owned by a specific wallet address',
        params: {
          type: 'object',
          properties: {
            ownerAddress: { 
              type: 'string',
              description: 'Ethereum wallet address of the agent owner'
            }
          },
          required: ['ownerAddress']
        },
        response: {
          200: {
            type: 'object',
            description: 'Successful response with owner\'s agents',
            properties: {
              data: { 
                type: 'array',
                description: 'Array of agents owned by the specified address'
              },
              pagination: { type: 'object', description: 'Pagination metadata' },
              filters: { type: 'object', description: 'Applied filters' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: AgentsByOwnerParams }>, reply: FastifyReply) => {
      try {
        const agents = await agentService.getAgentsByOwner(request.params.ownerAddress);
        
        // Use same pagination format for consistency
        const response = {
          data: agents,
          pagination: {
            page: 1,
            limit: agents.length,
            total: agents.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          },
          filters: {
            applied: { owner: request.params.ownerAddress },
            available: {}
          }
        };

        return reply.code(200).send(response);
      } catch (error) {
        request.log.error(error, 'Failed to get agents by owner');
        throw fastify.httpErrors.internalServerError('Failed to retrieve agents by owner');
      }
    }
  );

  /**
   * GET /agents/categories - Get available categories
   */
  fastify.get<{ Querystring: AgentCategoriesQuery }>(
    '/agents/categories',
    {
      schema: {
        tags: ['agents'],
        summary: 'Get available agent categories',
        description: 'Retrieve list of all available agent categories with optional count information',
        querystring: {
          type: 'object',
          properties: {
            include_empty: { 
              type: 'boolean', 
              default: false,
              description: 'Include categories with zero agents'
            },
            include_counts: { 
              type: 'boolean', 
              default: true,
              description: 'Include agent count for each category'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            description: 'Successful response with categories',
            properties: {
              data: {
                type: 'array',
                description: 'Array of agent categories',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    agentCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: AgentCategoriesQuery }>, reply: FastifyReply) => {
      try {
        const categories = await agentService.getAgentCategories();
        
        let filteredCategories = categories;
        if (!request.query.include_empty) {
          filteredCategories = categories.filter(cat => cat.agentCount > 0);
        }

        return reply.code(200).send({
          data: filteredCategories
        });
      } catch (error) {
        request.log.error(error, 'Failed to get agent categories');
        throw fastify.httpErrors.internalServerError('Failed to retrieve agent categories');
      }
    }
  );

  /**
   * GET /agents/skills - Get available skills
   */
  fastify.get<{ Querystring: AgentSkillsQuery }>(
    '/agents/skills',
    {
      schema: {
        tags: ['agents'],
        summary: 'Get available agent skills',
        description: 'Retrieve list of skills offered by agents with filtering and search capabilities',
        querystring: {
          type: 'object',
          properties: {
            category: { 
              type: 'string',
              description: 'Filter skills by agent category'
            },
            min_usage: { 
              type: 'integer', 
              minimum: 1,
              description: 'Minimum number of agents offering this skill'
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 1000, 
              default: 100,
              description: 'Maximum number of skills to return'
            },
            search: { 
              type: 'string',
              description: 'Search term to filter skills by name'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            description: 'Successful response with skills',
            properties: {
              data: {
                type: 'array',
                description: 'Array of agent skills',
                items: {
                  type: 'object',
                  properties: {
                    skill: { type: 'string' },
                    displayName: { type: 'string' },
                    category: { type: 'string' },
                    agentCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: AgentSkillsQuery }>, reply: FastifyReply) => {
      try {
        let skills = await agentService.getAgentSkills();
        
        // Apply filters
        if (request.query.category) {
          skills = skills.filter(skill => skill.category === request.query.category);
        }
        
        if (request.query.min_usage) {
          skills = skills.filter(skill => skill.agentCount >= request.query.min_usage!);
        }
        
        if (request.query.search) {
          const searchTerm = request.query.search.toLowerCase();
          skills = skills.filter(skill => 
            skill.skill.toLowerCase().includes(searchTerm) ||
            skill.displayName.toLowerCase().includes(searchTerm)
          );
        }
        
        // Apply limit
        if (request.query.limit) {
          skills = skills.slice(0, request.query.limit);
        }

        return reply.code(200).send({
          data: skills
        });
      } catch (error) {
        request.log.error(error, 'Failed to get agent skills');
        throw fastify.httpErrors.internalServerError('Failed to retrieve agent skills');
      }
    }
  );
}

export default agentRoutes;