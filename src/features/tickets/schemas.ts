import { z } from "zod";

export const attachmentInputSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative().default(0),
  mimeType: z.string().default("image/png"),
  url: z.string().optional(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  description: z.string().min(10, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  componentId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  customerId: z.string().optional(),
  assigneeId: z.string().optional(),
  accountCompany: z.string().optional(),
  attachments: z.array(attachmentInputSchema).optional(),
  source: z.enum(["PORTAL", "WHATSAPP"]).default("PORTAL"),
  preferredTicketNumber: z.string().optional(),
  skipAutoReply: z.boolean().optional(),
  /** Partner portal: notify the selected POC on WhatsApp */
  notifyWhatsApp: z.boolean().optional(),
});

export const replySchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1, "Message is required"),
  isInternal: z.boolean().default(false),
  asAgent: z.boolean().default(false),
  attachments: z.array(attachmentInputSchema).optional(),
});

export const updateTicketSchema = z.object({
  ticketId: z.string(),
  subject: z.string().min(3).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  /** Whole days SLA target entered by the support agent (e.g. 2 = 2 days). */
  slaDays: z.coerce.number().int().min(0).max(365).optional(),
  componentId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
