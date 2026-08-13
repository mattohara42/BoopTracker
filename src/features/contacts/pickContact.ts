import * as Contacts from 'expo-contacts';

import type { Person } from '@/data/fakeFriends';
import { contactToPerson, type RawContact } from '@/state/contactsCore';

/**
 * Open the phone's native contact picker and return the chosen person, or null
 * if the user cancelled or contacts aren't available (e.g. on web).
 *
 * Uses the native picker rather than reading the whole address book, so the app
 * only ever sees the single contact the user hands it — a deliberate privacy
 * choice, and it needs no "allow access to all contacts" prompt.
 */
export async function pickContactAsPerson(): Promise<Person | null> {
  try {
    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return null;
    return contactToPerson(contact as RawContact);
  } catch {
    return null;
  }
}
