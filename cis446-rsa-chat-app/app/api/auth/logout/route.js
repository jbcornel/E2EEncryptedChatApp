import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  //Clear the cookie storing user session
  response.cookies.set('x-user-id', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('username', '', {
    path: '/',
    maxAge: 0,
  });


  return response;
}
