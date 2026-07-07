-- Add an optional access URL for Cognitive Prism datasets.

alter table public.prism_datasets
    add column if not exists access_url text;
