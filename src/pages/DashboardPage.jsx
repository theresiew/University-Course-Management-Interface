import Banner from '../components/Banner.jsx'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx'
import CourseCatalogSection from '../components/CourseCatalogSection.jsx'
import CourseDetailsCard from '../components/CourseDetailsCard.jsx'
import CourseFormCard from '../components/CourseFormCard.jsx'
import DashboardHeader from '../components/DashboardHeader.jsx'
import InfoFooter from '../components/InfoFooter.jsx'
import { useCourseManagement } from '../hooks/useCourseManagement.js'

function DashboardPage() {
  const {
    courses,
    error,
    feedback,
    filteredCourses,
    formMode,
    formValues,
    handleConfirmDelete,
    handleCourseLookup,
    handleCourseLookupFromList,
    handleCreateMode,
    handleEditMode,
    handleLogout,
    handleSubmitCourse,
    isLoadingCourses,
    isLoadingDetail,
    isSubmittingForm,
    lastSyncedAt,
    loadAllCourses,
    lookupId,
    pendingDelete,
    searchTerm,
    selectedCourse,
    session,
    setError,
    setFeedback,
    setFormValues,
    setLookupId,
    setPendingDelete,
    setSearchTerm,
  } = useCourseManagement()

  const summaryStats = [
    { label: 'Tracked courses', value: courses.length },
    { label: 'Visible after filter', value: filteredCourses.length },
    { label: 'Supervisor role', value: session?.role || 'Guest' },
  ]

  const selectedCourseView = selectedCourse
    ? {
        ...selectedCourse,
        createdAtLabel: formatDate(selectedCourse.createdAt),
        updatedAtLabel: formatDate(selectedCourse.updatedAt),
      }
    : null

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_24px_80px_rgba(16,33,61,0.12)]">
          <DashboardHeader onLogout={handleLogout} session={session} />

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <section className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {summaryStats.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-white to-brand-50 p-5"
                  >
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-ink-950">{item.value}</p>
                  </article>
                ))}
              </div>
              {error ? <Banner tone="danger" message={error} /> : null}
              {feedback ? <Banner tone={feedback.tone} message={feedback.text} /> : null}

              <CourseCatalogSection
                filteredCourses={filteredCourses}
                handleCreateMode={handleCreateMode}
                handleCourseLookup={handleCourseLookup}
                handleCourseLookupFromList={handleCourseLookupFromList}
                handleEditMode={handleEditMode}
                isLoadingCourses={isLoadingCourses}
                isLoadingDetail={isLoadingDetail}
                lastSyncedAtLabel={formatDate(lastSyncedAt)}
                loadAllCourses={loadAllCourses}
                lookupId={lookupId}
                searchTerm={searchTerm}
                setLookupId={setLookupId}
                setPendingDelete={setPendingDelete}
                setSearchTerm={setSearchTerm}
              />
            </section>

            <aside className="space-y-6">
              <CourseDetailsCard
                onCopyCourseId={() =>
                  void copyCourseId(selectedCourse.id, setFeedback, setError)
                }
                onLoadIntoForm={() => handleEditMode(selectedCourse)}
                selectedCourse={selectedCourseView}
              />

              <CourseFormCard
                formMode={formMode}
                formValues={formValues}
                isSubmittingForm={isSubmittingForm}
                onClearForm={handleCreateMode}
                onSubmit={handleSubmitCourse}
                setFormValues={setFormValues}
              />
            </aside>
          </div>
        </section>
      </main>

      <ConfirmDeleteModal
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <InfoFooter />
    </>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleString()
}

async function copyCourseId(courseId, setFeedback, setError) {
  try {
    await navigator.clipboard.writeText(courseId)
    setFeedback({
      tone: 'success',
      text: 'Course ID copied to your clipboard.',
    })
  } catch {
    setError('Could not copy the course ID from this browser.')
  }
}

export default DashboardPage
