export const DB_NAME = "blog";
export const DB_USER = Deno.env.get("DB_USER");
export const DB_PASSWORD = Deno.env.get("DB_PASSWORD");
export const DB_PATH = Deno.env.get("DB_PATH");
export const DB_SEC_MECHANISM = "SCRAM-SHA-1";
