ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS doc_type TEXT NOT NULL DEFAULT 'resume';
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_doc_type_check;
ALTER TABLE public.resumes ADD CONSTRAINT resumes_doc_type_check CHECK (doc_type IN ('resume','cv_professional','cv_academic'));