const Result = require('../models/Result');
const Event = require('../models/Event');
const Unit = require('../models/Unit');
const Participant = require('../models/Participant');
const { logAction } = require('../utils/auditLogger');

// Helper to recalculate overall points for all units - Disabled under new TEAM TOTAL POINT SYSTEM
const recalculateUnitPoints = async () => {
  // Points are updated manually by admin now
  return;
};

// @desc    Get all results
// @route   GET /api/results
// @access  Public
const getResults = async (req, res) => {
  try {
    const filter = {};
    // Allow public users to only see published results unless logged in as admin
    if (!req.query.all || req.query.all === 'false') {
      filter.isPublished = true;
    }
    if (req.query.event) {
      filter.event = req.query.event;
    }
    if (req.query.category) {
      const eventsInCat = await Event.find({ category: req.query.category }).select('_id');
      const eventIds = eventsInCat.map(e => e._id);
      filter.event = { $in: eventIds };
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      const [matchingEvents, matchingParticipants] = await Promise.all([
        Event.find({ $or: [{ name: searchRegex }, { code: searchRegex }] }).select('_id'),
        Participant.find({ name: searchRegex }).select('_id')
      ]);
      const eventIds = matchingEvents.map(e => e._id);
      const participantIds = matchingParticipants.map(p => p._id);
      filter.$or = [
        { event: { $in: eventIds } },
        { 'winners.participant': { $in: participantIds } }
      ];
    }

    let sort = '-updatedAt';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await Result.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const results = await Result.find(filter)
        .populate({
          path: 'event',
          populate: { path: 'category' },
        })
        .populate({
          path: 'winners.participant',
          populate: { path: 'unit' },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        results,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const results = await Result.find(filter)
        .populate({
          path: 'event',
          populate: { path: 'category' },
        })
        .populate({
          path: 'winners.participant',
          populate: { path: 'unit' },
        })
        .sort(sort);
      res.json({ success: true, results });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single result by ID
// @route   GET /api/results/:id
// @access  Public
const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({
        path: 'event',
        populate: { path: 'category' },
      })
      .populate({
        path: 'winners.participant',
        populate: { path: 'unit' },
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get result by Event ID
// @route   GET /api/results/event/:eventId
// @access  Public
const getResultByEventId = async (req, res) => {
  try {
    const result = await Result.findOne({ event: req.params.eventId })
      .populate({
        path: 'event',
        populate: { path: 'category' },
      })
      .populate({
        path: 'winners.participant',
        populate: { path: 'unit' },
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found for this event' });
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update result for an event
// @route   POST /api/results
// @access  Private/Admin
const createOrUpdateResult = async (req, res) => {
  const { eventId, winners, isPublished } = req.body;

  try {
    // 1. Verify Event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // 2. Process winners, calculate points according to event rules if not manually supplied
    const processedWinners = [];
    for (const w of winners) {
      const participant = await Participant.findById(w.participant);
      if (!participant) {
        return res.status(404).json({ success: false, message: `Participant not found with id ${w.participant}` });
      }

      // Dynamic calculation based on event schema point configuration
      let points = 0;
      
      // Points for positions
      if (w.position === 1) points += event.points.first || 0;
      else if (w.position === 2) points += event.points.second || 0;
      else if (w.position === 3) points += event.points.third || 0;

      // Points for grades
      if (w.grade === 'A') points += event.points.gradeA || 0;
      else if (w.grade === 'B') points += event.points.gradeB || 0;
      else if (w.grade === 'C') points += event.points.gradeC || 0;

      processedWinners.push({
        participant: w.participant,
        position: w.position,
        grade: w.grade,
        points: w.points !== undefined ? Number(w.points) : points, // override if admin forces manual points
      });
    }

    // 3. Find and update, or create
    let result = await Result.findOne({ event: eventId });

    if (result) {
      result.winners = processedWinners;
      if (isPublished !== undefined) {
        result.isPublished = isPublished;
        if (isPublished) result.publishedAt = Date.now();
      }
      await result.save();
      await logAction(req.user._id, 'UPDATE_RESULT', `Updated results for event ${event.name}`, req);
    } else {
      result = await Result.create({
        event: eventId,
        winners: processedWinners,
        isPublished: isPublished || false,
        publishedAt: isPublished ? Date.now() : null,
      });
      await logAction(req.user._id, 'CREATE_RESULT', `Entered results for event ${event.name}`, req);
    }

    // 4. Recalculate Unit Scores
    await recalculateUnitPoints();

    const populatedResult = await Result.findById(result._id)
      .populate('event')
      .populate({
        path: 'winners.participant',
        populate: { path: 'unit' },
      });

    res.status(200).json({ success: true, result: populatedResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle publish status
// @route   PUT /api/results/:id/publish
// @access  Private/Admin
const togglePublishResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate('event');
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    result.isPublished = !result.isPublished;
    result.publishedAt = result.isPublished ? Date.now() : null;
    await result.save();

    await logAction(
      req.user._id,
      result.isPublished ? 'PUBLISH_RESULT' : 'UNPUBLISH_RESULT',
      `Toggled publish status for event ${result.event.name} to ${result.isPublished}`,
      req
    );

    // Recalculate since scoreboard counts only published results
    await recalculateUnitPoints();

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a result
// @route   DELETE /api/results/:id
// @access  Private/Admin
const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate('event');
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    await Result.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_RESULT', `Deleted results for event ${result.event.name}`, req);

    // Recalculate since removing scores changes unit point standing
    await recalculateUnitPoints();

    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getResults,
  getResultById,
  getResultByEventId,
  createOrUpdateResult,
  togglePublishResult,
  deleteResult,
};
