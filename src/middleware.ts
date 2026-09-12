import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  console.log('Visitor UA:', context.request.headers.get('user-agent'));
  return next();
});
