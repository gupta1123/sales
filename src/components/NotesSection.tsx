import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import "./NotesTimeline.css";
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

// Define types for props and state
type Note = {
  id: string;
  content: string;
  createdDate: string;
  employeeName: string;
  visitId?: string;  // Optional Visit ID
};

type NotesSectionProps = {
  storeId: string;
};

type RootState = {
  auth: {
    token: string;
    employeeId: number;  // Add employeeId to the auth state
  };
};

// Component definition
export default function NotesSection({ storeId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<string>("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showTextarea, setShowTextarea] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const notesPerPage = 3;
  const token = useSelector((state: RootState) => state.auth.token);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);

  console.log("Redux state - Token:", token);
  console.log("Redux state - Employee ID:", employeeId);

  useEffect(() => {
    fetchNotes();
  }, [storeId]);

  // Fetch notes from the server
  const fetchNotes = async () => {
    try {
      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/getByStore?id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  // Show textarea to add a new note
  const handleAddNote = () => {
    setShowTextarea(true);
    setEditingNoteId(null);
  };

  // Save or update note
  const handleSaveOrUpdateNote = async () => {
    if (!newNote.trim()) return;

    const url = editingNoteId
      ? `http://ec2-13-49-190-97.eu-north-1.compute.amazonaws.com:8081/notes/edit?id=${editingNoteId}`
      : "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/create";
    const method = editingNoteId ? "PUT" : "POST";

    const payload = editingNoteId
      ? { id: parseInt(editingNoteId), content: newNote }
      : { content: newNote, employeeId, storeId: parseInt(storeId) };

    console.log("Payload:", payload);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const noteId = editingNoteId ? editingNoteId : await response.text();
        const updatedOrNewNote = {
          id: noteId,
          content: newNote,
          createdDate: editingNoteId ? notes.find(note => note.id === editingNoteId)!.createdDate : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          employeeName: "XYZ"
        };

        const updatedNotes = editingNoteId ? notes.map(note => note.id === editingNoteId ? updatedOrNewNote : note) : [...notes, updatedOrNewNote];
        setNotes(updatedNotes);
        resetForm();
      } else {
        console.error("Error saving/updating note:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving/updating note:", error);
    }
  };

  // Set state for editing a note
  const handleEditNote = (id: string) => {
    const note = notes.find(note => note.id === id);
    if (note) {
      setNewNote(note.content);
      setShowTextarea(true);
      setEditingNoteId(id);
    }
  };

  // Delete a note
  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== id));
      } else {
        console.error("Error deleting note:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setShowTextarea(false);
    setNewNote("");
    setEditingNoteId(null);
  };

  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = showAll ? notes.slice(indexOfFirstNote, indexOfLastNote) : notes.slice(0, 3);
  const totalPages = Math.ceil(notes.length / notesPerPage);

  const getPaginationGroup = (totalPages: number, itemsPerPage: number) => {
    const start = Math.floor((currentPage - 1) / itemsPerPage) * itemsPerPage;
    return new Array(itemsPerPage)
      .fill(0)
      .map((_, idx) => start + idx + 1)
      .filter((page) => page <= totalPages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Note Management</CardTitle>
      </CardHeader>
      <CardContent>
        {showTextarea && (
          <div className="mb-4">
            <Textarea
              placeholder="Enter note"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full mb-4"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={handleSaveOrUpdateNote} variant="default">Save</Button>
              <Button onClick={resetForm} variant="outline">Cancel</Button>
            </div>
          </div>
        )}
        {!showTextarea && (
          <div className="flex justify-center">
            <Button onClick={handleAddNote} className="px-4">Add Note</Button>
          </div>
        )}
        {notes.length > 0 && (
          <div className="notes-timeline">
            {currentNotes.map(note => (
              <div key={note.id} className="notes-timeline-item">
                <div className="notes-timeline-point"></div>
                <div className="notes-timeline-content">
                  <div className="notes-timeline-date">
                    {format(new Date(note.createdDate), "MMM d, yyyy")}
                  </div>
                  <div className="notes-timeline-text">{note.content}</div>
                  {note.visitId && (
                    <Link href={`/VisitDetailPage/${note.visitId}`} className="visit-id-display">
                      Visit ID: {note.visitId}
                    </Link>
                  )}
                  <div className="notes-timeline-actions">
                    <Button onClick={() => handleEditNote(note.id)} variant="ghost" size="sm">Edit</Button>
                    <Button onClick={() => handleDeleteNote(note.id)} variant="ghost" size="sm" className="text-red-500">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {notes.length > 3 && (
          <div className="mt-4">
            <Button onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        )}
        {showAll && (
          <div className="pagination-container mt-4">
            <Pagination>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "disabled" : ""}
              >
                Previous
              </PaginationPrevious>
              <PaginationContent>
                {getPaginationGroup(totalPages, notesPerPage).map((page, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "disabled" : ""}
              >
                Next
              </PaginationNext>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
