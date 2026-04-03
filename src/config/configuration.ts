import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  app: {
    name: string;
    port: number;
    env: string;
  };
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  dify: {
    baseUrl: string;
    apiKey: string;
    appId: string;
    timeout: number;
  };
  log: {
    level: string;
    format: string;
  };
}

function interpolateEnvVars(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    const match = obj.match(/^\$\{(\w+)\}$/);
    if (match) {
      const envVar = match[1];
      return process.env[envVar] ?? obj;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateEnvVars(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateEnvVars(value);
    }
    return result;
  }

  return obj;
}

function loadYamlConfig(): AppConfig {
  const configPath = path.resolve(process.cwd(), 'config', 'default.yaml');
  const fileContents = fs.readFileSync(configPath, 'utf8');
  const rawConfig = yaml.load(fileContents) as Record<string, unknown>;
  const configWithEnv = interpolateEnvVars(rawConfig) as AppConfig;
  return configWithEnv;
}

export const configuration = () => {
  return loadYamlConfig();
};

export default configuration;