const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin not authorized' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Token missing, authorization denied' });
  }
};

const protectCustomer = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.customer = await Customer.findById(decoded.id).select('-password');
      
      if (!req.customer) {
        return res.status(401).json({ message: 'Customer not authorized' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Token missing, authorization denied' });
  }
};

module.exports = { protectAdmin, protectCustomer };