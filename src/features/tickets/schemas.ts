import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  description: z.string().min(10, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  componentId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  customerId: z.string().optional(),
  assigneeId: z.string().optional(),
  accountCompany: z.string().optional(),
});

export const replySchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1, "Message is required"),
  isInternal: z.boolean().default(false),
  asAgent: z.boolean().default(false),
});

export const updateTicketSchema = z.object({
  ticketId: z.string(),
  subject: z.string().min(3).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  componentId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
