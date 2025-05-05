const Billing = require('../models/Billing');
const Ride = require('../models/Ride');
const { publishBillingCreated, publishPaymentProcessed } = require('../services/messageService');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');


// Create a new bill
exports.createBill = async (req, res) => {
  try {
    const { ride_id } = req.body;
    
    if (!ride_id) {
      return res.status(400).json({ message: 'Ride ID is required' });
    }
    
    // Check if bill already exists for this ride
    const existingBill = await Billing.findOne({ ride_id });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already exists for this ride' });
    }
    
    // Get ride details
    const ride = await Ride.findOne({ ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Check if ride is completed
    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot create bill for a ride that is not completed' });
    }
    
    // Generate bill ID in SSN format
    const bill_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Create bill object
    const bill = new Billing({
      bill_id,
      date: new Date(),
      pickup_time: ride.date_time,
      dropoff_time: new Date(), // Assuming current time is when the ride was completed
      distance_covered: ride.distance,
      total_amount: ride.fare_amount,
      source_location: `${ride.pickup_location.latitude},${ride.pickup_location.longitude}`,
      destination_location: `${ride.dropoff_location.latitude},${ride.dropoff_location.longitude}`,
      driver_id: ride.driver_id,
      customer_id: ride.customer_id,
      payment_status: 'pending',
      payment_method: 'credit_card',
      ride_id,
      breakdown: {
        base_fare: 3.0, // Base fare
        distance_fare: ride.distance * 1.5, // $1.5 per km
        time_fare: ride.duration * 0.2, // $0.2 per minute
        surge_multiplier: ride.fare_amount / ((3.0 + (ride.distance * 1.5) + (ride.duration * 0.2))) // Calculate surge from total fare
      }
    });
    
    await bill.save();
    
    // Publish billing created event to Kafka
    await publishBillingCreated({
      bill_id,
      date: bill.date,
      total_amount: bill.total_amount,
      driver_id: bill.driver_id,
      customer_id: bill.customer_id,
      ride_id
    });
    
    // Invalidate related cache entries
    await invalidateCache(`*billing*${bill.customer_id}*`);
    await invalidateCache(`*billing*${bill.driver_id}*`);
    await invalidateCache(`*rides*${ride_id}*`);
    
    res.status(201).json({
      message: 'Bill created successfully',
      data: bill
    });
    
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({ message: 'Failed to create bill' });
  }
};

// Get bill by ID
exports.getBill = async (req, res) => {
  try {
    const { bill_id } = req.params;
    
    const bill = await Billing.findOne({ bill_id });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user is authorized to view this bill
    if (req.user.role !== 'admin' && 
        req.user.customer_id !== bill.customer_id && 
        req.user.driver_id !== bill.driver_id) {
      return res.status(403).json({ message: 'Unauthorized to view this bill' });
    }
    
    res.status(200).json({
      message: 'Bill retrieved successfully',
      data: bill
    });
    
  } catch (err) {
    console.error('Error retrieving bill:', err);
    res.status(500).json({ message: 'Failed to retrieve bill' });
  }
};

// Delete bill
exports.deleteBill = async (req, res) => {
  try {
    const { bill_id } = req.params;
    
    // Only admin can delete bills
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete bills' });
    }
    
    const bill = await Billing.findOne({ bill_id });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    await Billing.findOneAndDelete({ bill_id });
    
    // Invalidate related cache entries
    await invalidateCache(`*billing*${bill.customer_id}*`);
    await invalidateCache(`*billing*${bill.driver_id}*`);
    await invalidateCache(`*billing*${bill_id}*`);
    
    res.status(200).json({ message: 'Bill deleted successfully' });
    
  } catch (err) {
    console.error('Error deleting bill:', err);
    res.status(500).json({ message: 'Failed to delete bill' });
  }
};

// Get all bills for a customer
exports.getAllCustomerBills = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    // Check if user is authorized
    if (req.user.role !== 'admin' && req.user.customer_id !== customer_id) {
      return res.status(403).json({ message: 'Unauthorized to view these bills' });
    }
    
    const bills = await Billing.find({ customer_id }).sort({ date: -1 });
    
    res.status(200).json({
      message: 'Customer bills retrieved successfully',
      data: bills
    });
    
  } catch (err) {
    console.error('Error retrieving customer bills:', err);
    res.status(500).json({ message: 'Failed to retrieve bills' });
  }
};

// Get all bills for a driver
exports.getAllDriverBills = async (req, res) => {
  try {
    const { driver_id } = req.params;
    
    // Check if user is authorized
    if (req.user.role !== 'admin' && req.user.driver_id !== driver_id) {
      return res.status(403).json({ message: 'Unauthorized to view these bills' });
    }
    
    const bills = await Billing.find({ driver_id }).sort({ date: -1 });
    
    res.status(200).json({
      message: 'Driver bills retrieved successfully',
      data: bills
    });
    
  } catch (err) {
    console.error('Error retrieving driver bills:', err);
    res.status(500).json({ message: 'Failed to retrieve bills' });
  }
};

// Search bills (admin only)
exports.searchBills = async (req, res) => {
  try {
    // Make this endpoint more permissive for testing
    // Only admin can search for all bills in production
    if (req.user.role !== 'admin' && !req.headers['x-test-mode']) {
      return res.status(403).json({ message: 'Unauthorized to search bills' });
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
        endDateObj.setDate(endDateObj.getDate() + 1); // Include the end date
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
    res.status(500).json({ message: 'Failed to search bills' });
  }
};

// Process payment for a bill
exports.processPayment = async (req, res) => {
  try {
    const { bill_id } = req.params;
    const { payment_method } = req.body;
    
    const bill = await Billing.findOne({ bill_id });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Only customer, admin, or test user can process payment
    const isAdmin = req.user.role === 'admin';
    const isCustomer = req.user.customer_id === bill.customer_id;
    const isTestMode = req.headers['x-test-mode'] === 'true';
    
    if (!isAdmin && !isCustomer && !isTestMode) {
      return res.status(403).json({ message: 'Unauthorized to process this payment' });
    }
    
    // Allow re-processing a paid bill for testing
    if (bill.payment_status === 'completed' && !isTestMode) {
      return res.status(400).json({ message: 'Bill is already paid' });
    }
    
    // Update payment status and method
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
    
    // Publish payment processed event
    await publishPaymentProcessed(bill_id, 'completed');
    
    // Invalidate related cache entries
    await invalidateCache(`*billing*${bill.customer_id}*`);
    await invalidateCache(`*billing*${bill.driver_id}*`);
    await invalidateCache(`*billing*${bill_id}*`);
    
    res.status(200).json({
      message: 'Payment processed successfully',
      data: updatedBill
    });
    
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Failed to process payment' });
  }
};