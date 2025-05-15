import { NextRequest, NextResponse } from 'next/server';
// Temporarily disable Firebase Admin imports for deployment
// import { getAuth } from 'firebase-admin/auth';
// import admin from 'firebase-admin';

// Simplified stub for deployment

export async function GET(request: NextRequest) {
  try {
    // For deployment, we return a simplified mock response
    // This will be replaced with the actual implementation once deployed
    console.log('Mock invitation details endpoint called');
    
    // Get request parameters for logging only
    const boardId = request.nextUrl.searchParams.get('boardId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    console.log(`Fetching invitation details for boardId: ${boardId}, memberId: ${memberId}`);
    
    // Return a mock success response with dummy invitation data
    return NextResponse.json({ 
      success: true, 
      invitation: {
        boardId: boardId || 'mock-board-id',
        id: memberId || 'mock-member-id',
        email: 'user@example.com',
        role: 'MEMBER',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      boardName: 'Mock Project Board'
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
