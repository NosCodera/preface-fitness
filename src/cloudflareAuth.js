import { backendClient } from './backend';

export async function signInOwner(email, password) {
  const cleanEmail = String(email || '').trim();

  if (!cleanEmail) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const { data, error } = await backendClient.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Unable to sign in.');
  }

  if (!data?.user) {
    throw new Error('Cloudflare Worker did not return an authenticated user.');
  }

  return data.user;
}

export async function signOutOwner() {
  const { error } = await backendClient.auth.signOut();

  if (error) {
    throw new Error(error.message || 'Unable to sign out.');
  }
}

export async function getAuthSession() {
  const { data, error } = await backendClient.auth.getSession();

  if (error) {
    throw new Error(
      error.message || 'Unable to read authentication session.'
    );
  }

  return data?.session || null;
}

export async function getAuthUser() {
  const {
    data: { user },
    error,
  } = await backendClient.auth.getUser();

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
  } = backendClient.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: session?.user || null,
    });
  });

  return () => subscription?.unsubscribe();
}

/* Change currently logged-in user's password */
export async function changeAccountPassword(newPassword) {
  const password = String(newPassword || '');

  if (!password) {
    throw new Error('New password is required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { data, error } = await backendClient.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to change password.'
    );
  }

  return data?.user || null;
}

/* Change currently logged-in user's email */
export async function changeAccountEmail(newEmail) {
  const email = String(newEmail || '').trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  const { data, error } = await backendClient.auth.updateUser({
    email,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to change email.'
    );
  }

  return data?.user || null;
}

/* Change email and/or password together */
export async function changeAccountCredentials({
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
      throw new Error(
        'Password must be at least 6 characters long.'
      );
    }

    updates.password = cleanPassword;
  }

  if (!Object.keys(updates).length) {
    throw new Error('No account changes were provided.');
  }

  const { data, error } = await backendClient.auth.updateUser(
    updates
  );

  if (error) {
    throw new Error(
      error.message || 'Unable to update account credentials.'
    );
  }

  return data?.user || null;
}