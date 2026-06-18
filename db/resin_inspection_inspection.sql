CREATE TABLE resin_inspection_inspection (
  id integer DEFAULT nextval('resin_inspection_inspection_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  load_no integer,
  cert_test_no text,
  resin_tank text,
  quantity text,
  specific_gravity text,
  viscosity text,
  ph text,
  gel_time text,
  water_tolerance text,
  appearance text,
  solids text,
  FOREIGN KEY (document_id) REFERENCES resin_inspection_documents(id)
);