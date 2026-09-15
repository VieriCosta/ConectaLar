import { supabase } from './supabase';

export function validatePassword(password: string) {
  if (password.length < 12 || password.length > 72)
    return 'A senha deve ter entre 12 e 72 caracteres.';
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^a-zA-Z\d]/.test(password)
  )
    return 'Use maiúscula, minúscula, número e símbolo.';
  return null;
}
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'renter' | 'owner',
) {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: window.location.origin,
    },
  });
}
export const requestPasswordReset = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });

export async function resetPassword(password: string) {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  return supabase.auth.updateUser({ password });
}

export async function updateProfile(fullName: string, password?: string) {
  const normalizedName = fullName.trim();
  if (normalizedName.length < 3)
    throw new Error('Informe um nome com pelo menos 3 caracteres.');
  const passwordError = password ? validatePassword(password) : null;
  if (passwordError) throw new Error(passwordError);

  const authResult = await supabase.auth.updateUser({
    data: { full_name: normalizedName },
    ...(password ? { password } : {}),
  });
  if (authResult.error) return authResult;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: normalizedName })
    .eq('id', authResult.data.user.id);
  return { data: authResult.data, error };
}
