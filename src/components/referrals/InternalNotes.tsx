'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/FormInputs';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Note {
    id: string;
    referralId: string;
    author: string;
    authorId: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
}

interface InternalNotesProps {
    referralId: string;
}

export function InternalNotes({ referralId }: InternalNotesProps) {
    const { userProfile } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [referralId]);

    const fetchNotes = async () => {
        try {
            const q = query(
                collection(db, 'notes'),
                where('referralId', '==', referralId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as Note[];
            setNotes(notesData);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !userProfile) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'notes'), {
                referralId,
                author: userProfile.displayName,
                authorId: userProfile.uid,
                content: newNote,
                isInternal: true,
                createdAt: serverTimestamp(),
            });

            toast.success('Note added successfully');
            setNewNote('');
            fetchNotes();
        } catch (error: any) {
            console.error('Error adding note:', error);
            toast.error(error.message || 'Failed to add note');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center text-gray-600">Loading notes...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="space-y-3">
                    <Textarea
                        label="Add Internal Note"
                        placeholder="Add a note visible only to clinic staff..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        helperText="These notes are only visible to clinic admins"
                    />
                    <Button
                        onClick={handleAddNote}
                        loading={submitting}
                        disabled={!newNote.trim()}
                        size="sm"
                    >
                        Add Note
                    </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No notes yet. Add the first one above.
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">
                                                {note.author.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{note.author}</div>
                                            <div className="text-xs text-gray-500">{formatDate(note.createdAt)}</div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                        Internal
                                    </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
