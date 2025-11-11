import { context } from "@devvit/web/client";
import { makeClientConfig, ClientConfig } from "../shared/makeClientConfig";

export const IS_PROD = context.subredditName === "syllo";

console.log("IS_PROD:", IS_PROD);

export const CONFIG: ClientConfig = makeClientConfig(IS_PROD);
