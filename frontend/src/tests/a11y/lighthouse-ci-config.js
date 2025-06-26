module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'aria-required-attr': 'error',
        'aria-roles': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'meta-viewport': 'error',
        'link-name': 'error',
        'heading-order': 'error',
        'label': 'error',
        'frame-title': 'error',
        'button-name': 'error',
        'form-field-multiple-labels': 'error',
        'tabindex': 'error',
        'accesskeys': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
