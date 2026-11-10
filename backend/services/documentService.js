import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "../data");
const storePath = path.join(dataDir, "documents.json");

async function readStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error("Document storage could not be read.");
  }
}

async function writeStore(documents) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(documents, null, 2), "utf8");
}

function cleanExtractedText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 500_000);
}

async function extractText(file) {
  const extension = file.originalname.split(".").pop().toLowerCase();

  if (extension === "txt") {
    return cleanExtractedText(file.buffer.toString("utf8"));
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return cleanExtractedText(result.value);
  }

  if (extension === "pdf") {
    const result = await pdfParse(file.buffer);
    return cleanExtractedText(result.text);
  }

  const error = new Error("Unsupported document type.");
  error.status = 415;
  throw error;
}

export async function saveUploadedDocument(file) {
  const extractedText = await extractText(file);

  if (!extractedText) {
    const error = new Error(
      "No readable text was found. The PDF may be scanned or the document may be empty."
    );
    error.status = 422;
    throw error;
  }

  const documents = await readStore();
  const record = {
    id: randomUUID(),
    originalName: path.basename(file.originalname),
    mimeType: file.mimetype,
    extension: file.originalname.split(".").pop().toLowerCase(),
    size: file.size,
    characterCount: extractedText.length,
    uploadedAt: new Date().toISOString(),
    extractedText,
  };

  documents.unshift(record);
  await writeStore(documents);

  const { extractedText: ignored, ...metadata } = record;
  return metadata;
}

export async function getAllDocuments() {
  const documents = await readStore();
  return documents.map(({ extractedText, ...metadata }) => metadata);
}

export async function getDocumentById(id) {
  const documents = await readStore();
  return documents.find((document) => document.id === id) || null;
}

export async function removeDocument(id) {
  const documents = await readStore();
  const nextDocuments = documents.filter((document) => document.id !== id);

  if (nextDocuments.length === documents.length) return false;

  await writeStore(nextDocuments);
  return true;
}
