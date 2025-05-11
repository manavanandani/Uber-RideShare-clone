const { Admin } = require('../models/admin');
const { redis } = require('../config/redis');
const { CustomError } = require('../../../shared/utils/errors');

const AdminService = {
  async getAllAdmins() {
    const cached = await redis.get('admins:all');
    if (cached) return JSON.parse(cached);
    const admins = await Admin.find().select('-password');
    await redis.set('admins:all', JSON.stringify(admins), 'EX', 3600);
    return admins;
  },

  async getAdminById(admin_id) {
    const cached = await redis.get(`admins:${admin_id}`);
    if (cached) return JSON.parse(cached);
    const admin = await Admin.findOne({ admin_id }).select('-password');
    if (admin) await redis.set(`admins:${admin_id}`, JSON.stringify(admin), 'EX', 3600);
    return admin;
  },

  async createAdmin(data) {
    try {
      const admin = new Admin(data);
      await admin.save();
      const responseAdmin = admin.toObject();
      delete responseAdmin.password;
      return responseAdmin;
    } catch (error) {
      if (error.code === 11000) {
        throw new CustomError('Admin already exists with this ID, email, or phone', 400);
      }
      throw new CustomError(error.message || 'Failed to create admin', 400);
    }
  },

  async updateAdmin(admin_id, data) {
    try {
      if (data.email || data.phone) {
        const existingAdmin = await Admin.findOne({
          $or: [
            { email: data.email, admin_id: { $ne: admin_id } },
            { phone: data.phone, admin_id: { $ne: admin_id } },
          ],
        });
        if (existingAdmin) {
          throw new CustomError('Email or phone number already in use by another admin', 400);
        }
      }
      const admin = await Admin.findOneAndUpdate(
        { admin_id },
        { $set: data },
        { new: true, runValidators: true }
      );
      if (!admin) return null;
      const responseAdmin = admin.toObject();
      delete responseAdmin.password;
      return responseAdmin;
    } catch (error) {
      throw new CustomError(error.message || 'Failed to update admin', 400);
    }
  },

  async deleteAdmin(admin_id) {
    return await Admin.findOneAndDelete({ admin_id });
  },
};

module.exports = AdminService;