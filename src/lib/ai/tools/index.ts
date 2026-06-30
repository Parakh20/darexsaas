export { searchContactsTool } from "./searchContacts";
export { createTaskTool } from "./createTask";
export { updateOpportunityTool } from "./updateOpportunity";
export { sendWhatsAppTool } from "./sendWhatsApp";
export { fetchBusinessMetricsTool } from "./fetchMetrics";

import { searchContactsTool } from "./searchContacts";
import { createTaskTool } from "./createTask";
import { updateOpportunityTool } from "./updateOpportunity";
import { sendWhatsAppTool } from "./sendWhatsApp";
import { fetchBusinessMetricsTool } from "./fetchMetrics";

export const ALL_TOOLS = [searchContactsTool, createTaskTool, updateOpportunityTool, sendWhatsAppTool, fetchBusinessMetricsTool];
