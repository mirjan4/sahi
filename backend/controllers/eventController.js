const Event = require('../models/Event');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      const matchingCats = await Category.find({ name: searchRegex }).select('_id');
      const catIds = matchingCats.map((c) => c._id);
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { category: { $in: catIds } }
      ];
    }

    let sort = 'name';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await Event.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const events = await Event.find(filter)
        .populate('category')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        events,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const events = await Event.find(filter).populate('category').sort(sort);
      res.json({ success: true, events });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('category');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  const { name, code, category, type, points } = req.body;

  try {
    const codeExists = await Event.findOne({ code: code.toUpperCase() });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'Event code already exists' });
    }

    const event = await Event.create({
      name,
      code: code.toUpperCase(),
      category,
      type: type || 'single',
      points,
    });
    
    await logAction(req.user._id, 'CREATE_EVENT', `Created event ${name} (${code.toUpperCase()})`, req);

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  const { name, code, category, type, points } = req.body;

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (code && code.toUpperCase() !== event.code) {
      const codeExists = await Event.findOne({ code: code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Event code already exists' });
      }
      event.code = code.toUpperCase();
    }

    event.name = name || event.name;
    event.category = category || event.category;
    event.type = type || event.type;
    if (points) {
      event.points = { ...event.points, ...points };
    }

    const updatedEvent = await event.save();
    await logAction(req.user._id, 'UPDATE_EVENT', `Updated event ${event.name}`, req);

    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_EVENT', `Deleted event ${event.name}`, req);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
