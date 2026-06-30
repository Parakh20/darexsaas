import type {
  UserRole, ContactStatus, OpportunityStage, Channel, ConvStatus,
  Sentiment, Direction, MsgStatus, ChatRole, TaskStatus, Priority, WorkflowStatus,
} from "@prisma/client";

export type { UserRole, ContactStatus, OpportunityStage, Channel, ConvStatus, Sentiment, Direction, MsgStatus, ChatRole, TaskStatus, Priority, WorkflowStatus };

export interface SessionUser { id: string; tenantId: string; email: string; name: string | null; image: string | null; role: UserRole; }
export interface ApiOk<T> { success: true; data: T; }
export interface ApiError { success: false; error: string; code?: string; }
export type ApiResponse<T> = ApiOk<T> | ApiError;
export interface PaginatedData<T> { items: T[]; total: number; page: number; limit: number; hasMore: boolean; }
export interface TenantDto { id: string; name: string; slug: string; industry: string | null; website: string | null; phone: string | null; description: string | null; createdAt: string; }
export interface UserDto { id: string; tenantId: string; email: string; name: string | null; image: string | null; role: UserRole; createdAt: string; }
export interface ContactDto { id: string; tenantId: string; name: string; email: string | null; phone: string | null; company: string | null; position: string | null; status: ContactStatus; tags: string[]; notes: string | null; source: string | null; leadScore: number; createdAt: string; updatedAt: string; }
export interface CreateContactInput { name: string; email?: string; phone?: string; company?: string; position?: string; tags?: string[]; notes?: string; source?: string; }
export interface UpdateContactInput extends Partial<CreateContactInput> { status?: ContactStatus; leadScore?: number; }
export interface OpportunityDto { id: string; tenantId: string; contactId: string; contact?: ContactDto; title: string; value: number; currency: string; stage: OpportunityStage; probability: number; expectedCloseDate: string | null; notes: string | null; aiNextBestAction: string | null; aiNextBestActionAt: string | null; createdAt: string; updatedAt: string; }
export interface CreateOpportunityInput { contactId: string; title: string; value?: number; currency?: string; stage?: OpportunityStage; probability?: number; expectedCloseDate?: string; notes?: string; }
export interface UpdateOpportunityInput extends Partial<CreateOpportunityInput> { aiNextBestAction?: string; }
export interface MessageDto { id: string; conversationId: string; direction: Direction; body: string; mediaUrl: string | null; mediaType: string | null; senderName: string | null; senderPhone: string | null; status: MsgStatus; sentAt: string; }
export interface ConversationDto { id: string; tenantId: string; contactId: string | null; contact?: ContactDto; channel: Channel; externalId: string | null; subject: string | null; status: ConvStatus; aiSummary: string | null; aiIntent: string | null; aiSentiment: Sentiment | null; aiNextAction: string | null; aiAnalyzedAt: string | null; messages?: MessageDto[]; lastMessage?: MessageDto; messageCount?: number; createdAt: string; updatedAt: string; }
export interface ChatMessageDto { id: string; chatConversationId: string; role: ChatRole; content: string; toolCalls?: ToolCall[]; toolResults?: ToolResult[]; reasoning: string | null; createdAt: string; }
export interface ChatConversationDto { id: string; tenantId: string; userId: string; title: string; messages?: ChatMessageDto[]; createdAt: string; updatedAt: string; }
export interface TaskDto { id: string; tenantId: string; assigneeId: string | null; contactId: string | null; contact?: ContactDto; opportunityId: string | null; title: string; description: string | null; dueDate: string | null; status: TaskStatus; priority: Priority; aiGenerated: boolean; createdAt: string; updatedAt: string; }
export interface CreateTaskInput { assigneeId?: string; contactId?: string; opportunityId?: string; title: string; description?: string; dueDate?: string; priority?: Priority; aiGenerated?: boolean; }
export interface AuditLogDto { id: string; tenantId: string; userId: string | null; action: string; entityType: string | null; entityId: string | null; details: Record<string, unknown> | null; aiInitiated: boolean; createdAt: string; }
export interface AiAlert { id: string; type: "follow_up_due" | "high_value_lead" | "sentiment_negative" | "opportunity_stale"; message: string; entityId: string; entityType: string; severity: "info" | "warning" | "critical"; createdAt: string; }
export interface DashboardMetrics { activeOpportunities: number; revenuePipeline: number; pendingFollowUps: number; customerActivity: number; aiAlerts: AiAlert[]; opportunityByStage: { stage: OpportunityStage; count: number; value: number }[]; recentContacts: ContactDto[]; recentTasks: TaskDto[]; }
export interface ToolCall { id: string; name: string; args: Record<string, unknown>; }
export interface ToolResult { id: string; name: string; result: unknown; error?: string; }
export interface WhatsAppInboundMessage { from: string; id: string; timestamp: string; type: "text" | "image" | "audio" | "video" | "document"; text?: { body: string }; }
export interface WhatsAppWebhookPayload { object: string; entry: Array<{ id: string; changes: Array<{ value: { messaging_product: string; metadata: { display_phone_number: string; phone_number_id: string }; contacts?: Array<{ profile: { name: string }; wa_id: string }>; messages?: WhatsAppInboundMessage[]; statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>; }; field: string; }>; }>; }
export interface WorkflowStep { name: string; status: "pending" | "running" | "done" | "failed"; result?: unknown; error?: string; executedAt?: string; }
export interface WorkflowRunDto { id: string; tenantId: string; workflowKey: string; entityId: string | null; entityType: string | null; status: WorkflowStatus; steps: WorkflowStep[]; result: Record<string, unknown> | null; error: string | null; startedAt: string; completedAt: string | null; }
