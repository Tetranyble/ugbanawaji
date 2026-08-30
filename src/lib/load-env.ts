import { config } from "dotenv";

const environmentFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";

config({ path: environmentFile, quiet: true });
config({ path: ".env", quiet: true });
