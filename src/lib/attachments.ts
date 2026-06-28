import { supabase } from "@/lib/supabase";
import type { PatientAttachment } from "@/types/database";

const STORAGE_BUCKET = "patient-files";
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export async function uploadAttachment(
  patientId: string,
  file: File,
  uploadedBy: string,
): Promise<{ data: PatientAttachment | null; error: Error | null }> {
  const storagePath = `${patientId}/${Date.now()}_${file.name}`;

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file);

  if (uploadError) {
    return {
      data: null,
      error: new Error(`Failed to upload file "${file.name}": ${uploadError.message}`),
    };
  }

  // 2. Insert metadata row
  const { data, error: insertError } = await supabase
    .from("patient_attachments")
    .insert({
      patient_id: patientId,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (insertError) {
    // Attempt to clean up the uploaded file on metadata insert failure
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return {
      data: null,
      error: new Error(`Failed to save attachment metadata: ${insertError.message}`),
    };
  }

  return { data: data as PatientAttachment, error: null };
}

export async function getAttachments(
  patientId: string,
): Promise<{ data: PatientAttachment[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("patient_attachments")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: new Error(`Failed to fetch attachments for patient ${patientId}: ${error.message}`),
    };
  }

  return { data: (data ?? []) as PatientAttachment[], error: null };
}

export async function deleteAttachment(
  id: string,
  storagePath: string,
): Promise<{ error: Error | null }> {
  // Remove file from storage first
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    return {
      error: new Error(`Failed to remove file from storage: ${storageError.message}`),
    };
  }

  // Delete metadata row
  const { error: dbError } = await supabase
    .from("patient_attachments")
    .delete()
    .eq("id", id);

  if (dbError) {
    return {
      error: new Error(`Failed to delete attachment metadata ${id}: ${dbError.message}`),
    };
  }

  return { error: null };
}

export async function getAttachmentUrl(
  storagePath: string,
): Promise<{ data: string | null; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    return {
      data: null,
      error: new Error(`Failed to create signed URL for "${storagePath}": ${error.message}`),
    };
  }

  return { data: data.signedUrl, error: null };
}
