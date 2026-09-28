import { supabase } from './supabase';

export async function signInOwner(email, password) {
  const cleanEmail = String(email || '').trim();

  if (!cleanEmail) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Unable to sign in.');
  }

  if (!data?.user) {
    throw new Error('Supabase did not return an authenticated user.');
  }

  return data.user;
}

export async function signOutOwner() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message || 'Unable to sign out.');
  }
}

export async function getSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      error.message || 'Unable to read authentication session.'
    );
  }

  return data?.session || null;
}

export async function getSupabaseUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(
      error.message || 'Unable to read authenticated user.'
    );
  }

  return user || null;
}

export function subscribeToAuthChanges(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: session?.user || null,
    });
  });

  return () => subscription?.unsubscribe();
}

/**
 * Change the currently logged-in user's password.
 */
export async function changeSupabasePassword(newPassword) {
  const password = String(newPassword || '');

  if (!password) {
    throw new Error('New password is required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to change password.'
    );
  }

  return data?.user || null;
}

/**
 * Change the currently logged-in user's email.
 *
 * Depending on Supabase Auth settings, the new email
 * may need to be confirmed before it becomes active.
 */
export async function changeSupabaseEmail(newEmail) {
  const email = String(newEmail || '').trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  const { data, error } = await supabase.auth.updateUser({
    email,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to change email.'
    );
  }

  return data?.user || null;
}

/**
 * Change the currently logged-in user's email and/or password.
 */
export async function changeSupabaseCredentials({
  email,
  password,
}) {
  const updates = {};

  if (email !== undefined && email !== null) {
    const cleanEmail = String(email).trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }

    updates.email = cleanEmail;
  }

  if (
    password !== undefined &&
    password !== null &&
    password !== ''
  ) {
    const cleanPassword = String(password);

    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    updates.password = cleanPassword;
  }

  if (!Object.keys(updates).length) {
    throw new Error('No account changes were provided.');
  }

  const { data, error } = await supabase.auth.updateUser(updates);

  if (error) {
    throw new Error(
      error.message || 'Unable to update account credentials.'
    );
  }

  return data?.user || null;
}