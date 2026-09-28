import { supabase } from './supabase';

/*
  Preface Fitness
  Supabase Authentication Service

  The React UI should use these functions instead of
  calling Supabase Auth directly.

  This keeps authentication replaceable in the future.
*/

export async function signInOwner(email, password) {
  const cleanEmail = String(email || '').trim();

  if (!cleanEmail) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to sign in.'
    );
  }

  if (!data?.user) {
    throw new Error(
      'Supabase did not return an authenticated user.'
    );
  }

  return data.user;
}

export async function signOutOwner() {
  const {
    error,
  } = await supabase.auth.signOut();

  if (error) {
    throw new Error(
      error.message || 'Unable to sign out.'
    );
  }
}

export async function getSupabaseSession() {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

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
  } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback({
        event,
        session,
        user: session?.user || null,
      });
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
}