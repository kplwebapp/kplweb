const ApiError = require('../../utils/ApiError');
const contactRepository = require('./contact.repository');

const contactService = {
  submit: (data) => contactRepository.create(data),
  listAll: () => contactRepository.findAll(),
  updateStatus: async (id, status) => {
    const item = await contactRepository.updateStatus(id, status);
    if (!item) throw new ApiError(404, 'Contact message not found');
    return item;
  },
};

module.exports = contactService;
