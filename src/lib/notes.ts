import { supabase } from "@/lib/supabase";
import type { PatientNote } from "@/types/database";

export async function getPatientNotes(
  patientId: string,
): Promise<{ data: PatientNote[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: new Error(`Failed to fetch notes for patient ${patientId}: ${error.message}`),
    };
  }

  return { data: (data ?? []) as PatientNote[], error: null };
}

export async function createNote(
  patientId: string,
  content: string,
  createdBy: string,
): Promise<{ data: PatientNote | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("patient_notes")
    .insert({ patient_id: patientId, content, created_by: createdBy })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: new Error(`Failed to create note for patient ${patientId}: ${error.message}`),
    };
  }

  return { data: data as PatientNote, error: null };
}

export async function deleteNote(
  id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("patient_notes")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: new Error(`Failed to delete note ${id}: ${error.message}`) };
  }

  return { error: null };
}
