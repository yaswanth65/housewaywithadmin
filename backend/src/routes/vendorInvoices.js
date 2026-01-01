const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const VendorInvoice = require('../models/VendorInvoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const NegotiationMessage = require('../models/NegotiationMessage');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/vendor-invoices
 * @desc    Get all vendor invoices (role-based access)
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, projectId, vendorId } = req.query;

    let query = {};

    if (req.user.role === 'vendor') {
      query.vendor = req.user._id;
    } else if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (status) query.status = status;
    if (projectId) query.project = projectId;
    if (vendorId && req.user.role === 'owner') query.vendor = vendorId;

    const invoices = await VendorInvoice.find(query)
      .populate('purchaseOrder', 'purchaseOrderNumber title')
      .populate('project', 'title')
      .populate('vendor', 'firstName lastName email vendorDetails.companyName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VendorInvoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Get vendor invoices error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/vendor-invoices/:id
 * @desc    Get single vendor invoice
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('project', 'title client')
      .populate('vendor', 'firstName lastName email phone vendorDetails')
      .populate('acceptedQuotation')
      .populate('payments.recordedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && invoice.vendor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get vendor invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/vendor-invoices/:id/download
 * @desc    Get a URL for invoice PDF download
 * @access  Private
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('project', 'title client')
      .populate('vendor', 'firstName lastName email phone vendorDetails');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && invoice.vendor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/api/vendor-invoices/${invoice._id}/pdf`;

    res.json({
      success: true,
      message: 'Invoice download link ready',
      data: { invoiceNumber: invoice.invoiceNumber, downloadUrl: fileUrl, fileUrl },
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/vendor-invoices/:id/pdf
 * @desc    Stream invoice PDF
 * @access  Private
 */
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('project', 'title client')
      .populate('vendor', 'firstName lastName email phone vendorDetails');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && invoice.vendor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(20).text(`Invoice ${invoice.invoiceNumber}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Project: ${invoice.project?.title || 'N/A'}`);
    doc.text(
      `Vendor: ${
        invoice.vendor?.vendorDetails?.companyName || `${invoice.vendor?.firstName || ''} ${invoice.vendor?.lastName || ''}`
      }`
    );
    doc.text(`Purchase Order: ${invoice.purchaseOrder?.purchaseOrderNumber || invoice.purchaseOrder}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Subtotal: ${invoice.currency} ${Number(invoice.subtotal || 0).toLocaleString()}`);
    doc.text(`Tax: ${invoice.currency} ${Number(invoice.tax?.amount || 0).toLocaleString()} (${invoice.tax?.rate || 0}%)`);
    doc.text(`Total: ${invoice.currency} ${Number(invoice.totalAmount || 0).toLocaleString()}`);

    doc.end();
  } catch (error) {
    console.error('Stream invoice PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
