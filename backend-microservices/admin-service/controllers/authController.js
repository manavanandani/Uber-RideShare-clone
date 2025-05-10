const jwt = require('../utils/jwt'); 
const Admin = require('../models/Admin');

// Admin login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.generateToken(admin.admin_id);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      data: {
        admin_id: admin.admin_id,
        name: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current admin profile
exports.getCurrentUser = async (req, res) => {
  try {
    const admin = await Admin.findOne({ admin_id: req.user.admin_id }).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin profile retrieved successfully',
      data: {
        ...admin.toObject(),
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Error retrieving admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
