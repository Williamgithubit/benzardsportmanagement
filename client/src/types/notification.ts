export interface Notification {
  id: string;
  type: "blog" | "athlete" | "event" | "contact" | "system" | string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  read?: boolean;
  recipientRole?: string; // 'admin'|'manager'|'media' etc.
  createdAt?: Date | string;
}
