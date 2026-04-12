export interface MessageCreatedEvent {
  _id: string;
  content: string;
  type: string;
  sender: string;
  receiver: string;
  multimediaId?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}
