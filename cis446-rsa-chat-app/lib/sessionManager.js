import { cookies } from 'next/headers'; 
import { NextResponse } from 'next/server';

//Read user ID from cookie in App Router/server context
export async function getUserIdFromCookies() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('x-user-id');
  return cookie?.value || null;
}

export function getUserIdFromRequest(req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
    return cookies['x-user-id'] || null;
  }
  
//Middleware: redirect if not authenticated
export function requireAuthOrRedirect() {
  const userId = getUserIdFromCookies();
  if (!userId) {
    return NextResponse.redirect('/');
  }
  return userId;
}
