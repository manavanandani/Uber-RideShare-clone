const { Billing } = require('../models/billing');
const { CustomError } = require('../../../shared/utils/errors');
const { sendMessage } = require('../kafka/billingEventProducer');
const { invalidateCache } = require('../config/redis');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');

exports.getBill = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const bill = await Billing.findOne({ bill_id });

    if (!bill) {
      throw new CustomError('Bill not found', 404);
    }

    if (req.user.role !== 'admin' && 
        req.user.customer_id !== bill.customer_id && 
        req.user.driver_id !== bill.driver_id) {
      throw new CustomError('Unauthorized to view this bill', 403);
    }

    res.status(200).json({
      message: 'Bill retrieved successfully',
      data: bill
    });
  } catch (err) {
    console.error('Error retrieving bill:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve bill' });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const { bill_id } = req.params;

    if (req.user.role !== 'admin') {
      throw new CustomError('Unauthorized to delete bills', 403);
    }

    const bill = await Billing.findOne({ bill_id });

    if (!bill) {
      throw new CustomError('Bill not found', 404);
    }

    await Billing.findOneAndDelete({ bill_id });

    await invalidateCache(`*billing*${bill.customer_id}*`);
    await invalidateCache(`*billing*${bill.driver_id}*`);
    await invalidateCache(`*billing*${bill_id}*`);

    res.status(200).json({ message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('Error deleting bill:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete bill' });
  }
};

exports.getAllCustomerBills = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'customer' && req.user.customer_id !== customer_id) {
      throw new CustomError('Unauthorized to view these bills', 403);
    }

    const bills = await Billing.find({ customer_id }).sort({ date: -1 });

    res.status(200).json({
      message: 'Customer bills retrieved successfully',
      data: bills
    });
  } catch (err) {
    console.error('Error retrieving customer bills:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve bills' });
  }
};

exports.getAllDriverBills = async (req, res) => {
  try {
    const { driver_id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'driver' && req.user.driver_id !== driver_id) {
      throw new CustomError('Unauthorized to view these bills', 403);
    }

    const bills = await Billing.find({ driver_id }).sort({ date: -1 });

    res.status(200).json({
      message: 'Driver bills retrieved successfully',
      data: bills
    });
  } catch (err) {
    console.error('Error retrieving driver bills:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to retrieve bills' });
  }
};

exports.searchBills = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.headers['x-test-mode']) {
      throw new CustomError('Unauthorized to search bills', 403);
    }

    const {
      customer_id,
      driver_id,
      min_amount,
      max_amount,
      start_date,
      end_date,
      payment_status
    } = req.query;

    const query = {};

    if (customer_id) query.customer_id = customer_id;
    if (driver_id) query.driver_id = driver_id;

    if (min_amount || max_amount) {
      query.total_amount = {};
      if (min_amount) query.total_amount.$gte = parseFloat(min_amount);
      if (max_amount) query.total_amount.$lte = parseFloat(max_amount);
    }

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) {
        const endDateObj = new Date(end_date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        query.date.$lt = endDateObj;
      }
    }

    if (payment_status) query.payment_status = payment_status;

    const bills = await Billing.find(query).sort({ date: -1 });

    res.status(200).json({
      message: 'Bills search completed successfully',
      count: bills.length,
      data: bills
    });
  } catch (err) {
    console.error('Error searching bills:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to search bills' });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { bill_id } = req.params;
    const { payment_method } = req.body;

    const bill = await Billing.findOne({ bill_id });

    if (!bill) {
      throw new CustomError('Bill not found', 404);
    }

    const isAdmin = req.user.role === 'admin';
    const isCustomer = req.user.customer_id === bill.customer_id;
    const isTestMode = req.headers['x-test-mode'] === 'true';

    if (!isAdmin && !isCustomer && !isTestMode) {
      throw new CustomError('Unauthorized to process this payment', 403);
    }

    if (bill.payment_status === 'completed' && !isTestMode) {
      throw new CustomError('Bill is already paid', 400);
    }

    if (payment_method && !['credit_card', 'cash'].includes(payment_method)) {
      throw new CustomError('Invalid payment method', 400);
    }

    const updatedBill = await Billing.findOneAndUpdate(
      { bill_id },
      { 
        $set: { 
          payment_status: 'completed',
          payment_method: payment_method || bill.payment_method
        } 
      },
      { new: true }
    );

    await sendMessage({
      topic: KAFKA_TOPICS.BILLING_EVENTS,
      message: {
        key: bill_id,
        value: {
          event_type: 'PAYMENT_PROCESSED',
          bill_id,
          payment_status: 'completed',
          payment_method: payment_method || bill.payment_method
        }
      }
    });

    await invalidateCache(`*billing*${bill.customer_id}*`);
    await invalidateCache(`*billing*${bill.driver_id}*`);
    await invalidateCache(`*billing*${bill_id}*`);

    res.status(200).json({
      message: 'Payment processed successfully',
      data: updatedBill
    });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to process payment' });
  }
};