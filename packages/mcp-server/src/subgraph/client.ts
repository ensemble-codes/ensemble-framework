import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated';
import { config } from '../config';

// Get subgraph URL from configuration
const SUBGRAPH_URL = config.subgraph.url;

export const graphQLClient = new GraphQLClient(SUBGRAPH_URL);
export const subgraphClient = getSdk(graphQLClient);