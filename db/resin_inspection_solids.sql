CREATE TABLE resin_inspection_solids (
  id integer DEFAULT nextval('resin_inspection_solids_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  sample_time text,
  row_no integer,
  alum_foil_no text,
  wt_alum_foil text,
  wt_glue text,
  wt_alum_foil_dry_glue text,
  wt_dry_glue text,
  solids_content text,
  remark text,
  FOREIGN KEY (document_id) REFERENCES resin_inspection_documents(id)
);