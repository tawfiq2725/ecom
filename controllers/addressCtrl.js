const Address = require('../models/addressSchema');

// Get all addresses for a user
const getAddresses = async (req, res) => {
  try {
    console.log('Session User:', req.session.user);
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default to 10 addresses per page
    const skip = (page - 1) * limit;

    const totalAddresses = await Address.countDocuments({ userId }); // Count total addresses
    const addresses = await Address.find({ userId })
      .sort({ createdAt: -1 }) // Sort addresses by date
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalAddresses / limit);

    res.render('user/address', {
      addresses,
      title: "Address Page",
      currentPage: page,
      totalPages,
      limit
    });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).send(err.message);
  }
};

// Add a new address
const addAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    console.log('Request Body:', req.body);
    const address = new Address({
      userId: req.session.user._id,
      place: req.body.place,
      houseNumber: req.body.houseNumber,
      street: req.body.street,
      city: req.body.city,
      zipcode: req.body.zipcode,
      country: req.body.country
    });
    await address.save();
    console.log('Address added:', address);
    res.redirect('/address');
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).send(err.message);
  }
};

// address to edit
const getEditAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    const address = await Address.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (!address) {
      return res.status(404).send('Address not found');
    }
    res.render('user/editAddress', { address });
  } catch (err) {
    console.error('Error fetching address to edit:', err);
    res.status(500).send(err.message);
  }
};

// Update an address
const updateAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    const addressData = {
      place: req.body.place,
      houseNumber: req.body.houseNumber,
      street: req.body.street,
      city: req.body.city,
      zipcode: req.body.zipcode,
      country: req.body.country
    };
    await Address.updateOne({ _id: req.params.id, userId: req.session.user._id }, addressData);
    console.log('Address updated:', req.params.id);
    res.redirect('/address');
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).send(err.message);
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    await Address.deleteOne({ _id: req.params.id, userId: req.session.user._id });
    console.log('Address deleted:', req.params.id);
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ message: 'Error deleting address' });
  }
};


module.exports = {
  getAddresses,
  addAddress,
  deleteAddress,
  getEditAddress,
  updateAddress
}