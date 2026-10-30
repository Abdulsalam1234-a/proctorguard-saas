'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, FileQuestion, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), title: title.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      await loadCourses();
      setIsAddModalOpen(false);
      setCode('');
      setTitle('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string, courseCode: string) => {
    if (!confirm(`Are you sure you want to delete course ${courseCode}? All associated exams will also be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses & Curriculum Units</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize examinations, quizzes, and continuous assessments under statutory course codes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setError(null);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                  {course.code}
                </span>
                <button
                  onClick={() => handleDeleteCourse(course.id, course.code)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 mt-3">{course.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {course.exams?.length || 0} examination{course.exams?.length === 1 ? '' : 's'} assigned
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/instructor/exams/create?courseId=${course.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Author Exam</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date(course.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Curriculum Course"
        description="Register a new academic course code to host examinations."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FIN301 or LAW301"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Financial Institutions & Capital Markets"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Course...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
