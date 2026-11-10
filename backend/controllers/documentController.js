import {
  saveUploadedDocument,
  getAllDocuments,
  getDocumentById,
  removeDocument,
} from "../services/documentService.js";

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file using the "document" field.',
      });
    }

    const document = await saveUploadedDocument(req.file);

    return res.status(201).json({
      success: true,
      message: "Document uploaded and text extracted successfully.",
      document,
    });
  } catch (error) {
    next(error);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = await getAllDocuments();
    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const document = await getDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Do not return extracted text in the listing/detail metadata response.
    const { extractedText, ...metadata } = document;
    res.json({ success: true, document: metadata });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const deleted = await removeDocument(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    res.json({ success: true, message: "Document deleted." });
  } catch (error) {
    next(error);
  }
}
