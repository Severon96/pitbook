export * from './client';
export * from './schema';

// Re-export schema as a named export for better type inference
import * as allSchema from './schema';
export { allSchema as dbSchema };
