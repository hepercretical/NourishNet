-- Plan-14A proposal. NOT approved/applied merely by being present in source.
-- Add source-backed foods and retire fictional catalog entries without deleting
-- foods, servings, barcode mappings, diary snapshots or request history.
BEGIN;

ALTER TABLE foods DROP CONSTRAINT foods_provenance_check;
ALTER TABLE foods ADD CONSTRAINT foods_provenance_check
  CHECK (provenance IN ('synthetic', 'reviewed-submission', 'manufacturer-label'));

ALTER TABLE foods ADD COLUMN catalog_active boolean NOT NULL DEFAULT true;
ALTER TABLE foods ADD COLUMN source_urls jsonb;
ALTER TABLE foods ADD COLUMN source_checked_on date;
ALTER TABLE foods ADD CONSTRAINT foods_manufacturer_source_check CHECK (
  provenance <> 'manufacturer-label' OR (
    source_urls IS NOT NULL AND jsonb_typeof(source_urls) = 'array'
    AND jsonb_array_length(source_urls) BETWEEN 1 AND 5
    AND source_checked_on IS NOT NULL AND isfinite(source_checked_on)
  )
);

UPDATE foods SET catalog_active = false WHERE provenance = 'synthetic';

COMMIT;
