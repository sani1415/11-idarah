let students = [];
let classes = []; // Will be loaded from the database
let attendance = {};
let holidays = [];
let academicYearStartDate = null; // Store academic year start date
let savedAttendanceDates = new Set(); // Track which dates have been saved to database
let autoCopiedAttendanceDates = new Set(); // Track which dates were auto-copied


export { academicYearStartDate, attendance, classes, holidays, savedAttendanceDates, autoCopiedAttendanceDates, students }
