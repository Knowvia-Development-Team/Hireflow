export const DB_MODE = (process.env.DB_MODE ?? 'postgres').toLowerCase();
export const isMemoryDb = DB_MODE === 'memory' || DB_MODE === 'sqlite';
