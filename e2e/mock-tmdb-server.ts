import { createServer } from '@mswjs/http-middleware';
import { handlers } from '../tests/msw/handlers';

const port = Number(process.env.MOCK_TMDB_PORT ?? 4010);

createServer(...handlers).listen(port, () => {
  console.log(`Mock do TMDB em http://localhost:${port}/3`);
});
