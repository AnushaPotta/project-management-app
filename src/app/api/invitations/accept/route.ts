import { NextRequest, NextResponse } from 'next/server';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface FirebaseUser extends UserRecord {
  email: string;
  uid: string;
}

interface BoardInvitation {
  id: string;
  boardId: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  userId?: string;
  createdAt: any;
  updatedAt: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get the Firebase ID token from cookies or headers
    const authHeader = request.headers.get('authorization') || '';
    let user: FirebaseUser | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // Verify the Firebase token
        const decodedToken = await getAuth().verifyIdToken(token);
        const userRecord = await getAuth().getUser(decodedToken.uid);
        // Cast to our extended interface that includes email
        user = userRecord as FirebaseUser;
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitationId = request.nextUrl.searchParams.get('id');
    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    // Find the invitation
    const invitationDoc = await getDoc(doc(db, 'boardMembers', invitationId));
    
    if (!invitationDoc.exists()) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    
    const invitation = { id: invitationDoc.id, ...invitationDoc.data() } as BoardInvitation;

    // Check if the user email matches the invitation email
    if (invitation.email !== user.email) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }

    // Update the invitation status and link to user account
    await updateDoc(doc(db, 'boardMembers', invitationId), {
      status: 'ACCEPTED',
      userId: user.uid,
      updatedAt: serverTimestamp(),
    });

    // Redirect to the board
    const redirectUrl = `/boards/${invitation.boardId}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}