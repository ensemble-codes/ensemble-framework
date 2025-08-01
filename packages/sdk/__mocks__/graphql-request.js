// Mock for graphql-request to avoid ESM issues in Jest

class GraphQLClient {
  constructor(url) {
    this.url = url;
    this.request = jest.fn();
  }
}

function gql(strings, ...values) {
  // Handle template literal: combine strings and values
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += values[i] + strings[i + 1];
  }
  return result;
}

module.exports = {
  GraphQLClient,
  gql
};