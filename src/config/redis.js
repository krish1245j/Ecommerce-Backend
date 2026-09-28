import { Redis } from "@upstash/redis";
import config from "./config.js";
const client = new Redis({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
});

export default client;

