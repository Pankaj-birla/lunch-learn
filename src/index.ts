import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { cors } from 'hono/cors';

interface Env {
  DATABASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',              // apply to all routes
  cors({
    origin: '*' ,   // or ['http://localhost:5174'] in development
    allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowHeaders: ['Content-Type','Authorization'],
  })
)

const createPrismaClient = (datasourceUrl: string) =>
  new PrismaClient({
    datasourceUrl,
  }).$extends(withAccelerate());

app.post('/todo', async (c) => {
  const DATABASE_URL = c.env.DATABASE_URL;
  console.log('DATABASE_URL:', DATABASE_URL); // Debug log
  if (!DATABASE_URL) {
    return c.json({ error: 'DATABASE_URL is not set in the environment' }, 500);
  }

  const body: {
    title: string;
    description: string;
    completed?: boolean;
  } = await c.req.json();

  const prisma = createPrismaClient(DATABASE_URL);

  const todo = await prisma.todo.create({
    data: {
      title: body.title,
      description: body.description,
      completed: body.completed ?? false,
    },
  });

  return c.json(todo, 200);
});

app.get('/todos', async (c) => {
  const DATABASE_URL = c.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return c.json({ error: 'DATABASE_URL is not set in the environment' }, 500);
  }

  const prisma = createPrismaClient(DATABASE_URL);
  const todos = await prisma.todo.findMany();
  return c.json(todos);
});

export default app;