import React, { useState } from 'react';
import { CourseService, WebsiteSettings } from '../types.ts';
import { ArrowUpRight, Check, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface CoursesSectionProps {
  courses: CourseService[];
  onOpenAccessModal: (courseId?: string) => void;
  settings?: WebsiteSettings;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  courses,
  onOpenAccessModal,
  settings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Disciplines' },
    { id: 'Binary Trading Course', label: 'Binary Mastery' },
    { id: 'Forex Trading Course', label: 'Forex SMC' },
    { id: 'Trading Signals', label: 'VIP Signals' },
    { id: 'Trading Bots', label: 'Quant Bots' },
    { id: 'Live Trading Classes', label: 'Live Classes' },
    { id: 'Trading Community', label: 'Community' },
  ];

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  return (
    <section id="courses" className="py-12 md:py-16 relative border-t border-yellow-500/15 bg-black">
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-yellow-500/30 text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3">
            <span>{settings?.coursesBadgeText || 'Trading Curriculum & Tools · Structured Path'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {settings?.coursesTitlePrimary !== undefined ? settings.coursesTitlePrimary : 'Comprehensive Courses,'}{' '}
            <span className="text-yellow-400 font-extrabold">
              {settings?.coursesTitleHighlight !== undefined ? settings.coursesTitleHighlight : 'Algorithmic Bots & Signals'}
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-300 leading-relaxed">
            {settings?.coursesSubtitle ||
              'Eliminate guesswork with institutional methodologies. Select a course or service below to review the curriculum and initiate verified access.'}
          </p>

          {/* Interactive Filter Tabs */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap max-w-full p-1.5 glass-panel rounded-2xl border border-yellow-500/20 w-full sm:w-fit">
            {categories.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-lux-gradient text-black font-bold shadow-lg shadow-yellow-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Bento Grid of Courses */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-yellow-500/20 bg-[#0D140F]/50">
            <BookOpen className="w-8 h-8 text-yellow-500/50 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No courses currently available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 min-w-0">
            {filteredCourses.map(course => {
              const isExpanded = expandedCourseId === course.id;

            return (
              <div
                key={course.id}
                className="group relative min-w-0 glass-panel rounded-xl sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-yellow-500/20 hover:border-yellow-500/60 transition-all shadow-xl bg-[#0D140F]"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-[#040604] overflow-hidden border-b border-yellow-500/15">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/binary_course_cover_1791906598444.jpg';
                    }}
                  />

                </div>

                <div className="flex flex-wrap items-center gap-1.5 px-2.5 pt-2.5 text-[10px] sm:text-xs">
                  <span className="max-w-full break-words rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-300 border border-yellow-500/20">{course.category}</span>
                  <span className="max-w-full break-words rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300 border border-emerald-500/20">{course.accessMode === 'new_account' ? 'Partner Setup' : 'Existing ID'}</span>
                </div>

                {/* Body Content */}
                <div className="min-w-0 p-2.5 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-3 text-left">
                    <h3 className="text-sm sm:text-xl font-bold text-white group-hover:text-yellow-400 transition-colors break-words">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {course.shortDesc || (course as any).description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-1.5 pt-2">
                      {Array.isArray(course.modules || (course as any).features) 
                        ? (course.modules || (course as any).features).slice(0, 3).map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))
                        : null}
                    </div>

                    {/* Curriculum Drawer if Expanded */}
                    {isExpanded && Array.isArray(course.modules || (course as any).curriculum) && (
                      <div className="pt-3 border-t border-yellow-500/15 space-y-2 animate-fadeIn">
                        <div className="text-[11px] font-mono text-yellow-400 uppercase tracking-wider">Course Modules:</div>
                        {(course.modules || (course as any).curriculum || []).map((mod: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-300 bg-[#040604] p-2 rounded-xl border border-yellow-500/15">
                            <span className="text-yellow-400 font-bold font-mono mr-1">M{idx + 1}:</span> {mod}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 border-t border-yellow-500/15 flex items-center justify-between gap-3">
                    {(course.modules || (course as any).curriculum) && (course.modules || (course as any).curriculum).length > 0 && (
                      <button
                        onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                        className="text-xs font-mono text-gray-400 hover:text-yellow-400 flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide Modules' : 'Modules'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    <button
                      onClick={() => onOpenAccessModal(course.id)}
                      className="ml-auto px-4 py-2 text-xs font-bold text-black bg-lux-gradient hover:opacity-95 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                      <span className="text-black font-bold">Join with Trader ID</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-black" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        )}

      </div>
    </section>
  );
};
