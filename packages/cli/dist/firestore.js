import { Firestore } from "@google-cloud/firestore";
export function getFirestore(projectId) {
    // Uses Application Default Credentials (ADC)
    return new Firestore({ projectId });
}
