export * from './organizations/index.js';
export * from './delegates/index.js';
export * from './delegators/index.js';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
} 