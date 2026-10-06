import { createAskHandler } from "../../lib/assistant";
export const config = { api: { bodyParser: { sizeLimit: "4kb" } } };
export default createAskHandler();
