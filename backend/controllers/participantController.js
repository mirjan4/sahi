const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Unit = require('../models/Unit');
const xlsx = require('xlsx');
const fs = require('fs');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all participants
// @route   GET /api/participants
// @access  Public
const getParticipants = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.unit || req.query.team) {
      filter.unit = req.query.unit || req.query.team;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      const [matchingCats, matchingUnits] = await Promise.all([
        Category.find({ name: searchRegex }).select('_id'),
        Unit.find({ $or: [{ name: searchRegex }, { code: searchRegex }] }).select('_id'),
      ]);
      const catIds = matchingCats.map((c) => c._id);
      const unitIds = matchingUnits.map((u) => u._id);
      filter.$or = [
        { name: searchRegex },
        { registerNo: searchRegex },
        { category: { $in: catIds } },
        { unit: { $in: unitIds } },
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

      const totalRecords = await Participant.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const participants = await Participant.find(filter)
        .populate('category')
        .populate('unit')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        participants,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const participants = await Participant.find(filter)
        .populate('category')
        .populate('unit')
        .sort(sort);
      res.json({ success: true, participants });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single participant by ID
// @route   GET /api/participants/:id
// @access  Public
const getParticipantById = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .populate('category')
      .populate('unit');
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    res.json({ success: true, participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get participant by Registration Number
// @route   GET /api/participants/reg/:regNo
// @access  Public
const getParticipantByRegNo = async (req, res) => {
  try {
    const participant = await Participant.findOne({ registerNo: req.params.regNo.toUpperCase() })
      .populate('category')
      .populate('unit');
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    res.json({ success: true, participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a participant
// @route   POST /api/participants
// @access  Private/Admin
const createParticipant = async (req, res) => {
  const { name, registerNo, category, unit, email, phone } = req.body;

  try {
    const exists = await Participant.findOne({ registerNo: registerNo.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }

    const participant = await Participant.create({
      name,
      registerNo: registerNo.toUpperCase(),
      category,
      unit,
      email,
      phone,
    });
    
    await logAction(req.user._id, 'CREATE_PARTICIPANT', `Created participant ${name} (${registerNo.toUpperCase()})`, req);

    res.status(201).json({ success: true, participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a participant
// @route   PUT /api/participants/:id
// @access  Private/Admin
const updateParticipant = async (req, res) => {
  const { name, registerNo, category, unit, email, phone } = req.body;

  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    if (registerNo && registerNo.toUpperCase() !== participant.registerNo) {
      const exists = await Participant.findOne({ registerNo: registerNo.toUpperCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Registration number already exists' });
      }
      participant.registerNo = registerNo.toUpperCase();
    }

    participant.name = name || participant.name;
    participant.category = category || participant.category;
    participant.unit = unit || participant.unit;
    participant.email = email !== undefined ? email : participant.email;
    participant.phone = phone !== undefined ? phone : participant.phone;

    const updatedParticipant = await participant.save();
    await logAction(req.user._id, 'UPDATE_PARTICIPANT', `Updated participant ${participant.name}`, req);

    res.json({ success: true, participant: updatedParticipant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a participant
// @route   DELETE /api/participants/:id
// @access  Private/Admin
const deleteParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    await Participant.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_PARTICIPANT', `Deleted participant ${participant.name}`, req);

    res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export participants to Excel
// @route   GET /api/participants/excel/export
// @access  Private/Admin
const exportParticipants = async (req, res) => {
  try {
    const participants = await Participant.find()
      .populate('category', 'name code')
      .populate('unit', 'name code');

    const data = participants.map((p) => ({
      'Register No': p.registerNo,
      Name: p.name,
      Category: p.category ? p.category.name : '',
      'Category Code': p.category ? p.category.code : '',
      Unit: p.unit ? p.unit.name : '',
      'Unit Code': p.unit ? p.unit.code : '',
      Email: p.email || '',
      Phone: p.phone || '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Participants');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=participants.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import participants from Excel
// @route   POST /api/participants/excel/import
// @access  Private/Admin
const importParticipants = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
  }

  const filePath = req.file.path;

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Cache categories and units to avoid excessive DB queries
    let categories = await Category.find();
    let units = await Unit.find();

    const findOrCreateCategory = async (catName, catCode) => {
      if (!catName) return null;
      const normalizedCode = (catCode || catName.substring(0, 3)).toUpperCase();
      let cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase() || c.code === normalizedCode);
      if (!cat) {
        cat = await Category.create({ name: catName, code: normalizedCode });
        categories.push(cat);
      }
      return cat;
    };

    const findOrCreateUnit = async (unitName, unitCode) => {
      if (!unitName) return null;
      const normalizedCode = (unitCode || unitName.substring(0, 3)).toUpperCase();
      let ut = units.find((u) => u.name.toLowerCase() === unitName.toLowerCase() || u.code === normalizedCode);
      if (!ut) {
        ut = await Unit.create({ name: unitName, code: normalizedCode });
        units.push(ut);
      }
      return ut;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['Name'] || row['name'];
      const registerNo = row['Register No'] || row['RegisterNo'] || row['registerNo'] || row['Reg No'] || row['regNo'];
      const categoryName = row['Category'] || row['category'];
      const categoryCode = row['Category Code'] || row['CategoryCode'] || row['categoryCode'];
      const unitName = row['Unit'] || row['unit'];
      const unitCode = row['Unit Code'] || row['UnitCode'] || row['unitCode'];
      const email = row['Email'] || row['email'];
      const phone = row['Phone'] || row['phone'];

      if (!name || !registerNo) {
        failedCount++;
        errors.push(`Row ${i + 2}: Missing Name or Register No`);
        continue;
      }

      try {
        const cat = await findOrCreateCategory(categoryName, categoryCode);
        const ut = await findOrCreateUnit(unitName, unitCode);

        if (!cat || !ut) {
          failedCount++;
          errors.push(`Row ${i + 2}: Could not resolve Category or Unit`);
          continue;
        }

        const normalizedRegNo = String(registerNo).toUpperCase().trim();

        // Check if participant already exists
        let participant = await Participant.findOne({ registerNo: normalizedRegNo });

        if (participant) {
          participant.name = name;
          participant.category = cat._id;
          participant.unit = ut._id;
          if (email) participant.email = email;
          if (phone) participant.phone = phone;
          await participant.save();
          updatedCount++;
        } else {
          await Participant.create({
            name,
            registerNo: normalizedRegNo,
            category: cat._id,
            unit: ut._id,
            email,
            phone,
          });
          createdCount++;
        }
      } catch (err) {
        failedCount++;
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    // Clean up file if it exists locally
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await logAction(
      req.user._id,
      'IMPORT_PARTICIPANTS',
      `Imported participants: ${createdCount} created, ${updatedCount} updated, ${failedCount} failed`,
      req
    );

    res.json({
      success: true,
      summary: {
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        errors,
      },
    });
  } catch (error) {
    // Clean up file if it exists locally
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk delete participants by IDs
// @route   DELETE /api/participants/bulk-delete
// @access  Private/Admin
const bulkDeleteParticipants = async (req, res) => {
  try {
    const { participantIds } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No participant IDs provided.' });
    }

    const result = await Participant.deleteMany({ _id: { $in: participantIds } });

    await logAction(
      req.user._id,
      'BULK_DELETE_PARTICIPANTS',
      `Bulk deleted ${result.deletedCount} participant(s)`,
      req
    );

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} participant(s) deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download CSV Template for Participant Import
// @route   GET /api/participants/csv/template
// @access  Private/Admin
const downloadCSVTemplate = async (req, res) => {
  try {
    const csvContent = 
      "Name,Register No,Category,Category Code,Unit,Unit Code,Email,Phone\n" +
      "John Doe,REG1001,Senior,SR,Team Alpha,T-ALPHA,johndoe@example.com,9876543210\n" +
      "Jane Smith,REG1002,Junior,JR,Team Beta,T-BETA,janesmith@example.com,9876543211\n";

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=participants_template.csv');
    res.send(Buffer.from(csvContent, 'utf-8'));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getParticipants,
  getParticipantById,
  getParticipantByRegNo,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  bulkDeleteParticipants,
  exportParticipants,
  importParticipants,
  downloadCSVTemplate,
};
