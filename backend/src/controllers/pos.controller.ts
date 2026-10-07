import { Request, Response } from 'express';
import Shop from '../models/Shop';
import Branch from '../models/Branch';
import Invoice from '../models/Invoice';
import Expense from '../models/Expense';
import Booking, { BookingStatus } from '../models/Booking';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

const paramId = (value: string | string[] | undefined) => {
  if (!value) throw new BadRequestError('معرّف ناقص');
  return Array.isArray(value) ? value[0]! : value;
};

const assertOwnerShop = async (shopId: string, ownerId: string) => {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new NotFoundError('الصالون غير موجود');
  if (shop.ownerId.toString() !== ownerId) throw new ForbiddenError('غير مصرح');
  return shop;
};

const nextInvoiceNumber = async (shopId: string) => {
  const count = await Invoice.countDocuments({ shopId });
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${stamp}-${String(count + 1).padStart(4, '0')}`;
};

export const createPosInvoice = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const shop = await assertOwnerShop(shopId, req.user!.id);
  const {
    branchId,
    customerName,
    customerPhone,
    userId,
    items,
    paymentMethod = 'cash',
    discountAmount = 0,
    notes,
    markBookingsPaid = [],
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('أضف بنداً واحداً على الأقل للفاتورة');
  }

  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, shopId, isActive: true });
    if (!branch) throw new BadRequestError('الفرع غير صالح');
  }

  const normalized = items.map((item: any) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.unitPrice);
    if (!item.name || !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new BadRequestError('كل بند يحتاج اسماً وسعراً صالحاً');
    }
    return {
      type: item.type || 'custom',
      name: String(item.name),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      serviceId: item.serviceId,
      staffId: item.staffId,
    };
  });

  const subtotal = normalized.reduce((sum: number, i: any) => sum + i.total, 0);
  const discount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal);
  const total = subtotal - discount;

  const invoice = await Invoice.create({
    shopId,
    ownerId: req.user!.id,
    branchId: branchId || undefined,
    invoiceNumber: await nextInvoiceNumber(shopId),
    customerName,
    customerPhone,
    userId: userId || undefined,
    items: normalized,
    subtotal,
    discountAmount: discount,
    total,
    paymentMethod: paymentMethod === 'card' ? 'card' : 'cash',
    paymentStatus: 'paid',
    notes,
    bookingIds: Array.isArray(markBookingsPaid) ? markBookingsPaid : [],
  });

  if (Array.isArray(markBookingsPaid) && markBookingsPaid.length) {
    await Booking.updateMany(
      { _id: { $in: markBookingsPaid }, shopId },
      {
        $set: {
          paymentStatus: 'paid',
          paymentMethod: paymentMethod === 'card' ? 'card' : 'cash',
          status: BookingStatus.COMPLETED,
        },
      }
    );
  }

  res.status(201).json(invoice);
};

export const listInvoices = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  await assertOwnerShop(shopId, req.user!.id);
  const { branchId } = req.query;
  const filter: any = { shopId };
  if (branchId) filter.branchId = branchId;
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(invoices);
};

export const getInvoice = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const invoiceId = paramId(req.params.invoiceId);
  await assertOwnerShop(shopId, req.user!.id);
  const invoice = await Invoice.findOne({ _id: invoiceId as any, shopId })
    .populate('branchId', 'name')
    .populate('items.staffId', 'name');
  if (!invoice) throw new NotFoundError('الفاتورة غير موجودة');
  res.json(invoice);
};

export const createExpense = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  await assertOwnerShop(shopId, req.user!.id);
  const { branchId, category, amount, note, date } = req.body;

  if (!category || amount == null) {
    throw new BadRequestError('التصنيف والمبلغ مطلوبان');
  }

  const expense = await Expense.create({
    shopId,
    ownerId: req.user!.id,
    branchId: branchId || undefined,
    category: String(category).trim(),
    amount: Number(amount),
    note,
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json(expense);
};

export const listExpenses = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  await assertOwnerShop(shopId, req.user!.id);
  const { branchId } = req.query;
  const filter: any = { shopId };
  if (branchId) filter.branchId = branchId;
  const expenses = await Expense.find(filter).sort({ date: -1 }).limit(200);
  res.json(expenses);
};

export const deleteExpense = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  const expenseId = paramId(req.params.expenseId);
  await assertOwnerShop(shopId, req.user!.id);
  const expense = await Expense.findOneAndDelete({ _id: expenseId as any, shopId });
  if (!expense) throw new NotFoundError('المصروف غير موجود');
  res.json({ message: 'تم الحذف' });
};

export const posSummary = async (req: Request, res: Response) => {
  const shopId = paramId(req.params.shopId);
  await assertOwnerShop(shopId, req.user!.id);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [todayInvoices, todayExpenses] = await Promise.all([
    Invoice.find({ shopId, createdAt: { $gte: start }, paymentStatus: 'paid' }),
    Expense.find({ shopId, date: { $gte: start } }),
  ]);

  const sales = todayInvoices.reduce((s, i) => s + i.total, 0);
  const expenses = todayExpenses.reduce((s, e) => s + e.amount, 0);

  res.json({
    date: start.toISOString(),
    invoiceCount: todayInvoices.length,
    sales,
    expenses,
    net: sales - expenses,
  });
};
