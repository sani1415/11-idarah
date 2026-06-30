/* Sample data is intentionally disabled.
   The application should display only database-backed data; empty database
   responses should render empty states instead of demo rows. */
(function (g) {
  'use strict';

  g.MMSampleData = {
    defaultSettings: {},
    buildMadrasaSample: function () {
      return {
        mm_classes: [],
        mm_students: [],
        mm_teachers: [],
        mm_settings: {},
      };
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
