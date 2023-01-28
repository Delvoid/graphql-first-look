import 'graphql-import-node';
import fastify from 'fastify';
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  Request,
  sendResult,
  shouldRenderGraphiQL,
} from 'graphql-helix';
import { schema } from './schema';
import { contextFactory } from './context';

async function main() {
  const server = fastify();

  server.route({
    method: ['POST', 'GET'],
    url: '/graphql',
    handler: async (req, reply) => {
      const request: Request = {
        headers: req.headers,
        method: req.method,
        query: req.query,
        body: req.body,
      };
      if (shouldRenderGraphiQL(request)) {
        reply.header('Content-Type', 'text/html');
        reply.send(
          renderGraphiQL({
            endpoint: '/graphql',
          })
        );

        return;
      }

      const { operationName, query, variables } = getGraphQLParameters(request);

      const result = await processRequest({
        request,
        schema,
        operationName,
        contextFactory: () => contextFactory(req),
        query,
        variables,
      });

      sendResult(result, reply.raw);
    },
  });

  // Run the server!
  server.listen({ port: 3000 }, function (err, address) {
    if (err) {
      console.log(err);
      server.log.error(err);
      process.exit(1);
    }
    // Server is now listening on ${address}
    console.log(`Server is running on ${address}`);
  });
}

main();
