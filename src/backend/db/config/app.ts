//src/backend/db/config/app.ts
import dotenv from 'dotenv';

dotenv.config();

const EXPECTED_VARIABLES = <const>[
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'NODE_ENV',
];

type ExpectedVariables = (typeof EXPECTED_VARIABLES)[number];

export type AppProcessEnv = {
  [key in ExpectedVariables]: string;
} & {
  NODE_ENV: 'production' | 'development';
};

const config = Object.fromEntries(
  EXPECTED_VARIABLES.map((variable) => {
    return [variable as ExpectedVariables, throwIfNot(process.env, variable)];
  })
) as AppProcessEnv;

function throwIfNot<T, K extends keyof T>(obj: Partial<T>, prop: K): T[K] {
  if (obj[prop] === undefined || obj[prop] === null) {
    throw new Error(`Environment is missing variable: ${prop.toString()}`);
  } else {
    return obj[prop] as T[K];
  }
}

export default config;
export const isProduction = config.NODE_ENV === 'production';
