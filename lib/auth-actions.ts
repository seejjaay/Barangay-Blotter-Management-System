'use server'

import { createSupabaseServer, createSupabaseAdmin } from './supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Server actions are callable as plain POST endpoints, so every admin action
// must verify the caller itself rather than trusting the UI to hide buttons.
async function requireAdmin(): Promise<{ error: string } | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  const allowed = profile?.role === 'Brgy. Captain' || profile?.role === 'Secretary'
  if (!allowed || profile?.status !== 'Active') {
    return { error: 'Only the Barangay Captain or Secretary can manage users.' }
  }
  return null
}

// Public sign-up is bootstrap-only: it works while no profiles exist, and the
// first account becomes the Brgy. Captain. After that, accounts are created by
// a Captain/Secretary through createUser(). The role is never taken from the client.
export async function signUp(formData: {
  fullName: string
  email: string
  password: string
}) {
  const supabaseAdmin = await createSupabaseAdmin()

  const { count, error: countError } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  if (countError) return { error: 'Could not verify setup state. Please try again.' }
  if ((count ?? 0) > 0) {
    return { error: 'Sign-up is closed. Ask the Barangay Captain or Secretary to create your account.' }
  }

  const role = 'Brgy. Captain'

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })

  if (authError) {
    // Catch duplicate email error specifically
    if (
      authError.message.toLowerCase().includes('already registered') ||
      authError.message.toLowerCase().includes('already been registered') ||
      authError.message.toLowerCase().includes('duplicate') ||
      authError.message.toLowerCase().includes('already exists')
    ) {
      return { error: 'This email address is already registered. Please use a different email or sign in instead.' }
    }
    return { error: authError.message }
  }

  // 2. Create their public profile record
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: formData.fullName,
      email: formData.email,
      role,
      status: 'Active',
    })

  if (profileError) {
    // Roll back by deleting the auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create profile. Please try again.' }
  }

  return { success: true }
}

export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createSupabaseServer()

  // Authenticate directly with email + password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    // Log failed login attempt
    await supabase.from('audit_logs').insert({
      user_name: 'Unknown',
      user_id: '—',
      action: 'Failed Login',
      details: `Failed attempt with email '${formData.email}'`,
      status: 'Failed',
    })

    return { error: 'Invalid email or password.' }
  }

  // Log successful login
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single()

    await supabase.from('audit_logs').insert({
      user_id: data.user.id,
      user_name: profile?.full_name || data.user.email || 'Unknown',
      action: 'Login',
      details: 'Successful authentication',
      status: 'Success',
    })

    // Update last_active
    await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', data.user.id)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email || 'Unknown',
      action: 'Logout',
      details: 'User signed out',
      status: 'Success',
    })
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function createUser(params: {
  fullName: string
  email: string
  role: string
  tempPassword: string
}) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabaseAdmin = await createSupabaseAdmin()
  const supabase = await createSupabaseServer()

  // Map role values to display labels
  const roleMap: Record<string, string> = {
    'captain': 'Brgy. Captain',
    'secretary': 'Secretary',
    'desk-officer': 'Desk Officer',
  }

  const role = roleMap[params.role] || params.role

  // Create auth user with admin API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: params.email,
    password: params.tempPassword,
    email_confirm: true,
  })

  if (authError) {
    if (
      authError.message.toLowerCase().includes('already registered') ||
      authError.message.toLowerCase().includes('already been registered') ||
      authError.message.toLowerCase().includes('duplicate') ||
      authError.message.toLowerCase().includes('already exists')
    ) {
      return { error: 'This email address is already registered. Please use a different email.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Insert profile record
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: params.fullName,
      role,
      email: params.email,
      status: 'Active',
    })

  if (profileError) {
    return { error: profileError.message }
  }

  // Log the action
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser) {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUser.id)
      .single()

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id,
      user_name: currentProfile?.full_name || currentUser.email || 'Unknown',
      action: 'User Created',
      details: `Created account for ${params.fullName} (${role})`,
      status: 'Success',
    })
  }

  revalidatePath('/users')
  return { success: true }
}

export async function resetUserPassword(userId: string, userEmail: string) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabaseAdmin = await createSupabaseAdmin()
  const supabase = await createSupabaseServer()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + '!',
  })

  if (error) {
    return { error: error.message }
  }

  // Also send a password reset email
  await supabaseAdmin.auth.resetPasswordForEmail(userEmail)

  // SAFE AUDIT LOGGING: Wrap in try/catch to prevent "Auth session missing" crashes
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .single()

      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        user_name: currentProfile?.full_name || currentUser.email || 'Unknown',
        action: 'Password Reset',
        details: `Reset password for ${userEmail}`,
        status: 'Success',
      })
    }
  } catch (err) {
    console.log("Skipping audit log: No active session found.")
  }

  revalidatePath('/users')
  return { success: true }
}

export async function revokeUserAccess(userId: string, userName: string) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabaseAdmin = await createSupabaseAdmin()
  const supabase = await createSupabaseServer()

  // Disable the user in profiles
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'Inactive' })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Ban the user in Supabase Auth
  await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' }) // ~100 years

  // SAFE AUDIT LOGGING
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        user_name: currentUser.email || 'Unknown',
        action: 'Access Revoked',
        details: `Revoked access for ${userName}`,
        status: 'Warning',
      })
    }
  } catch (err) {
    console.log("Skipping audit log: No active session found.")
  }

  revalidatePath('/users')
  return { success: true }
}

// NEW FUNCTION: To restore access when someone is already revoked
export async function restoreUserAccess(userId: string, userName: string) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabaseAdmin = await createSupabaseAdmin()
  const supabase = await createSupabaseServer()

  // Re-enable the user in profiles
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'Active' })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Unban the user in Supabase Auth by removing the ban duration
  await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' })

  // SAFE AUDIT LOGGING
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        user_name: currentUser.email || 'Unknown',
        action: 'Access Restored',
        details: `Restored access for ${userName}`,
        status: 'Success',
      })
    }
  } catch (err) {
    console.log("Skipping audit log: No active session found.")
  }

  revalidatePath('/users')
  return { success: true }
}
