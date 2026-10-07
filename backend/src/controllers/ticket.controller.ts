import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import TicketMessage from '../models/TicketMessage';
import { NotFoundError } from '../utils/errors';
import { getIO } from '../sockets';

export const createTicket = async (req: Request, res: Response) => {
  const { subject, reason, shopId, bookingId } = req.body;
  const userId = req.user!.id;

  const ticketData: any = {
    userId,
    subject,
    reason,
  };

  if (shopId) ticketData.shopId = shopId;
  if (bookingId) ticketData.bookingId = bookingId;

  const ticket = await Ticket.create(ticketData);

  res.status(201).json(ticket);
};

export const getMyTickets = async (req: Request, res: Response) => {
  const tickets = await Ticket.find({ userId: req.user!.id })
    .populate('shopId', 'name')
    .populate('bookingId', 'date startTime endTime status totalPrice')
    .sort({ createdAt: -1 });

  res.json(tickets);
};

export const getTicketMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = await Ticket.findOne({ _id: id as string, userId: req.user!.id });
  
  if (!ticket) {
    throw new NotFoundError('Ticket not found or unauthorized');
  }

  const messages = await TicketMessage.find({ ticketId: id as string })
    .populate('senderId', 'name email avatar')
    .sort({ createdAt: 1 });
  
  res.json(messages);
};

export const sendTicketMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user!.id;

  const ticket = await Ticket.findOne({ _id: id as string, userId });
  if (!ticket) {
    throw new NotFoundError('Ticket not found or unauthorized');
  }

  const message = await TicketMessage.create({
    ticketId: id as string,
    senderId: userId,
    isAdmin: false,
    text,
    read: false,
  });

  const populatedMessage = await message.populate('senderId', 'name email avatar');

  try {
    getIO().to(`ticket_${id}`).emit('newMessage', populatedMessage);
  } catch (err) {
    console.error('Socket error emitting message:', err);
  }

  res.status(201).json(populatedMessage);
};
