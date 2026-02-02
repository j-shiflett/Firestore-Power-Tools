import { Firestore } from "@google-cloud/firestore";

export function getFirestore(projectId: string) {
  // Uses Application Default Credentials (ADC)
  return new Firestore({ projectId });
}
