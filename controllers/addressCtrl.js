const Address = require('../models/addressSchema');

// Get all addresses for a user
const getAddresses = async (req, res) => {
    try {
      console.log('Session User:', req.session.user);
      if (!req.session.user) {
        return res.redirect('/login');
      }
      const addresses = await Address.find({ userId: req.session.user._id });
      console.log('Addresses:', addresses);
      res.render('user/address', { addresses });
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
  
// Delete an address
const deleteAddress = async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/login');
      }
      await Address.deleteOne({ _id: req.params.id, userId: req.session.user._id });
      console.log('Address deleted:', req.params.id);
      res.redirect('/address');
    } catch (err) {
      console.error('Error deleting address:', err);
      res.status(500).send(err.message);
    }
  };
  

module.exports = {
    getAddresses,
    addAddress,
    deleteAddress
}