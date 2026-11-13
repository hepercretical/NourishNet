export const maxPhotoBytes = 5 * 1024 * 1024;
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function photoError(file) {
  if (!file) return 'Choose a photo.';
  if (!photoTypes.includes(file.type)) return 'Use a JPEG, PNG or WebP image.';
  if (file.size < 1 || file.size > maxPhotoBytes) return 'Use a photo between 1 byte and 5 MB.';
  return '';
}

export function emptySubmission(barcode = '') {
  return {
    barcode,
    productName: '',
    servingBasis: '',
    front: null,
    label: null,
    nutrients: { calories: '', protein: '', fat: '', carbohydrates: '', sodium: '' },
  };
}

export function submissionErrors(draft, { existingPhotos = {} } = {}) {
  const errors = {};
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(draft.barcode.trim()))
    errors.barcode = 'Enter all 8, 12, 13 or 14 barcode digits.';
  if (draft.productName.trim().length > 200) errors.productName = 'Use at most 200 characters.';
  if (draft.servingBasis.trim().length > 100) errors.servingBasis = 'Use at most 100 characters.';
  for (const kind of ['front', 'label']) {
    const error = !draft[kind] && existingPhotos[kind] ? '' : photoError(draft[kind]);
    if (error) errors[kind] = error;
  }
  for (const [name, value] of Object.entries(draft.nutrients)) {
    if (value !== '' && (!/^\d+(?:\.\d{1,4})?$/.test(value) || Number(value) >= 100000000))
      errors[name] = 'Use a nonnegative amount with at most four decimal places.';
  }
  return errors;
}
